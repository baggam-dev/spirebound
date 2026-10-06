import concurrent.futures
import http.client
import json
import sqlite3
import tempfile
import threading
import unittest
from contextlib import closing
from pathlib import Path
from ranking_api import APIError, Ranking, RateLimit, score, serve


class RankingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.now = 1000000
        self.config = dict(season='SPIREBOUND', open=True, versions=['0.34.0-prebeta'],
                           origins=['http://localhost:5173'], blockedNames=['admin', '운영자'])
        self.path = Path(self.temp.name) / 'ranking.sqlite3'
        self.app = Ranking(self.path, self.config, lambda: self.now)
        self.token = self.app.session(None)[1]
        self.run = dict(runId='run-example-0001', seed=17, roomCounts=[7, 8, 7, 8, 7, 8, 7, 8],
                        rulesVersion='ranking-v13', gameVersion='0.34.0-prebeta', seasonId='SPIREBOUND')
        self.app.start(self.token, self.run)
        self.now += 1200000
        self.body = dict(runId=self.run['runId'], nickname='모험가_1', outcome='escaped', kingDefeated=True, finalSealBroken=True,
                         floor=0, practice=False, rulesVersion='ranking-v13', seasonId='SPIREBOUND',
                         gameVersion='0.34.0-prebeta', elapsedMs=1200000,
                         visited=[f'{f}:0' for f in range(8)], defeated=list(range(180)), mainSkill='fire', total=99999999)

    def tearDown(self):
        self.temp.cleanup()

    def reject(self, action, code):
        with self.assertRaises(APIError) as caught:
            action()
        self.assertEqual(caught.exception.code, code)

    def test_score_examples_and_boundary(self):
        self.assertEqual(score(1200000, 180, 60, 80)['total'], 16900)
        self.assertEqual(score(1800000, 300, 80, 80)['total'], 17400)
        self.assertEqual(score(3000000, 450, 80, 80)['total'], 16000)
        self.assertEqual(score(999, 0, 1, 3)['time'], 6000)
        self.assertEqual(score(1000, 0, 1, 3)['time'], 5998)

    def test_single_ranking_accepts_both_maps(self):
        expanded = dict(self.run, runId='run-expanded-0001', roomCounts=self.run['roomCounts'] + [8, 2])
        self.assertEqual(self.app.start(self.token, expanded)['seasonId'], 'SPIREBOUND')
        self.reject(lambda: self.app.start(self.token, dict(expanded, runId='invalid-map-001', roomCounts=[8] * 9)), 'invalid_map')

    def test_expanded_run_requires_final_demon_and_shares_one_ranking(self):
        app = Ranking(self.path, self.config, lambda: self.now)
        rooms = self.run['roomCounts'] + [8, 2]
        expanded = dict(self.run, runId='run-expanded-0001', roomCounts=rooms,
                        rulesVersion='ranking-v13', seasonId='SPIREBOUND')
        app.start(self.token, expanded)
        self.reject(lambda: app.start(self.token, dict(expanded, runId='wrong-rule-0001', rulesVersion='ranking-v12')), 'unsupported_rules')
        self.reject(lambda: app.start(self.token, dict(self.run, runId='wrong-season-0001', seasonId='ASCENT-7')), 'unsupported_rules')
        self.assertEqual(app.leaderboard(self.token, 'SPIREBOUND')['rulesVersion'], 'ranking-v13')
        self.reject(lambda: app.leaderboard(self.token, 'ASCENT-7'), 'season_not_found')
        self.now += 1200000
        expanded_body = dict(self.body, runId=expanded['runId'], rulesVersion='ranking-v13',
                             seasonId='SPIREBOUND', visited=[f'{f}:0' for f in range(10)], finalDemonDefeated=True)
        self.reject(lambda: app.submit(self.token, dict(expanded_body, finalDemonDefeated=False)), 'not_eligible')
        self.reject(lambda: app.submit(self.token, dict(expanded_body, visited=expanded_body['visited'][:-1])), 'invalid_visits')
        result = app.submit(self.token, expanded_body)
        self.assertEqual(result['status'], 'accepted')
        self.assertEqual(app.leaderboard(self.token, 'SPIREBOUND')['mine']['recordId'], result['recordId'])
        beta = app.submit(self.token, self.body)
        board = app.leaderboard(self.token, 'SPIREBOUND')
        self.assertEqual(len(board['entries']), 1)
        self.assertIn(board['mine']['recordId'], [result['recordId'], beta['recordId']])
        self.assertEqual(board['entries'][0]['campaign'], 'expanded')
        self.config['open'] = False
        self.assertFalse(app.leaderboard(self.token, 'SPIREBOUND')['open'])
        self.reject(lambda: app.start(self.token, dict(expanded, runId='closed-0001')), 'season_closed')

    def test_new_expanded_season_keeps_existing_ascent_two_record_read_only(self):
        app = Ranking(self.path, self.config, lambda: self.now)
        old_score = score(1200000, 180, 10, 70)
        with app.connect() as db:
            player_id = db.execute('SELECT id FROM players').fetchone()['id']
            db.execute('INSERT INTO seasons VALUES (?,?,?)', ('ASCENT-2', 'ranking-v3', self.now))
            db.execute('INSERT INTO runs VALUES (?,?,?,?,?,?,?)',
                       ('old-expanded-run', player_id, 'ASCENT-2', '0.34.0-prebeta', 17,
                        json.dumps([7, 8, 7, 8, 7, 8, 7, 8, 8, 2]), self.now - 1200000))
            db.execute('INSERT INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                       ('old-expanded-record', 'old-expanded-run', player_id, 'ASCENT-2', '옛모험가',
                        old_score['total'], 1200000, self.now, 'accepted', None, 'fire', json.dumps(old_score)))
        reopened = Ranking(self.path, self.config, lambda: self.now)
        self.reject(lambda: reopened.leaderboard(self.token, 'ASCENT-2'), 'season_not_found')
        with reopened.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM records WHERE season=?', ('ASCENT-2',)).fetchone()[0], 1)
        self.assertEqual(reopened.leaderboard(self.token, 'SPIREBOUND')['entries'], [])

    def test_new_classic_and_expanded_seasons_preserve_both_previous_boards(self):
        app = Ranking(self.path, self.config, lambda: self.now)
        with app.connect() as db:
            player_id = db.execute('SELECT id FROM players').fetchone()['id']
            for season, run_id, record_id, rooms in [
                ('BETA-1', 'old-beta-run', 'old-beta-record', self.run['roomCounts']),
                ('ASCENT-3', 'old-ascent-run', 'old-ascent-record', self.run['roomCounts'] + [8, 2])
            ]:
                db.execute('INSERT INTO seasons VALUES (?,?,?)', (season, 'old-rules', self.now))
                db.execute('INSERT INTO runs VALUES (?,?,?,?,?,?,?)',
                           (run_id, player_id, season, '0.34.0-prebeta', 17,
                            json.dumps(rooms), self.now - 1200000))
                db.execute('INSERT INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                           (record_id, run_id, player_id, season, '기존기록', 17000,
                            1200000, self.now, 'accepted', None, 'fire', '{}'))
        for old in ['BETA-1', 'ASCENT-3']:
            self.reject(lambda old=old: app.leaderboard(self.token, old), 'season_not_found')
        self.assertTrue(app.leaderboard(self.token, 'SPIREBOUND')['open'])
        self.assertEqual(app.leaderboard(self.token, 'SPIREBOUND')['entries'], [])

    def test_recompute_and_restart_persistence(self):
        receipt = self.app.submit(self.token, self.body)
        self.assertEqual(receipt['status'], 'accepted')
        self.assertEqual(receipt['score'], score(1200000, 180, 8, 60))
        restarted = Ranking(self.path, self.config, lambda: self.now)
        board = restarted.leaderboard(self.token, 'SPIREBOUND')
        self.assertEqual(board['mine']['recordId'], receipt['recordId'])
        self.assertEqual(board['entries'][0]['rank'], 1)
        self.assertNotIn('player_id', board['entries'][0])
        with restarted.connect() as db:
            self.assertNotEqual(db.execute('SELECT token_hash FROM players').fetchone()[0], self.token)
        self.assertIsNone(restarted.leaderboard(None, 'SPIREBOUND')['mine'])

    def test_precision_build_is_accepted_in_new_season(self):
        receipt = self.app.submit(self.token, dict(self.body, mainSkill='precision'))
        self.assertEqual(receipt['status'], 'accepted')
        self.assertEqual(self.app.leaderboard(self.token, 'SPIREBOUND')['entries'][0]['mainSkill'], 'precision')

    def test_newest_prior_seasons_are_read_only_and_keep_records(self):
        app = Ranking(self.path, self.config, lambda: self.now)
        with app.connect() as db:
            player_id = db.execute('SELECT id FROM players').fetchone()['id']
            for season, rules, rooms in [('BETA-3', 'ranking-v7', self.run['roomCounts']),
                                         ('ASCENT-5', 'ranking-v8', self.run['roomCounts'] + [8, 2])]:
                db.execute('INSERT INTO seasons VALUES (?,?,?)', (season, rules, self.now))
                db.execute('INSERT INTO runs VALUES (?,?,?,?,?,?,?)',
                           (season + '-old-run', player_id, season, '0.31.0-prebeta', 17,
                            json.dumps(rooms), self.now - 1200000))
                db.execute('INSERT INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                           (season + '-old-record', season + '-old-run', player_id, season, '기존기록',
                            17000, 1200000, self.now, 'accepted', None, 'fire', '{}'))
        for season, rules in [('BETA-3', 'ranking-v7'), ('ASCENT-5', 'ranking-v8')]:
            self.reject(lambda season=season: app.leaderboard(self.token, season), 'season_not_found')

    def test_run_identity_and_idempotent_submission_even_after_close(self):
        original_start = self.app.start(self.token, self.run)
        self.assertEqual(original_start['startedAt'], 1000000)
        self.reject(lambda: self.app.start(self.token, dict(self.run, seed=20)), 'run_conflict')
        receipt = self.app.submit(self.token, self.body)
        self.config['open'] = False
        self.assertEqual(self.app.submit(self.token, dict(self.body, nickname='수정이름', elapsedMs=1)), receipt)

    def test_concurrent_retries_create_one_record(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            receipts = list(pool.map(lambda _: self.app.submit(self.token, self.body), range(6)))
        self.assertEqual(len({r['recordId'] for r in receipts}), 1)
        with self.app.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM records').fetchone()[0], 1)

    def test_best_per_player_and_time_tiebreak(self):
        self.app.submit(self.token, self.body)
        other = self.app.session(None)[1]
        for token, run_id, elapsed in [(self.token, 'run-second-0001', 1199999), (other, 'run-third-00001', 1199998)]:
            self.app.start(token, dict(self.run, runId=run_id))
            self.now += 1200000
            self.app.submit(token, dict(self.body, runId=run_id, elapsedMs=elapsed))
        board = self.app.leaderboard(self.token, 'SPIREBOUND')
        self.assertEqual(len(board['entries']), 2)
        self.assertEqual(self.app.leaderboard(None, 'SPIREBOUND')['entries'], board['entries'])
        self.assertEqual(self.app.leaderboard(other, 'SPIREBOUND')['entries'], board['entries'])
        self.assertEqual(board['mine']['rank'], 2)
        self.assertEqual(board['mine']['elapsedMs'], 1199999)

    def test_top_100_still_returns_my_rank_outside_cutoff(self):
        self.app.submit(self.token, self.body)
        with self.app.connect() as db:
            template = list(db.execute('SELECT * FROM records').fetchone())
            for i in range(105):
                player_id, run_id = f'player-{i}', f'fixture-{i}'
                db.execute('INSERT INTO players VALUES (?,?,?,?)', (player_id, f'hash-{i}', 0, self.now + 1))
                db.execute('INSERT INTO runs VALUES (?,?,?,?,?,?,?)', (run_id, player_id, 'SPIREBOUND', '0.34.0-prebeta', i, '[]', 0))
                row = template[:]
                row[0], row[1], row[2], row[5] = f'record-{i:03d}', run_id, player_id, 22000
                db.execute('INSERT INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', row)
        board = self.app.leaderboard(self.token, 'SPIREBOUND')
        self.assertEqual(len(board['entries']), 100)
        self.assertEqual(board['mine']['rank'], 106)
        self.assertEqual(board['entries'][0]['recordId'], 'record-000')

    def test_only_current_ranking_is_visible_and_session_expires(self):
        self.app.submit(self.token, self.body)
        self.reject(lambda: self.app.leaderboard(self.token, 'BETA-5'), 'season_not_found')
        self.assertEqual(len(self.app.leaderboard(self.token, 'SPIREBOUND')['entries']), 1)
        self.now += 366 * 86400000
        self.assertIsNone(self.app.leaderboard(self.token, 'SPIREBOUND')['mine'])

    def test_cross_player_access_and_missing_server_run(self):
        other = self.app.session(None)[1]
        self.reject(lambda: self.app.start(other, self.run), 'run_conflict')
        self.reject(lambda: self.app.submit(other, self.body), 'run_not_found')
        self.reject(lambda: self.app.submit(None, self.body), 'session_required')
        self.reject(lambda: self.app.submit(self.token, dict(self.body, runId='old-local-save')), 'run_not_found')

    def test_invalid_eligibility_events_and_metrics(self):
        for change, code in [({'practice': True}, 'not_eligible'), ({'outcome': 'dead'}, 'not_eligible'),
                             ({'kingDefeated': False}, 'not_eligible'), ({'finalSealBroken': False}, 'not_eligible'), ({'floor': False}, 'not_eligible'),
                             ({'elapsedMs': True}, 'invalid_time'), ({'elapsedMs': 99999999}, 'impossible_time'),
                             ({'visited': ['0:0', '0:0']}, 'invalid_visits'),
                             ({'visited': ['0:99']}, 'invalid_visits'), ({'defeated': [1, 1]}, 'invalid_kills'),
                             ({'defeated': [-1]}, 'invalid_kills'), ({'mainSkill': []}, 'invalid_build'),
                             ({'gameVersion': 'old'}, 'version_mismatch')]:
            self.reject(lambda: self.app.submit(self.token, dict(self.body, **change)), code)

    def test_suspicious_record_is_private_and_held(self):
        receipt = self.app.submit(self.token, dict(self.body, elapsedMs=1000))
        self.assertEqual(receipt['status'], 'held')
        self.assertEqual(self.app.leaderboard(self.token, 'SPIREBOUND')['entries'], [])

    def test_nickname_normalization_and_filter(self):
        self.assertEqual(self.app.nickname('  가나  '), '가나')
        for value in ['a', '<script>', '이 름', '😀😀', '1234567890123', 'Admin1', '운영자_1']:
            with self.assertRaises(APIError):
                self.app.nickname(value)

    def test_closed_season_and_version_rejection(self):
        self.config['open'] = False
        self.reject(lambda: self.app.submit(self.token, self.body), 'season_closed')
        self.reject(lambda: self.app.start(self.token, self.run), 'season_closed')
        self.config['open'] = True
        self.config['versions'] = ['future']
        self.reject(lambda: self.app.submit(self.token, self.body), 'unsupported_version')

    def test_backup_contains_records(self):
        self.app.submit(self.token, self.body)
        backup = Path(self.temp.name) / 'backup.sqlite3'
        with self.app.connect() as source, closing(sqlite3.connect(backup)) as target:
            source.backup(target)
        with closing(sqlite3.connect(backup)) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM records').fetchone()[0], 1)

    def test_http_csrf_body_auth_and_rate_limit(self):
        server = serve(self.app, 0)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        def request(method, path, payload=None, headers=None):
            connection = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=5)
            connection.request(method, path, payload, headers or {})
            response = connection.getresponse()
            result = response.status, dict(response.getheaders()), json.loads(response.read())
            connection.close()
            return result
        try:
            headers = {'Origin': 'http://localhost:5173', 'Content-Type': 'application/json'}
            self.assertEqual(request('GET', '/api/health')[0], 200)
            status, response_headers, _ = request('POST', '/api/session', '{}', headers)
            self.assertEqual(status, 200)
            self.assertIn('HttpOnly', response_headers['Set-Cookie'])
            self.assertEqual(request('POST', '/api/session', '{}', dict(headers, Origin='https://evil.test'))[0], 403)
            self.assertEqual(request('POST', '/api/session', '{}', {'Origin': headers['Origin']})[0], 415)
            self.assertEqual(request('POST', '/api/runs', json.dumps(self.run), headers)[0], 401)
            authenticated = dict(headers, Cookie='spirebound_player=' + self.token)
            self.assertEqual(request('POST', '/api/runs', json.dumps(self.run), authenticated)[0], 200)
            self.assertEqual(request('POST', '/api/records', json.dumps(self.body), authenticated)[2]['status'], 'accepted')
            self.assertEqual(request('GET', '/api/rankings', headers=authenticated)[2]['mine']['rank'], 1)
            self.assertEqual(request('POST', '/api/session', '{', headers)[0], 400)
            self.assertEqual(request('POST', '/api/session', '{"x":NaN}', headers)[0], 400)
            self.assertEqual(request('POST', '/api/session', '{}', dict(headers, **{'Content-Length': '131073'}))[0], 413)
            self.assertEqual(request('GET', '/api/records')[0], 405)
            self.assertEqual(request('GET', '/api/rankings?season=unknown')[0], 404)
            limiter = RateLimit()
            self.assertTrue(all(limiter.allow('test', 'records') for _ in range(30)))
            self.assertFalse(limiter.allow('test', 'records'))
        finally:
            server.shutdown()
            server.server_close()
            worker.join()


if __name__ == '__main__':
    unittest.main()

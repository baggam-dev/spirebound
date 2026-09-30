"""Spirebound beta ranking API. Python 3.9+, standard library only."""
import argparse
import hashlib
import json
import os
import re
import secrets
import sqlite3
import threading
import time
import unicodedata
import uuid
from contextlib import contextmanager, closing
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

RULES = 'ranking-v1'
EXPANDED_RULES = 'ranking-v4'
LEGACY_EXPANDED_RULES = 'ranking-v2'
LEGACY_EXPANDED_SEASON = 'ASCENT-1'
PREVIOUS_EXPANDED_RULES = 'ranking-v3'
PREVIOUS_EXPANDED_SEASON = 'ASCENT-2'
COOKIE = 'spirebound_player'
MAX_BODY = 131072
MAIN_SKILLS = {'fire', 'frost', 'poison', 'chain'}
ORDER = 'score DESC, elapsed_ms ASC, submitted_ms ASC, id ASC'


class APIError(Exception):
    def __init__(self, status, code):
        self.status, self.code = status, code


def require(condition, code='invalid_request', status=400):
    if not condition:
        raise APIError(status, code)


def integer(value, low, high):
    return type(value) is int and low <= value <= high


def score(elapsed_ms, kills, visited, total_rooms):
    parts = dict(escape=10000, combat=min(4000, kills * 10),
                 exploration=2000 * visited // total_rooms,
                 time=max(0, 6000 - elapsed_ms // 1000 * 2))
    return dict(parts, total=sum(parts.values()))


class Ranking:
    def __init__(self, database, config, clock=lambda: int(time.time() * 1000)):
        self.database, self.config, self.clock = str(database), config, clock
        Path(database).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('PRAGMA journal_mode=WAL')
            db.executescript('''
                CREATE TABLE IF NOT EXISTS seasons (
                    id TEXT PRIMARY KEY, rules TEXT NOT NULL, created_ms INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS players (
                    id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL,
                    created_ms INTEGER NOT NULL, expires_ms INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id),
                    season TEXT NOT NULL REFERENCES seasons(id), version TEXT NOT NULL,
                    seed INTEGER NOT NULL, rooms TEXT NOT NULL, started_ms INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS records (
                    id TEXT PRIMARY KEY, run_id TEXT UNIQUE NOT NULL REFERENCES runs(id),
                    player_id TEXT NOT NULL REFERENCES players(id), season TEXT NOT NULL,
                    nickname TEXT NOT NULL, score INTEGER NOT NULL, elapsed_ms INTEGER NOT NULL,
                    submitted_ms INTEGER NOT NULL, status TEXT NOT NULL,
                    reason TEXT, main_skill TEXT NOT NULL, snapshot TEXT NOT NULL);
                CREATE INDEX IF NOT EXISTS records_order ON records(season,status,score DESC,elapsed_ms,submitted_ms,id);
                CREATE INDEX IF NOT EXISTS records_player ON records(player_id,season);
                PRAGMA user_version=1;
            ''')
            db.execute('INSERT OR IGNORE INTO seasons VALUES (?,?,?)',
                       (config['season'], RULES, self.clock()))
            if config.get('expandedSeason'):
                db.execute('INSERT OR IGNORE INTO seasons VALUES (?,?,?)',
                           (config['expandedSeason'], EXPANDED_RULES, self.clock()))
                db.execute('INSERT OR IGNORE INTO seasons VALUES (?,?,?)',
                           (LEGACY_EXPANDED_SEASON, LEGACY_EXPANDED_RULES, self.clock()))
                db.execute('INSERT OR IGNORE INTO seasons VALUES (?,?,?)',
                           (PREVIOUS_EXPANDED_SEASON, PREVIOUS_EXPANDED_RULES, self.clock()))

    def active_season(self, season):
        if season == self.config.get('expandedSeason'):
            return EXPANDED_RULES, self.config.get('expandedOpen', False)
        if season == self.config['season']:
            return RULES, self.config['open']
        return None, False

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.database, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys=ON')
        try:
            with db:
                yield db
        finally:
            db.close()

    def player(self, token, db):
        if not isinstance(token, str) or not re.fullmatch(r'[A-Za-z0-9_-]{43}', token):
            return None
        return db.execute('SELECT id FROM players WHERE token_hash=? AND expires_ms>?',
                          (hashlib.sha256(token.encode()).hexdigest(), self.clock())).fetchone()

    def session(self, token):
        with self.connect() as db:
            existing = self.player(token, db)
            if existing:
                return {'active': True}, None
            token, identity = secrets.token_urlsafe(32), str(uuid.uuid4())
            db.execute('INSERT INTO players VALUES (?,?,?,?)',
                       (identity, hashlib.sha256(token.encode()).hexdigest(), self.clock(),
                        self.clock() + 365 * 86400000))
        return {'active': True}, token

    def authenticated(self, token, db):
        player = self.player(token, db)
        require(player is not None, 'session_required', 401)
        return player['id']

    def start(self, token, body):
        require(isinstance(body, dict))
        run_id, rooms = body.get('runId'), body.get('roomCounts')
        require(isinstance(run_id, str) and re.fullmatch(r'[A-Za-z0-9_-]{8,80}', run_id))
        require(integer(body.get('seed'), 0, 4294967295))
        season = body.get('seasonId')
        rules, opened = self.active_season(season)
        classic_map = isinstance(rooms, list) and len(rooms) == 8 and rooms[7] == 8 and all(
            integer(n, 7 if i % 2 == 0 else 8, 10 if i % 2 == 0 else 11) for i, n in enumerate(rooms))
        expanded_map = isinstance(rooms, list) and len(rooms) == 10 and rooms[7] == 8 and rooms[9] == 2 and all(
            integer(n, 7 if i % 2 == 0 else 8, 10 if i % 2 == 0 else 11) for i, n in enumerate(rooms[:8])) and integer(rooms[8], 8, 11)
        require(classic_map if rules == RULES else expanded_map if rules == EXPANDED_RULES else False, 'invalid_map')
        require(body.get('rulesVersion') == rules, 'unsupported_rules')
        require(body.get('gameVersion') in self.config['versions'], 'unsupported_version')
        require(opened, 'season_closed', 409)
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            identity = self.authenticated(token, db)
            previous = db.execute('SELECT * FROM runs WHERE id=?', (run_id,)).fetchone()
            if previous:
                require(previous['player_id'] == identity, 'run_conflict', 409)
                require(previous['seed'] == body['seed'] and json.loads(previous['rooms']) == rooms and
                        previous['season'] == body['seasonId'] and previous['version'] == body['gameVersion'],
                        'run_conflict', 409)
                return {'runId': run_id, 'startedAt': previous['started_ms'], 'seasonId': previous['season']}
            now = self.clock()
            db.execute('INSERT INTO runs VALUES (?,?,?,?,?,?,?)',
                       (run_id, identity, season, body['gameVersion'], body['seed'], json.dumps(rooms), now))
            return {'runId': run_id, 'startedAt': now, 'seasonId': season}

    def nickname(self, value):
        require(isinstance(value, str), 'invalid_nickname')
        value = unicodedata.normalize('NFC', value.strip())
        require(re.fullmatch(r'[가-힣A-Za-z0-9_]{2,12}', value), 'invalid_nickname')
        require(not any(word.casefold() in value.casefold() for word in self.config['blockedNames']), 'nickname_unavailable')
        return value

    def submit(self, token, body):
        require(isinstance(body, dict) and isinstance(body.get('runId'), str))
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            identity = self.authenticated(token, db)
            run = db.execute('SELECT * FROM runs WHERE id=? AND player_id=?', (body['runId'], identity)).fetchone()
            require(run is not None, 'run_not_found', 404)
            previous = db.execute('SELECT * FROM records WHERE run_id=?', (run['id'],)).fetchone()
            # A retry never changes the original name, timestamp, or score, even after season close.
            if previous:
                return self.receipt(previous)
            rules, opened = self.active_season(run['season'])
            require(opened, 'season_closed', 409)
            require(run['version'] in self.config['versions'], 'unsupported_version', 409)
            require(body.get('rulesVersion') == rules and body.get('seasonId') == run['season'] and
                    body.get('gameVersion') == run['version'], 'version_mismatch')
            require(body.get('outcome') == 'escaped' and body.get('kingDefeated') is True and
                    integer(body.get('floor'), 0, 0) and body.get('practice') is False, 'not_eligible')
            if rules == EXPANDED_RULES:
                require(body.get('finalDemonDefeated') is True, 'not_eligible')
            nickname = self.nickname(body.get('nickname'))
            elapsed, visited, defeated = body.get('elapsedMs'), body.get('visited'), body.get('defeated')
            rooms = json.loads(run['rooms'])
            require(integer(elapsed, 1, 31536000000), 'invalid_time')
            require(elapsed <= self.clock() - run['started_ms'] + 5000, 'impossible_time')
            require(isinstance(visited, list) and len(visited) <= sum(rooms) and
                    all(isinstance(k, str) for k in visited) and len(set(visited)) == len(visited), 'invalid_visits')
            valid_rooms = {f'{f}:{r}' for f, count in enumerate(rooms) for r in range(count)}
            require(set(visited) <= valid_rooms and '0:0' in visited and
                    {k.split(':')[0] for k in visited} == {str(i) for i in range(len(rooms))}, 'invalid_visits')
            require(isinstance(defeated, list) and len(defeated) <= 10000 and
                    all(integer(k, 0, 999999) for k in defeated) and len(set(defeated)) == len(defeated), 'invalid_kills')
            require(isinstance(body.get('mainSkill'), str) and body['mainSkill'] in MAIN_SKILLS, 'invalid_build')
            parts = score(elapsed, len(defeated), len(visited), sum(rooms))
            reason = 'implausible_metrics' if elapsed < 120000 or len(defeated) > 3000 or len(defeated) < 10 else None
            status = 'held' if reason else 'accepted'
            snapshot = dict(parts, elapsedMs=elapsed, kills=len(defeated), visited=visited, defeated=defeated,
                            totalRooms=sum(rooms), seed=run['seed'], gameVersion=run['version'], rulesVersion=rules)
            record_id = str(uuid.uuid4())
            db.execute('INSERT INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                       (record_id, run['id'], identity, run['season'], nickname, parts['total'], elapsed,
                        self.clock(), status, reason, body['mainSkill'], json.dumps(snapshot, separators=(',', ':'))))
            return self.receipt(db.execute('SELECT * FROM records WHERE id=?', (record_id,)).fetchone())

    @staticmethod
    def receipt(row):
        snap = json.loads(row['snapshot'])
        return {'recordId': row['id'], 'runId': row['run_id'], 'seasonId': row['season'],
                'status': row['status'], 'nickname': row['nickname'], 'submittedAt': row['submitted_ms'],
                'score': {k: snap[k] for k in ('escape', 'combat', 'exploration', 'time', 'total')}}

    def leaderboard(self, token, season):
        with self.connect() as db:
            entry = db.execute('SELECT rules FROM seasons WHERE id=?', (season,)).fetchone()
            require(entry, 'season_not_found', 404)
            player = self.player(token, db)
            query = f'''WITH best AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY {ORDER}) AS pick
                         FROM records WHERE season=? AND status='accepted'),
                         ranked AS (SELECT *, ROW_NUMBER() OVER (ORDER BY {ORDER}) AS rank FROM best WHERE pick=1)
                         SELECT * FROM ranked WHERE rank<=100 OR player_id=? ORDER BY rank'''
            rows = db.execute(query, (season, player['id'] if player else '')).fetchall()
            def public(row):
                return {'rank': row['rank'], 'recordId': row['id'], 'nickname': row['nickname'],
                        'score': row['score'], 'elapsedMs': row['elapsed_ms'], 'mainSkill': row['main_skill']}
            return {'seasonId': season, 'rulesVersion': entry['rules'],
                    'open': self.active_season(season)[1],
                    'entries': [public(r) for r in rows if r['rank'] <= 100],
                    'mine': next((public(r) for r in rows if player and r['player_id'] == player['id']), None)}


class RateLimit:
    def __init__(self):
        self.lock, self.buckets = threading.Lock(), {}

    def allow(self, ip, group):
        limit, duration = {'session': (20, 3600), 'runs': (60, 3600), 'records': (30, 3600), 'read': (120, 60)}[group]
        now = time.monotonic()
        with self.lock:
            self.buckets = {k: v for k, v in self.buckets.items() if v[1] > now}
            key = (ip, group)
            if key not in self.buckets:
                if len(self.buckets) >= 10000:
                    return False
                self.buckets[key] = [0, now + duration]
            bucket = self.buckets[key]
            bucket[0] += 1
            return bucket[0] <= limit


class Handler(BaseHTTPRequestHandler):
    server_version = 'Spirebound'

    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, fmt, *args):
        # No cookies, identifiers, nickname payloads, or client IPs in logs.
        pass

    def send_json(self, status, body, token=None):
        token = token or getattr(self, 'refresh_token', None)
        raw = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if token:
            secure = '; Secure' if self.server.app.config.get('secureCookie', False) else ''
            self.send_header('Set-Cookie', f'{COOKIE}={token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=31536000{secure}')
        self.end_headers()
        self.wfile.write(raw)

    def handle_api(self):
        app = self.server.app
        try:
            parsed = urlsplit(self.path)
            path = parsed.path
            if self.command == 'GET' and path == '/api/health':
                with app.connect() as db:
                    db.execute('SELECT 1 FROM seasons LIMIT 1').fetchone()
                self.send_json(200, {'ok': True})
                return
            endpoints = {'/api/session': 'session', '/api/runs': 'runs', '/api/records': 'records'}
            group = endpoints.get(path, 'read')
            # Nginx overwrites this header; API binds only to loopback.
            ip = self.headers.get('X-Real-IP', self.client_address[0])
            require(self.server.limits.allow(ip, group), 'rate_limited', 429)
            jar = SimpleCookie()
            try:
                jar.load(self.headers.get('Cookie', ''))
                token = jar[COOKIE].value if COOKIE in jar else None
            except Exception:
                token = None
            if token and app.config.get('secureCookie', False):
                with app.connect() as db:
                    if app.player(token, db):
                        self.refresh_token = token
            if path == '/api/rankings':
                require(self.command == 'GET', 'method_not_allowed', 405)
                season = parse_qs(parsed.query).get('season', [app.config['season']])[0]
                self.send_json(200, app.leaderboard(token, season))
                return
            require(path in endpoints, 'not_found', 404)
            require(self.command == 'POST', 'method_not_allowed', 405)
            require(self.headers.get('Origin') in app.config['origins'] and
                    self.headers.get('Sec-Fetch-Site') != 'cross-site', 'origin_rejected', 403)
            require(self.headers.get('Content-Type', '').split(';')[0].strip() == 'application/json', 'json_required', 415)
            require(not self.headers.get('Transfer-Encoding'), 'invalid_length')
            length = self.headers.get('Content-Length', '')
            require(length.isdigit() and 0 < int(length) <= MAX_BODY, 'body_too_large', 413)
            def invalid_constant(_):
                raise ValueError('Non-finite JSON number')
            body = json.loads(self.rfile.read(int(length)), parse_constant=invalid_constant)
            require(isinstance(body, dict))
            if path == '/api/session':
                result, new_token = app.session(token)
                self.send_json(200, result, new_token)
            elif path == '/api/runs':
                self.send_json(200, app.start(token, body))
            else:
                self.send_json(200, app.submit(token, body))
        except APIError as error:
            self.send_json(error.status, {'error': error.code})
        except (ValueError, UnicodeError):
            self.send_json(400, {'error': 'invalid_json'})
        except sqlite3.Error:
            self.send_json(503, {'error': 'storage_unavailable'})
        except (TimeoutError, ConnectionError):
            self.close_connection = True
        except Exception:
            self.send_json(500, {'error': 'internal_error'})

    do_GET = handle_api
    do_POST = handle_api
    do_PUT = handle_api
    do_DELETE = handle_api
    do_OPTIONS = handle_api


def serve(app, port=8787):
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.app, server.limits = app, RateLimit()
    return server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--database', default='/var/lib/spirebound-api/ranking.sqlite3')
    parser.add_argument('--config', default=str(Path(__file__).with_name('config.json')))
    parser.add_argument('--port', type=int, default=8787)
    parser.add_argument('--backup')
    args = parser.parse_args()
    if args.backup:
        destination = Path(args.backup)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(args.database)) as source, closing(sqlite3.connect(destination)) as target:
            source.backup(target)
        os.chmod(destination, 0o600)
        return
    app = Ranking(args.database, json.loads(Path(args.config).read_text(encoding='utf-8')))
    serve(app, args.port).serve_forever()


if __name__ == '__main__':
    main()

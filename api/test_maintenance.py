import tempfile
import unittest
from pathlib import Path
from ranking_api import Ranking
from maintenance import snapshot, check_database


class MaintenanceTests(unittest.TestCase):
    def test_snapshot_retention_restore_and_source_unchanged(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            database = root / 'live.sqlite3'
            app = Ranking(database, dict(season='BETA-1'))
            app.session(None)
            before = check_database(database)
            backups = root / 'backups'
            backups.mkdir()
            unrelated = backups / 'manual.sqlite3'
            unrelated.write_text('preserve me')
            for _ in range(4):
                path, counts = snapshot(database, backups, keep=2)
                self.assertEqual(counts, before)
                self.assertEqual(check_database(path), before)
            self.assertEqual(len(list(backups.glob('daily-*.sqlite3'))), 2)
            self.assertEqual(unrelated.read_text(), 'preserve me')
            self.assertEqual(check_database(database), before)

    def test_missing_or_corrupt_source_cannot_replace_good_backup(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with self.assertRaises(FileNotFoundError):
                snapshot(root / 'missing', root / 'backups')
            bad = root / 'bad.sqlite3'
            bad.write_text('not sqlite')
            with self.assertRaises(Exception):
                snapshot(bad, root / 'backups')
            self.assertEqual(list((root / 'backups').iterdir()), [])

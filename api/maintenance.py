"""Atomic SQLite snapshots, bounded retention and isolated restore rehearsal."""
import argparse
import os
import re
import sqlite3
import tempfile
import uuid
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path


def check_database(path):
    with closing(sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro', uri=True)) as db:
        if db.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
            raise RuntimeError('Backup integrity check failed')
        if db.execute('PRAGMA foreign_key_check').fetchall():
            raise RuntimeError('Backup foreign key check failed')
        return {table: db.execute('SELECT COUNT(*) FROM ' + table).fetchone()[0]
                for table in ('seasons', 'players', 'runs', 'records')}


def snapshot(database, directory, keep=14):
    if not 2 <= keep <= 365:
        raise ValueError('keep must be between 2 and 365')
    source, directory = Path(database).resolve(strict=True), Path(directory).resolve()
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    name = 'daily-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8] + '.sqlite3'
    target = directory / name
    fd, temporary = tempfile.mkstemp(prefix='.snapshot-', dir=directory)
    os.close(fd)
    try:
        with closing(sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)) as src, closing(sqlite3.connect(temporary)) as dst:
            src.backup(dst)
        expected = check_database(temporary)
        # Restore into a disposable database; never replace or stop the live DB.
        with tempfile.TemporaryDirectory(prefix='spirebound-restore-') as scratch:
            restored = Path(scratch) / 'restored.sqlite3'
            with closing(sqlite3.connect(temporary)) as src, closing(sqlite3.connect(restored)) as dst:
                src.backup(dst)
            if check_database(restored) != expected:
                raise RuntimeError('Restore rehearsal differs from snapshot')
        os.chmod(temporary, 0o600)
        os.replace(temporary, target)
        candidates = sorted(p for p in directory.iterdir() if re.fullmatch(r'daily-\d{8}T\d{6}Z-[a-f0-9]{8}\.sqlite3', p.name)
                            and p.is_file() and not p.is_symlink())
        # Retain the just-created snapshot even when multiple runs share a second.
        older = [p for p in candidates if p != target]
        for old in older[:max(0, len(candidates) - keep)]:
            if old.resolve().parent != directory:
                raise RuntimeError('Backup path escaped retention directory')
            old.unlink()
        return target, expected
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--database', default='/var/lib/spirebound-api/ranking.sqlite3')
    parser.add_argument('--directory', default='/var/lib/spirebound-api/backups')
    parser.add_argument('--keep', type=int, default=14)
    args = parser.parse_args()
    path, counts = snapshot(args.database, args.directory, args.keep)
    print('Snapshot and restore rehearsal OK:', path.name, counts)

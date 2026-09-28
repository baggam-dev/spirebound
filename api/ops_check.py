"""Read-only scheduled checks; failures appear as a failed systemd service."""
import json
import subprocess
import time
from pathlib import Path
from urllib.request import urlopen


def main():
    with urlopen('http://127.0.0.1:8787/api/health', timeout=10) as response:
        if json.load(response).get('ok') is not True:
            raise RuntimeError('Ranking health failed')
    snapshots = list(Path('/var/lib/spirebound-api/backups').glob('daily-*.sqlite3'))
    if not snapshots or time.time() - max(p.stat().st_mtime for p in snapshots) > 36 * 3600:
        raise RuntimeError('Daily backup is missing or older than 36 hours')
    if Path('/etc/spirebound-https-enabled').exists():
        subprocess.run(['openssl', 'x509', '-checkend', '172800', '-noout', '-in',
                        '/etc/letsencrypt/live/spirebound-ip/fullchain.pem'], check=True)
        subprocess.run(['systemctl', 'is-active', '--quiet', 'spirebound-cert-renew.timer'], check=True)
    print('API, backup freshness and enabled TLS certificate checks passed')


if __name__ == '__main__':
    main()

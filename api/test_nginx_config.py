import unittest
from nginx_config import render


class NginxTests(unittest.TestCase):
    def test_plain_config_preserves_acme_and_api(self):
        config = render('168.107.21.43')
        self.assertIn('acme-challenge/', config)
        self.assertIn('proxy_pass http://127.0.0.1:8787', config)
        self.assertNotIn('listen 443', config)

    def test_secure_config_keeps_transfer_page_and_certificate_outside_release(self):
        config = render('168.107.21.43', True)
        self.assertIn('listen 443 ssl', config)
        for asset in ['src/persistence/upgrade.js', 'src/persistence/upgrade-transfer.js', 'styles/pixel-theme.css', 'assets/fonts/pixel-font.woff2']:
            self.assertIn('location = /' + asset + ' { try_files $uri =404; }', config)
        self.assertIn('location = / { try_files /upgrade.html', config)
        self.assertIn('/etc/letsencrypt/live/spirebound-ip/fullchain.pem', config)
        self.assertIn('return 308 https://168.107.21.43$request_uri', config)
        with self.assertRaises(ValueError):
            render('127.0.0.1; include evil')

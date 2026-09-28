"""Generate HTTP or HTTPS configuration without disabling data-transfer landing."""
import argparse
import ipaddress


def render(address, secure=False):
    address = str(ipaddress.IPv4Address(address))
    root = '/usr/share/nginx/spirebound-current'
    acme = 'location ^~ /.well-known/acme-challenge/ { root /usr/share/nginx/spirebound-acme; default_type text/plain; }'
    application = '''
    location /api/ {
        limit_req zone=spirebound_api burst=20 nodelay;
        limit_req_status 429;
        client_max_body_size 128k;
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 3s;
        proxy_read_timeout 15s;
    }
    location / { try_files $uri $uri/ =404; }
'''
    headers = 'add_header Cache-Control "no-cache" always;\n    add_header X-Content-Type-Options "nosniff" always;'
    config = 'limit_req_zone $binary_remote_addr zone=spirebound_api:10m rate=5r/s;\n'
    config += f'server {{\n    listen 80;\n    server_name {address};\n    root {root};\n    index index.html;\n    {headers}\n    {acme}\n'
    if not secure:
        return config + application + '}\n'
    config += '''    location = / { try_files /upgrade.html =404; }
    location = /index.html { try_files /upgrade.html =404; }
    location = /upgrade.html { try_files $uri =404; }
    location = /src/persistence/upgrade.js { try_files $uri =404; }
    location = /src/persistence/upgrade-transfer.js { try_files $uri =404; }
    location = /styles/pixel-theme.css { try_files $uri =404; }
    location = /assets/fonts/pixel-font.woff2 { try_files $uri =404; }
'''
    config += f'    location / {{ return 308 https://{address}$request_uri; }}\n}}\n'
    config += f'''server {{
    listen 443 ssl;
    server_name {address};
    root {root};
    index index.html;
    ssl_certificate /etc/letsencrypt/live/spirebound-ip/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/spirebound-ip/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:spirebound_tls:10m;
    {headers}
{application}}}
'''
    return config


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('address')
    parser.add_argument('--secure', action='store_true')
    args = parser.parse_args()
    print(render(args.address, args.secure))

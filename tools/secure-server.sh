#!/usr/bin/env bash
# Prepare a trusted IP certificate and renewals; activation remains an explicit deploy flag.
set -euo pipefail
address=$1
[[ "$address" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
dnf -y --disablerepo='*' --enablerepo=ol9_appstream --enablerepo=ol9_baseos_latest install python3.12 python3.12-pip
if [[ ! -x /opt/spirebound-certbot/bin/certbot ]]; then
  python3.12 -m venv /opt/spirebound-certbot
  /opt/spirebound-certbot/bin/pip install 'certbot>=5.4,<6'
fi
certbot=/opt/spirebound-certbot/bin/certbot
"$certbot" --version
install -d -m 755 /usr/share/nginx/spirebound-acme/.well-known/acme-challenge
restorecon -R /usr/share/nginx/spirebound-acme
common=(certonly --non-interactive --agree-tos --register-unsafely-without-email --preferred-profile shortlived --webroot --webroot-path /usr/share/nginx/spirebound-acme --ip-address "$address" --cert-name spirebound-ip)
if [[ ! -f /etc/letsencrypt/live/spirebound-ip/fullchain.pem ]]; then
  "$certbot" "${common[@]}" --staging --config-dir /etc/letsencrypt-staging --work-dir /var/lib/letsencrypt-staging --logs-dir /var/log/letsencrypt-staging
  "$certbot" "${common[@]}"
fi
openssl x509 -noout -subject -dates -in /etc/letsencrypt/live/spirebound-ip/fullchain.pem
install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/spirebound-nginx.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
/usr/sbin/nginx -t
/usr/bin/systemctl reload nginx
EOF
chmod 750 /etc/letsencrypt/renewal-hooks/deploy/spirebound-nginx.sh
cat > /etc/systemd/system/spirebound-cert-renew.service <<EOF
[Unit]
Description=Renew Spirebound short-lived IP certificate
After=network-online.target
[Service]
Type=oneshot
ExecStart=$certbot renew --quiet
EOF
cat > /etc/systemd/system/spirebound-cert-renew.timer <<'EOF'
[Unit]
Description=Twice-daily Spirebound certificate renewal check
[Timer]
OnCalendar=*-*-* 00,12:00:00 UTC
RandomizedDelaySec=1800
Persistent=true
[Install]
WantedBy=timers.target
EOF
restorecon -R /etc/letsencrypt /etc/systemd/system/spirebound-cert-renew.{service,timer}
systemctl daemon-reload
systemctl enable --now spirebound-cert-renew.timer
firewall-cmd --permanent --add-service=https
firewall-cmd --add-service=https
if [[ ! -f /etc/spirebound-https-enabled ]]; then
  cat > /etc/nginx/conf.d/spirebound-tls-probe.conf <<EOF
server {
    listen 443 ssl;
    server_name $address;
    ssl_certificate /etc/letsencrypt/live/spirebound-ip/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/spirebound-ip/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    location = /api/health { proxy_pass http://127.0.0.1:8787; }
    location / { return 503; }
}
EOF
  restorecon /etc/nginx/conf.d/spirebound-tls-probe.conf
  nginx -t
  systemctl reload nginx
fi
ready=0
for attempt in 1 2 3 4 5; do
  if curl --fail --silent --show-error --resolve "$address:443:127.0.0.1" "https://$address/api/health"; then ready=1; break; fi
  sleep 1
done
[[ "$ready" == 1 ]]
"$certbot" renew --cert-name spirebound-ip --dry-run
echo 'TLS prepared. Verify public HTTPS reachability, then deploy with -EnableHttps.'

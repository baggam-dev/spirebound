#!/usr/bin/env bash
set -euo pipefail
stage=$1
release=$2
address=$3
enable_https=${4:-false}
[[ "$enable_https" == true || "$enable_https" == false ]]
tls_marker=/etc/spirebound-https-enabled
had_tls=0
[[ ! -f "$tls_marker" ]] || had_tls=1
secure=0
if [[ "$had_tls" == 1 || "$enable_https" == true ]]; then
  openssl x509 -checkend 86400 -noout -in /etc/letsencrypt/live/spirebound-ip/fullchain.pem
  secure=1
fi
[[ "$release" =~ ^release-[0-9]{8}-[0-9]{6}-[a-f0-9]{6}$ ]]
[[ "$stage" == "/tmp/spirebound-$release" ]]
[[ "$address" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
base=/usr/share/nginx/spirebound-releases
current=/usr/share/nginx/spirebound-current
config=/etc/nginx/conf.d/spirebound.conf
api_base=/opt/spirebound-api-releases
api_current=/opt/spirebound-api-current
unit=/etc/systemd/system/spirebound-api.service
mkdir -p "$api_base"
mkdir "$api_base/$release"
tar -xzf "$stage/api.tar.gz" -C "$api_base/$release" --no-same-owner
chmod 755 "$api_base" "$api_base/$release"
find "$api_base/$release" -type f -exec chmod 644 {} +
python3 -c 'import ast,sys; ast.parse(open(sys.argv[1]).read())' "$api_base/$release/ranking_api.py"
python3 -B -m unittest discover -s "$api_base/$release" -p 'test_*.py'
python3 - "$api_base/$release/config.json" "$address" "$secure" <<'PY'
import json,sys
path,address,secure=sys.argv[1:]
config=json.load(open(path))
config['secureCookie']=secure=='1'
config['origins']=[('https://' if secure=='1' else 'http://')+address]
with open(path,'w') as output: json.dump(config,output,ensure_ascii=False)
PY
id spirebound-api >/dev/null 2>&1 || useradd --system --home-dir /var/lib/spirebound-api --shell /sbin/nologin spirebound-api
install -d -m 700 -o spirebound-api -g spirebound-api /var/lib/spirebound-api /var/lib/spirebound-api/backups
if [[ -f /var/lib/spirebound-api/ranking.sqlite3 ]]; then
  python3 "$api_base/$release/ranking_api.py" --backup "/var/lib/spirebound-api/backups/$release.sqlite3"
  chown spirebound-api:spirebound-api "/var/lib/spirebound-api/backups/$release.sqlite3"
fi
mkdir -p "$base"
mkdir "$base/$release"
tar -xzf "$stage/site.tar.gz" -C "$base/$release" --no-same-owner
chmod 755 "$base" "$base/$release"
find "$base/$release" -type f -exec chmod 644 {} +
restorecon -R "$base"
previous=$(readlink "$current" || true)
api_previous=$(readlink "$api_current" || true)
had_unit=0
if [[ -f "$unit" ]]; then cp -p "$unit" "$stage/previous.service"; had_unit=1; fi
network_previous=$(getsebool httpd_can_network_connect | awk '{print $3}')
had_config=0
if [[ -f "$config" ]]; then cp -p "$config" "$stage/previous.conf"; had_config=1; fi
probe=/etc/nginx/conf.d/spirebound-tls-probe.conf
if [[ -f "$probe" ]]; then cp -p "$probe" "$stage/previous-probe.conf"; fi
ops_units=(spirebound-backup.service spirebound-backup.timer spirebound-ops-check.service spirebound-ops-check.timer)
for item in "${ops_units[@]}"; do
  if [[ -f "/etc/systemd/system/$item" ]]; then cp -p "/etc/systemd/system/$item" "$stage/$item"; fi
done
rollback() {
  trap - ERR
  if [[ -n "$api_previous" ]]; then ln -sfn "$api_previous" "$api_current.next"; mv -Tf "$api_current.next" "$api_current"; else rm -f "$api_current"; fi
  if [[ "$had_unit" == 1 ]]; then cp -p "$stage/previous.service" "$unit"; systemctl daemon-reload; systemctl restart spirebound-api; else systemctl disable --now spirebound-api || true; rm -f "$unit"; systemctl daemon-reload; fi
  if [[ "$network_previous" == off ]]; then setsebool -P httpd_can_network_connect off; fi
  if [[ -n "$previous" ]]; then ln -sfn "$previous" "$current.next"; mv -Tf "$current.next" "$current"; else rm -f "$current"; fi
  if [[ "$had_config" == 1 ]]; then cp -p "$stage/previous.conf" "$config"; else rm -f "$config"; fi
  if [[ "$had_tls" == 0 ]]; then rm -f "$tls_marker"; fi
  if [[ -f "$stage/previous-probe.conf" ]]; then cp -p "$stage/previous-probe.conf" "$probe"; fi
  for item in "${ops_units[@]}"; do
    if [[ -f "$stage/$item" ]]; then cp -p "$stage/$item" "/etc/systemd/system/$item"; else systemctl disable --now "$item" 2>/dev/null || true; rm -f "/etc/systemd/system/$item"; fi
  done
  systemctl daemon-reload
  nginx -t && systemctl reload nginx
  echo 'Deployment failed; previous configuration restored.' >&2
}
trap rollback ERR
if [[ "$secure" == 1 ]]; then touch "$tls_marker"; rm -f "$probe"; fi
ln -s "$api_base/$release" "$api_current.next"
mv -Tf "$api_current.next" "$api_current"
cat > "$unit" <<EOF
[Unit]
Description=Spirebound ranking API
After=network.target
[Service]
Type=simple
User=spirebound-api
Group=spirebound-api
ExecStart=/usr/bin/python3 -B $api_current/ranking_api.py
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/spirebound-api
[Install]
WantedBy=multi-user.target
EOF
restorecon -R "$api_base" "$unit"
systemctl daemon-reload
systemctl enable spirebound-api
systemctl restart spirebound-api
api_ready=0
for attempt in 1 2 3 4 5; do
  if curl --fail --silent http://127.0.0.1:8787/api/health > "$stage/api-health"; then api_ready=1; break; fi
  sleep 1
done
[[ "$api_ready" == 1 ]]
if [[ "$network_previous" == off ]]; then setsebool -P httpd_can_network_connect on; fi
ln -s "$base/$release" "$current.next"
mv -Tf "$current.next" "$current"
install -d -m 755 /usr/share/nginx/spirebound-acme/.well-known/acme-challenge
restorecon -R /usr/share/nginx/spirebound-acme
scheme=http
render_args=()
if [[ "$secure" == 1 ]]; then scheme=https; render_args=(--secure); fi
python3 "$api_current/nginx_config.py" "$address" "${render_args[@]}" > "$config"
restorecon "$config" "$current"
nginx -t
systemctl reload nginx
verify_asset() {
  local asset=$1
  # Reload returns before old workers have all stopped accepting connections.
  for attempt in 1 2 3 4 5; do
    if curl --fail --silent --show-error -H "Host: $address" --resolve "$address:80:127.0.0.1" --resolve "$address:443:127.0.0.1" "$scheme://$address/$asset" -o "$stage/asset-check" && cmp -s "$base/$release/$asset" "$stage/asset-check"; then return 0; fi
    sleep 1
  done
  echo "Verification failed: $asset" >&2
  return 1
}
for asset in index.html game.js mobile.css skill-preview.js hit-feedback.js; do verify_asset "$asset"; done
curl --fail --silent --show-error -H "Host: $address" --resolve "$address:80:127.0.0.1" --resolve "$address:443:127.0.0.1" "$scheme://$address/api/health" > "$stage/api-health"
python3 -c 'import json,sys; assert json.load(open(sys.argv[1]))["ok"] is True' "$stage/api-health"
cat > /etc/systemd/system/spirebound-backup.service <<EOF
[Unit]
Description=Spirebound daily database backup and restore rehearsal
[Service]
Type=oneshot
User=spirebound-api
Group=spirebound-api
ExecStart=/usr/bin/python3 -B $api_current/maintenance.py
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/spirebound-api
EOF
cat > /etc/systemd/system/spirebound-backup.timer <<'EOF'
[Unit]
Description=Daily Spirebound backup
[Timer]
OnCalendar=*-*-* 02:00:00 UTC
RandomizedDelaySec=900
Persistent=true
[Install]
WantedBy=timers.target
EOF
cat > /etc/systemd/system/spirebound-ops-check.service <<EOF
[Unit]
Description=Spirebound API backup and certificate checks
[Service]
Type=oneshot
ExecStart=/usr/bin/python3 -B $api_current/ops_check.py
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
EOF
cat > /etc/systemd/system/spirebound-ops-check.timer <<'EOF'
[Unit]
Description=Check Spirebound operational health
[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
[Install]
WantedBy=timers.target
EOF
restorecon /etc/systemd/system/spirebound-{backup,ops-check}.{service,timer}
systemctl daemon-reload
systemctl start spirebound-backup.service
systemctl start spirebound-ops-check.service
systemctl enable --now spirebound-backup.timer spirebound-ops-check.timer
trap - ERR
echo "Release $release active. Previous release: ${previous:-original Nginx root}"

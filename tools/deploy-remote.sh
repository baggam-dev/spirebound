#!/usr/bin/env bash
set -euo pipefail
stage=$1
release=$2
address=$3
[[ "$release" =~ ^release-[0-9]{8}-[0-9]{6}-[a-f0-9]{6}$ ]]
[[ "$stage" == "/tmp/spirebound-$release" ]]
[[ "$address" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
base=/usr/share/nginx/spirebound-releases
current=/usr/share/nginx/spirebound-current
config=/etc/nginx/conf.d/spirebound.conf
mkdir -p "$base"
mkdir "$base/$release"
tar -xzf "$stage/site.tar.gz" -C "$base/$release" --no-same-owner
chmod 755 "$base" "$base/$release"
find "$base/$release" -type f -exec chmod 644 {} +
restorecon -R "$base"
previous=$(readlink "$current" || true)
had_config=0
if [[ -f "$config" ]]; then cp -p "$config" "$stage/previous.conf"; had_config=1; fi
rollback() {
  if [[ -n "$previous" ]]; then ln -sfn "$previous" "$current.next"; mv -Tf "$current.next" "$current"; else rm -f "$current"; fi
  if [[ "$had_config" == 1 ]]; then cp -p "$stage/previous.conf" "$config"; else rm -f "$config"; fi
  nginx -t && systemctl reload nginx
  echo 'Deployment failed; previous configuration restored.' >&2
}
trap rollback ERR
ln -s "$base/$release" "$current.next"
mv -Tf "$current.next" "$current"
cat > "$config" <<EOF
server {
    listen 80;
    server_name $address;
    root $current;
    index index.html;
    add_header Cache-Control "no-cache" always;
    add_header X-Content-Type-Options "nosniff" always;
    location / { try_files \$uri \$uri/ =404; }
}
EOF
restorecon "$config" "$current"
nginx -t
systemctl reload nginx
verify_asset() {
  local asset=$1
  # Reload returns before old workers have all stopped accepting connections.
  for attempt in 1 2 3 4 5; do
    if curl --fail --silent --show-error -H "Host: $address" "http://127.0.0.1/$asset" -o "$stage/asset-check" && cmp -s "$base/$release/$asset" "$stage/asset-check"; then return 0; fi
    sleep 1
  done
  echo "Verification failed: $asset" >&2
  return 1
}
for asset in index.html game.js mobile.css skill-preview.js hit-feedback.js; do verify_asset "$asset"; done
trap - ERR
echo "Release $release active. Previous release: ${previous:-original Nginx root}"

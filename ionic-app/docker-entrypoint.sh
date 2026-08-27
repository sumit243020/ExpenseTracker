#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-80}"
API_URL="${API_URL:-}"

# Normalize API URL (Render host may omit scheme)
if [[ -n "$API_URL" && "$API_URL" != http://* && "$API_URL" != https://* ]]; then
  API_URL="https://${API_URL}"
fi
API_URL="${API_URL%/}"

# Render injects PORT; rewrite nginx listen port
sed "s/\${PORT}/${PORT}/g" /etc/nginx/conf.d/default.conf > /tmp/default.conf
cp /tmp/default.conf /etc/nginx/conf.d/default.conf

# Runtime config for Angular
mkdir -p /usr/share/nginx/html/assets
cat > /usr/share/nginx/html/assets/config.json <<EOF
{"apiUrl":"${API_URL}"}
EOF

echo "ExpenseTracker UI starting on :${PORT} apiUrl=${API_URL:-<empty/offline>}"
exec "$@"

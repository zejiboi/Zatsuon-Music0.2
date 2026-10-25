#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# ZATSUON // ZEJI v2.0 — Automated VM Deployment & Free Domain Provisioner
# Target VM Fixed IPs: 192.168.0.188 | 192.168.0.110 | 192.168.10.124
# Public Floating IP (if attached): 102.164.62.65
# ==============================================================================

APP_DIR="${APP_DIR:-$(pwd)}"
PORT="${PORT:-3000}"

echo "=================================================================="
echo "  ZATSUON // ZEJI — VM DEPLOYMENT & FREE DOMAIN PROVISIONING"
echo "=================================================================="

cd "$APP_DIR"

# 1. Pull latest changes if inside a git repository
if [ -d ".git" ]; then
  echo "[1/5] Fetching latest updates from Git..."
  git fetch --all --prune || true
fi

# 2. Install dependencies & build production bundle
echo "[2/5] Installing dependencies and building production bundle..."
npm install --prefer-offline --ignore-scripts
npm run build

# 3. Ensure encryption key persists in .env
if [ ! -f ".env" ] || ! grep -q "VAULT_MASTER_SECRET=" ".env"; then
  echo "[3/5] Generating persistent AES-256-GCM VAULT_MASTER_SECRET in .env..."
  GENERATED_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  echo "VAULT_MASTER_SECRET=${GENERATED_SECRET}" >> .env
  chmod 600 .env
else
  echo "[3/5] Existing VAULT_MASTER_SECRET verified in .env."
fi

# 4. Configure systemd service if running on Linux VM with systemd
if command -v systemctl >/dev/null 2>&1; then
  echo "[4/5] Configuring systemd service (zatsuon.service)..."
  sudo tee /etc/systemd/system/zatsuon.service >/dev/null <<EOF
[Unit]
Description=Zatsuon Music Official Manga Audio & E-Commerce Platform
After=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${PORT}
EnvironmentFile=-${APP_DIR}/.env
ExecStart=$(command -v node) ${APP_DIR}/dist/server.cjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable zatsuon.service
  sudo systemctl restart zatsuon.service
fi

# 5. Configure Caddy Reverse Proxy & Free sslip.io / nip.io Domains
if command -v caddy >/dev/null 2>&1; then
  echo "[5/5] Updating Caddyfile for free sslip.io / nip.io domains..."
  sudo cp "${APP_DIR}/Caddyfile" /etc/caddy/Caddyfile
  sudo systemctl reload caddy || sudo systemctl restart caddy
fi

echo ""
echo "=================================================================="
echo "  DEPLOYMENT COMPLETE // FREE DOMAIN URLS ACTIVE:"
echo "  - LAN Domain 1: http://zatsuon.192.168.0.188.sslip.io"
echo "  - LAN Domain 2: http://zatsuon.192.168.0.110.sslip.io"
echo "  - LAN Domain 3: http://zatsuon.192.168.10.124.sslip.io"
echo "  - Public HTTPS: https://zatsuon.102.164.62.65.sslip.io"
echo "=================================================================="

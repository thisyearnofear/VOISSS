#!/bin/bash
# VOISSS Backend Deploy — local build, rsync artifact, symlink swap
# Usage: ./deploy.sh [--rollback]
#
# Model:
#   - Rsyncs src/ + package files to a timestamped release dir on server
#   - Runs npm ci --omit=dev on server (needed for native binaries like sharp)
#   - Symlinks .env and logs from shared location
#   - Atomic symlink swap of /opt/voisss-processing/current
#   - Restarts pm2 processes
#   - Keeps 2 previous releases for rollback
#
# Rollback: ./deploy.sh --rollback
#   Swaps current symlink to the previous release and restarts pm2.

set -euo pipefail

SERVER="snel-bot"
DEPLOY_PATH="/opt/voisss-processing"
RELEASES_DIR="${DEPLOY_PATH}/releases"
SHARED_ENV="${DEPLOY_PATH}/.env"
SHARED_LOGS="${DEPLOY_PATH}/logs"
KEEP_RELEASES=3  # current + 2 rollbacks
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Rollback mode ---
if [[ "${1:-}" == "--rollback" ]]; then
  echo "=== Rolling back ==="
  ssh "$SERVER" bash -s <<'ROLLBACK'
    set -euo pipefail
    DEPLOY_PATH="/opt/voisss-processing"
    CURRENT=$(readlink "$DEPLOY_PATH/current")
    CURRENT_NAME=$(basename "$CURRENT")

    cd "$DEPLOY_PATH/releases"
    PREVIOUS=$(ls -1t | grep -v "$CURRENT_NAME" | head -1)

    if [ -z "$PREVIOUS" ]; then
      echo "No previous release to roll back to."
      exit 1
    fi

    echo "Rolling back: $CURRENT_NAME -> $PREVIOUS"
    sudo ln -sfn "$DEPLOY_PATH/releases/$PREVIOUS" "$DEPLOY_PATH/current"

    cd "$DEPLOY_PATH/current"
    pm2 restart voisss-server voisss-export-worker
    sleep 3
    curl -sf http://localhost:5577/health && echo " OK" || echo " FAILED"
ROLLBACK
  exit $?
fi

# --- Deploy mode ---
COMMIT=$(git -C "$SCRIPT_DIR/../.." rev-parse --short HEAD 2>/dev/null || echo "unknown")
RELEASE_NAME="release-$(date +%Y%m%d-%H%M%S)-${COMMIT}"

echo "=== Deploying ${RELEASE_NAME} ==="
echo "Server: ${SERVER}"
echo ""

# 1. Create release dir on server
echo "[1/5] Creating release directory..."
ssh "$SERVER" "mkdir -p ${RELEASES_DIR}/${RELEASE_NAME}/src ${SHARED_LOGS}"

# 2. Rsync source + package files
echo "[2/5] Syncing files..."
rsync -az --delete \
  "${SCRIPT_DIR}/src/" \
  "${SERVER}:${RELEASES_DIR}/${RELEASE_NAME}/src/"

rsync -az \
  "${SCRIPT_DIR}/package.json" \
  "${SCRIPT_DIR}/package-lock.json" \
  "${SCRIPT_DIR}/ecosystem.config.js" \
  "${SERVER}:${RELEASES_DIR}/${RELEASE_NAME}/"

# 3. Install deps + symlink shared resources on server
echo "[3/5] Installing dependencies on server..."
ssh "$SERVER" bash -s <<REMOTE
  set -euo pipefail
  cd ${RELEASES_DIR}/${RELEASE_NAME}
  npm ci --omit=dev --ignore-scripts=false 2>&1 | tail -3
  ln -sf ${SHARED_ENV} .env
  ln -sf ${SHARED_LOGS} logs
REMOTE

# 4. Atomic symlink swap
echo "[4/5] Swapping symlink..."
ssh "$SERVER" "sudo ln -sfn ${RELEASES_DIR}/${RELEASE_NAME} ${DEPLOY_PATH}/current"

# 5. Restart pm2
echo "[5/5] Restarting services..."
ssh "$SERVER" bash -s <<'RESTART'
  set -euo pipefail
  cd /opt/voisss-processing/current
  pm2 delete voisss-server voisss-export-worker 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
  sleep 3
  if curl -sf http://localhost:5577/health > /dev/null; then
    echo "Health check: OK"
  else
    echo "Health check: FAILED — check pm2 logs voisss-server"
    exit 1
  fi
RESTART

# 6. Cleanup old releases (keep KEEP_RELEASES)
echo ""
echo "Cleaning old releases (keeping ${KEEP_RELEASES})..."
ssh "$SERVER" bash -s <<CLEANUP
  set -euo pipefail
  cd ${RELEASES_DIR}
  CURRENT_NAME=\$(basename \$(readlink ${DEPLOY_PATH}/current))
  ls -1t | grep -v "\$CURRENT_NAME" | tail -n +${KEEP_RELEASES} | while read old; do
    echo "  Removing: \$old"
    rm -rf "\$old"
  done
CLEANUP

echo ""
echo "=== Deploy complete: ${RELEASE_NAME} ==="
echo "Health: https://voisss.famile.xyz/health"

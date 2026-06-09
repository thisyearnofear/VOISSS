#!/bin/bash
# VOISSS Backend Deploy — build locally, rsync artifact, symlink swap
#
# Space-optimized flow:
#   1. Build locally (npm ci + npm run build)
#   2. Rsync only the built artifact to server
#   3. Symlink .env and logs from shared location
#   4. Atomic symlink swap of /opt/voisss-processing/current
#   5. Restart pm2 processes
#   6. Health check with retry
#
# Usage:
#   ./deploy.sh              # Full deploy (build + push)
#   ./deploy.sh --push       # Skip build, push existing dist/
#   ./deploy.sh --rollback   # Swap to previous release
#   ./deploy.sh --cleanup    # Remove old releases

set -euo pipefail

SERVER="snel-bot"
DEPLOY_PATH="/opt/voisss-processing"
RELEASES_DIR="${DEPLOY_PATH}/releases"
SHARED_ENV="${DEPLOY_PATH}/.env"
SHARED_LOGS="${DEPLOY_PATH}/logs"
KEEP_RELEASES=3
HEALTH_RETRIES=5
HEALTH_INTERVAL=2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../.."
DIST_DIR="${SCRIPT_DIR}/dist"

# --- Helpers ---
info()  { echo -e "\033[36m→ $*\033[0m"; }
ok()    { echo -e "\033[32m✓ $*\033[0m"; }
fail()  { echo -e "\033[31m✗ $*\033[0m"; exit 1; }

health_check() {
  local attempt=1
  while [ $attempt -le $HEALTH_RETRIES ]; do
    if curl -sf http://localhost:5577/health > /dev/null 2>&1; then
      ok "Health check passed (attempt $attempt)"
      return 0
    fi
    info "Health check attempt $attempt/$HEALTH_RETRIES failed, waiting ${HEALTH_INTERVAL}s..."
    sleep $HEALTH_INTERVAL
    attempt=$((attempt + 1))
  done
  fail "Health check failed after $HEALTH_RETRIES attempts"
}

# --- Rollback mode ---
if [[ "${1:-}" == "--rollback" ]]; then
  info "Rolling back..."
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
ROLLBACK
  health_check
  exit $?
fi

# --- Cleanup mode ---
if [[ "${1:-}" == "--cleanup" ]]; then
  info "Cleaning old releases (keeping $KEEP_RELEASES)..."
  ssh "$SERVER" bash -s <<CLEANUP
    set -euo pipefail
    cd ${RELEASES_DIR}
    CURRENT_NAME=\$(basename \$(readlink ${DEPLOY_PATH}/current))
    ls -1t | grep -v "\$CURRENT_NAME" | tail -n +${KEEP_RELEASES} | while read old; do
      echo "  Removing: \$old"
      rm -rf "\$old"
    done
CLEANUP
  ok "Cleanup done"
  exit 0
fi

# --- Deploy mode ---
COMMIT=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")
RELEASE_NAME="release-$(date +%Y%m%d-%H%M%S)-${COMMIT}"

info "Deploy: ${RELEASE_NAME}"
info "Server: ${SERVER}"
echo ""

# 1. Build locally (unless --push flag)
if [[ "${1:-}" != "--push" ]]; then
  info "[1/6] Building locally..."

  # Clean previous dist
  rm -rf "$DIST_DIR"
  mkdir -p "$DIST_DIR"

  # Install production deps only
  cd "$SCRIPT_DIR"
  npm ci --omit=dev --ignore-scripts=false 2>&1 | tail -3

  # Copy built files to dist/
  cp package.json package-lock.json ecosystem.config.js "$DIST_DIR/"
  cp -r src "$DIST_DIR/src/"
  cp -r node_modules "$DIST_DIR/node_modules/"

  # Calculate artifact size
  ARTIFACT_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
  ok "Build complete (${ARTIFACT_SIZE})"
else
  if [[ ! -d "$DIST_DIR" ]]; then
    fail "No dist/ directory found. Run without --push first."
  fi
  info "[1/6] Skipping build, using existing dist/"
fi

# 2. Create release dir on server
info "[2/6] Creating release directory..."
ssh "$SERVER" "mkdir -p ${RELEASES_DIR}/${RELEASE_NAME} ${SHARED_LOGS}"

# 3. Rsync the built artifact
info "[3/6] Syncing artifact..."
rsync -az --delete \
  "${DIST_DIR}/" \
  "${SERVER}:${RELEASES_DIR}/${RELEASE_NAME}/"

# 4. Symlink shared resources
info "[4/6] Linking shared resources..."
ssh "$SERVER" bash -s <<REMOTE
  set -euo pipefail
  cd ${RELEASES_DIR}/${RELEASE_NAME}
  ln -sf ${SHARED_ENV} .env
  ln -sf ${SHARED_LOGS} logs
REMOTE

# 5. Atomic symlink swap + restart
info "[5/6] Swapping symlink and restarting..."
ssh "$SERVER" bash -s <<'RESTART'
  set -euo pipefail
  DEPLOY_PATH="/opt/voisss-processing"
  sudo ln -sfn "$DEPLOY_PATH/releases/$(basename RELEASE_NAME_PLACEHOLDER)" "$DEPLOY_PATH/current"
  cd "$DEPLOY_PATH/current"
  pm2 delete voisss-server voisss-export-worker 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
RESTART
# Fix the RELEASE_NAME placeholder (heredoc can't expand both local and remote vars)
ssh "$SERVER" "sudo ln -sfn ${RELEASES_DIR}/${RELEASE_NAME} ${DEPLOY_PATH}/current"
ssh "$SERVER" bash -c "cd ${DEPLOY_PATH}/current && pm2 delete voisss-server voisss-export-worker 2>/dev/null; pm2 start ecosystem.config.js && pm2 save"

# 6. Health check with retry
info "[6/6] Running health check..."
ssh "$SERVER" bash -s <<HEALTH
  set -euo pipefail
  attempt=1
  while [ \$attempt -le ${HEALTH_RETRIES} ]; do
    if curl -sf http://localhost:5577/health > /dev/null 2>&1; then
      echo "Health check passed (attempt \$attempt)"
      exit 0
    fi
    echo "Health check attempt \$attempt/${HEALTH_RETRIES} failed, waiting ${HEALTH_INTERVAL}s..."
    sleep ${HEALTH_INTERVAL}
    attempt=\$((attempt + 1))
  done
  echo "Health check failed after ${HEALTH_RETRIES} attempts"
  exit 1
HEALTH

# 7. Cleanup old releases
info "Cleaning old releases (keeping $KEEP_RELEASES)..."
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
ok "Deploy complete: ${RELEASE_NAME}"
echo "  Artifact: ${ARTIFACT_SIZE:-'skipped'}"
echo "  Health: https://voisss.famile.xyz/health"
echo "  Rollback: ./deploy.sh --rollback"

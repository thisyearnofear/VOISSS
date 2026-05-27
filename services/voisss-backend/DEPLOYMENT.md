# VOISSS Backend Deployment Guide

## Deployment Method: Rsync + Symlink Swap

This service uses **rsync-based deployments** with atomic symlink switching:

- **Source is rsynced** from local/CI to the server (no tarball artifacts)
- **`npm ci` runs on-server** (required for native binaries like `sharp` on linux-x64)
- **Symlink switching** enables atomic updates and instant rollbacks
- **Automatic cleanup** keeps the current + 2 previous releases

### Server Directory Structure

```
/opt/voisss-processing/
├── releases/
│   ├── release-20260527-184033-f5b1766/
│   └── ...
├── current -> releases/release-...  (symlink)
├── .env                             (shared config, not in repo)
└── logs/                            (shared logs)
```

## Quick Deploy

```bash
cd services/voisss-backend
./deploy.sh            # deploy latest code
./deploy.sh --rollback # revert to previous release
```

## CI/CD

Automated via GitHub Actions on push to `services/voisss-backend/**`.

### Required GitHub Secrets

1. **HETZNER_HOST** — Server hostname or IP
2. **VOISSS_DEPLOY_KEY** — SSH private key for `deploy` user

### SSH Key Setup

```bash
ssh-keygen -t ed25519 -C "deploy-voisss" -f deploy_key
# Add deploy_key to GitHub secrets as VOISSS_DEPLOY_KEY
# Add deploy_key.pub to server: ~deploy/.ssh/authorized_keys
```

## Infrastructure

| Service | How | Port | Notes |
|---------|-----|------|-------|
| Node.js API | pm2 `voisss-server` | 5577 | Express, ElevenLabs proxy, blockchain routes |
| Export Worker | pm2 `voisss-export-worker` | — | FFmpeg processing queue |
| PostgreSQL | Host-level (apt) | 5432 | `voisss` database, `voisss_user` role |
| Redis | Docker `voisss-redis` | 6380 | Export job queue, 64MB max |
| Nginx | SSL termination | 443 | `voisss.famile.xyz` → localhost:5577 |

### Public URL

```
https://voisss.famile.xyz/health
```

## First-Time Server Setup

### 1. Directory Structure
```bash
sudo mkdir -p /opt/voisss-processing/{releases,logs}
sudo chown deploy:deploy /opt/voisss-processing
```

### 2. PostgreSQL
```bash
sudo -u postgres psql -c "CREATE USER voisss_user WITH PASSWORD '<password>' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE voisss OWNER voisss_user;"
```

### 3. Redis
```bash
sudo docker run -d --name voisss-redis --restart unless-stopped \
  -p 127.0.0.1:6380:6379 \
  -v voisss-redis-data:/data \
  redis:7-alpine redis-server --appendonly yes --maxmemory 64mb --maxmemory-policy allkeys-lru
```

### 4. Environment
```bash
cp .env.example /opt/voisss-processing/.env
# Edit with real values
sudo chmod 640 /opt/voisss-processing/.env
sudo chown root:deploy /opt/voisss-processing/.env
```

### 5. First Deploy
```bash
./deploy.sh
```

### 6. PM2 Auto-Start
```bash
pm2 startup   # generates systemd service
pm2 save      # saves current process list
```

### 7. Nginx
```bash
# Config is at /etc/nginx/sites-enabled/voisss
# SSL via certbot for voisss.famile.xyz
sudo nginx -t && sudo systemctl reload nginx
```

## Operations

### View Logs
```bash
ssh snel-bot "pm2 logs voisss-server --lines 50"
ssh snel-bot "pm2 logs voisss-export-worker --lines 50"
```

### Restart
```bash
ssh snel-bot "pm2 restart voisss-server voisss-export-worker"
```

### Monitor
```bash
ssh snel-bot "pm2 monit"
```

### Rollback
```bash
./deploy.sh --rollback
```

## Export Service

```bash
# Check Redis connectivity
ssh snel-bot "redis-cli -p 6380 ping"

# Check queue depth
ssh snel-bot "redis-cli -p 6380 LLEN bull:voisss-export:"

# Check job counts
ssh snel-bot "psql -h localhost -U voisss_user -d voisss \
  -c \"SELECT status, COUNT(*) FROM export_jobs GROUP BY status;\""
```

## Troubleshooting

### Service won't start
```bash
pm2 logs voisss-server --lines 50
pm2 logs voisss-export-worker --lines 50
```

### Database connection failed
```bash
# Verify postgres is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U voisss_user -d voisss -c "SELECT 1"
```

### Worker not processing
```bash
# Check Redis
redis-cli -p 6380 ping

# Check worker process
pm2 status | grep export
```

## Cleanup & Maintenance

```bash
# Old releases are auto-cleaned by deploy.sh (keeps 3)

# Delete old completed export jobs (>7 days)
psql -h localhost -U voisss_user -d voisss \
  -c "DELETE FROM export_jobs WHERE created_at < NOW() - INTERVAL '7 days' AND status IN ('completed', 'failed');"

# Clear old temp files
find /tmp/voisss-exports -type f -mtime +1 -delete 2>/dev/null

# Check disk space
df -h /
```

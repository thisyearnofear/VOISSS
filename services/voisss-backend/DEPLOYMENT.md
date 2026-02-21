# VOISSS Backend Deployment Guide

## Deployment Method: Artifact-Based with Releases Symlink

This service uses **immutable artifact-based deployments** for efficiency and reliability:

- **CI builds the artifact** (including `node_modules/`) - no server-side npm install
- **Server runs releases** from timestamped directories
- **Symlink switching** enables atomic updates and instant rollbacks
- **Automatic cleanup** keeps only the last 5 releases

### Server Directory Structure

```
/opt/voisss-processing/
├── releases/
│   ├── release-2026-02-22_10-30-00-abc1234/
│   ├── release-2026-02-21_15-20-00-def5678/
│   └── ...
├── current -> releases/release-2026-02-22_10-30-00-abc1234  (symlink)
├── .env                    (shared config)
├── logs/                   (shared logs, symlinked into releases)
└── data/                   (if any local state)
```

## CI/CD Setup

This service uses GitHub Actions for automated deployment.

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

1. **HETZNER_SSH_KEY** - Your SSH private key for server access
2. **HETZNER_HOST** - Your server hostname or IP
3. **HETZNER_USER** - SSH username (usually 'root')
4. **VOISSS_DEPLOY_PATH** - Deployment path on server (e.g., `/opt/voisss-processing`)

### How to Set Up Secrets

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret:

```
Name: HETZNER_SSH_KEY
Value: [Your SSH private key content]

Name: HETZNER_HOST
Value: your-server-hostname.com

Name: HETZNER_USER
Value: root

Name: VOISSS_DEPLOY_PATH
Value: /opt/voisss-processing
```

### SSH Key Setup

Generate a deployment key if you don't have one:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-deploy-voisss" -f ~/.ssh/github_deploy_voisss

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy_voisss.pub user@your-server

# Copy private key content for GitHub secret
cat ~/.ssh/github_deploy_voisss
```

## Manual Deployment

If you need to deploy manually:

```bash
# 1. Build the artifact locally (on a Linux machine or CI)
cd services/voisss-backend
npm ci --omit=dev

RELEASE_NAME="release-$(date +%Y-%m-%d_%H-%M-%S)-manual"
mkdir -p ../artifacts/${RELEASE_NAME}
cp -r src/ node_modules/ ../artifacts/${RELEASE_NAME}/
cp package.json package-lock.json ecosystem.config.js ../artifacts/${RELEASE_NAME}/
cd ../artifacts
tar -czf ${RELEASE_NAME}.tar.gz ${RELEASE_NAME}

# 2. Upload to server
scp ${RELEASE_NAME}.tar.gz user@your-server:/tmp/

# 3. Deploy on server
ssh user@your-server << 'ENDSSH'
  set -e
  DEPLOY_PATH="/opt/voisss-processing"
  RELEASE_NAME="release-$(date +%Y-%m-%d_%H-%M-%S)-manual"
  
  cd /tmp
  tar -xzf ${RELEASE_NAME}.tar.gz
  
  mkdir -p ${DEPLOY_PATH}/releases
  mv ${RELEASE_NAME} ${DEPLOY_PATH}/releases/
  
  # Symlink shared resources
  cd ${DEPLOY_PATH}/releases/${RELEASE_NAME}
  ln -sf ${DEPLOY_PATH}/.env .env
  ln -sf ${DEPLOY_PATH}/logs logs
  
  # Atomic symlink switch
  ln -sfn ${DEPLOY_PATH}/releases/${RELEASE_NAME} ${DEPLOY_PATH}/current_new
  mv -Tf ${DEPLOY_PATH}/current_new ${DEPLOY_PATH}/current
  
  # Reload PM2
  cd ${DEPLOY_PATH}/current
  pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
  pm2 save
  
  # Cleanup old releases (keep 5)
  cd ${DEPLOY_PATH}/releases
  CURRENT=$(basename $(readlink ${DEPLOY_PATH}/current))
  ls -1t | grep -v "${CURRENT}" | tail -n +5 | xargs rm -rf
  
  echo "✅ Deployment complete"
ENDSSH
```

### Rollback

To rollback to the previous release:

```bash
ssh user@your-server
cd /opt/voisss-processing

# List available releases
ls -lt releases/

# Switch to previous release
PREVIOUS=$(ls -1t releases/ | head -2 | tail -1)
ln -sfn releases/${PREVIOUS} current_new
mv -Tf current_new current

# Reload PM2
pm2 reload ecosystem.config.js
```

## PostgreSQL Setup (Required)

The backend now requires PostgreSQL for mission storage. It's configured in `docker-compose.yml`:

1. **On production server**, update `.env`:
```bash
DB_PASSWORD=your_strong_secure_password_here
```

2. **Start services with PostgreSQL**:
```bash
docker-compose up -d
```

This starts: PostgreSQL (5432), API (5577), Worker, and Redis (6379).

3. **Verify PostgreSQL is running**:
```bash
docker exec voisss-postgres pg_isready -U voisss_user -d voisss
```

4. **For local development**, configure in `/apps/web/.env`:
```
DATABASE_URL=postgresql://voisss_user:your_password@your-production-server-ip:5432/voisss
```

The Next.js API routes will now use the remote PostgreSQL for mission persistence.

---

## First-Time Server Setup

### 1. Create Deployment Directory Structure
```bash
ssh user@your-server
mkdir -p /opt/voisss-processing/{releases,logs}
```

### 2. Setup Infrastructure (Docker)
```bash
# Add Redis container for Bull queue
docker run -d --name redis-export --restart unless-stopped \
  -p 127.0.0.1:6379:6379 -v redis-export-data:/data \
  redis:7-alpine redis-server --appendonly yes

# Create output directory for exports
sudo mkdir -p /var/www/voisss-exports
sudo chown $(whoami) /var/www/voisss-exports
chmod 755 /var/www/voisss-exports

# Verify FFmpeg is installed
ffmpeg -version
```

### 3. Configure Environment
```bash
# Create .env file (use .env.example as template)
cat > .env << EOF
# ElevenLabs API
ELEVENLABS_API_KEY=your_api_key_here

# Server
PORT=5577
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5433/voisss

# Redis (for Bull queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Export paths
EXPORT_TEMP_DIR=/tmp/voisss-exports
EXPORT_OUTPUT_DIR=/var/www/voisss-exports
EXPORT_PUBLIC_URL=https://your-domain.com

# Worker scaling
WORKER_INSTANCES=2
WORKER_CONCURRENCY=2
EOF
```

### 4. First Deployment
```bash
# Trigger the GitHub Actions workflow, or deploy manually (see above)
# The first deployment will create the 'current' symlink
```

### 5. Start Services
```bash
# Both API and export worker processes
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on server reboot

# Verify
pm2 status  # Should show voisss-processing + voisss-export-worker x2
```

### 6. Verify Setup
```bash
# Health check
curl http://localhost:5577/health

# Check logs
pm2 logs voisss-processing --lines 20
pm2 logs voisss-export-worker --lines 20
```

### 7. Configure Nginx (Optional)
```bash
# Set up your nginx configuration
# Add export file serving location (optional):
# location /exports/ {
#   alias /var/www/voisss-exports/;
#   expires 24h;
# }
# Configure SSL with certbot
# Reload nginx
```

## Monitoring

```bash
# View all logs (API + worker)
pm2 logs

# API logs only
pm2 logs voisss-processing --lines 50

# Worker logs only
pm2 logs voisss-export-worker --lines 50

# Real-time monitoring (CPU, memory)
pm2 monit

# Check status
pm2 status

# Restart all services
pm2 restart ecosystem.config.js

# Restart specific service
pm2 restart voisss-processing
pm2 restart voisss-export-worker
```

## Export Service Specific

```bash
# Check queue depth
redis-cli LLEN bull:voisss-export:

# Check job counts by status
psql -h localhost -U postgres -d voisss \
  -c "SELECT status, COUNT(*) FROM export_jobs GROUP BY status;"

# View recent jobs
psql -h localhost -U postgres -d voisss \
  -c "SELECT id, kind, status, created_at FROM export_jobs ORDER BY created_at DESC LIMIT 10;"
```

## Troubleshooting

### Service won't start
```bash
pm2 logs voisss-processing --lines 50
pm2 logs voisss-export-worker --lines 50
```

### Worker not processing jobs
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Check worker process
pm2 status | grep export

# Check for errors
pm2 logs voisss-export-worker --lines 100 --err
```

### Jobs stuck in processing
```bash
# Query stuck jobs (older than 1 hour)
psql -h localhost -U postgres -d voisss \
  -c "SELECT id, created_at, started_at FROM export_jobs WHERE status='processing' AND created_at < NOW() - INTERVAL '1 hour';"

# Reset job to pending (if needed)
psql -h localhost -U postgres -d voisss \
  -c "UPDATE export_jobs SET status='pending' WHERE id='export_xxx';"
```

### Check if port is available
```bash
netstat -tuln | grep 5577
```

### Verify environment variables
```bash
cd /opt/voisss-processing
cat .env

# Verify each is set
echo $DATABASE_URL
echo $REDIS_HOST
echo $REDIS_PORT
```

## Scaling Workers

To increase export processing capacity:

```bash
# Edit ecosystem.config.js
nano ecosystem.config.js

# Change WORKER_INSTANCES (default is 2)
WORKER_INSTANCES=4  # for 4 workers

# Restart
pm2 restart ecosystem.config.js

# Verify
pm2 status | grep export  # Should show 4 instances
```

**Performance**: Each FFmpeg worker uses ~200-300MB RAM
- 2 workers: ~20 MP3/hr or ~7 MP4/hr
- 4 workers: ~40 MP3/hr or ~14 MP4/hr

## Cleanup & Maintenance

```bash
# Delete old completed jobs (older than 7 days)
psql -h localhost -U postgres -d voisss \
  -c "DELETE FROM export_jobs WHERE created_at < NOW() - INTERVAL '7 days' AND status IN ('completed', 'failed');"

# Clear old temp files
find /tmp/voisss-exports -type f -mtime +1 -delete
```

## Security Notes

- Never commit `.env` files
- Keep SSH keys secure
- Use GitHub secrets for sensitive data
- Rotate API keys periodically
- Monitor access logs
- Restrict Redis to localhost only (127.0.0.1)
- Set file permissions on /var/www/voisss-exports
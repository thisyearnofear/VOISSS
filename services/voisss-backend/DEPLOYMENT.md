# VOISSS Backend Deployment Guide

## Deployment Method: Artifact-Based with Releases Symlink

This service uses **immutable artifact-based deployments** for efficiency and reliability:

- **CI builds the artifact** (including `node_modules/`) - no server-side npm install
- **Server runs releases** from timestamped directories
- **Symlink switching** enables atomic updates and instant rollbacks
- **Automatic cleanup** keeps only the last 5 releases

### Server Directory Structure

```
<deploy-path>/
├── releases/
│   ├── release-TIMESTAMP-COMMIT/
│   └── ...
├── current -> releases/release-TIMESTAMP-COMMIT  (symlink)
├── .env                    (shared config, not in repo)
├── logs/                   (shared logs)
└── data/                   (if any local state)
```

## CI/CD Setup

This service uses GitHub Actions for automated deployment.

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

1. **HETZNER_HOST** - Server hostname or IP
2. **VOISSS_DEPLOY_KEY** - Dedicated deploy SSH key (not root)

### Security Notes

- Deployments use a dedicated user with restricted sudo access
- Databases (PostgreSQL, Redis) are bound to localhost only
- Environment files are not readable by the deploy user

### SSH Key Setup

Generate a dedicated deployment key (not your personal key):

```bash
ssh-keygen -t ed25519 -C "deploy-voisss" -f deploy_key
cat deploy_key      # Add to GitHub secrets
cat deploy_key.pub  # Add to server's authorized_keys
```

## Manual Deployment

If you need to deploy manually:

```bash
# 1. Build the artifact
cd services/voisss-backend
npm ci --omit=dev

RELEASE_NAME="release-$(date +%Y-%m-%d_%H-%M-%S)-manual"
mkdir -p ../artifacts/${RELEASE_NAME}
cp -r src/ node_modules/ ../artifacts/${RELEASE_NAME}/
cp package.json package-lock.json ecosystem.config.js ../artifacts/${RELEASE_NAME}/
cd ../artifacts
tar -czf ${RELEASE_NAME}.tar.gz ${RELEASE_NAME}

# 2. Upload and deploy
scp ${RELEASE_NAME}.tar.gz deploy@your-server:/tmp/
ssh deploy@your-server "cd /tmp && tar -xzf ${RELEASE_NAME}.tar.gz"
# ... rest of deployment via CI or manual steps
```

### Rollback

To rollback to the previous release:

```bash
ssh deploy@your-server

# List available releases
ls -lt releases/

# Switch to previous release
PREVIOUS=$(ls -1t releases/ | head -2 | tail -1)
sudo ln -sfn releases/${PREVIOUS} current_new
sudo mv -Tf current_new current

# Reload PM2
cd current
sudo pm2 reload ecosystem.config.js
```

## PostgreSQL Setup (Required)

The backend requires PostgreSQL for mission storage:

```bash
# Run PostgreSQL bound to localhost only
docker run -d --name postgres --restart unless-stopped \
  -p 127.0.0.1:5432:5432 \
  -e POSTGRES_USER=<user> -e POSTGRES_PASSWORD=<password> -e POSTGRES_DB=<db> \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine
```

---

## First-Time Server Setup

### 1. Create Deployment Directory Structure
```bash
mkdir -p <deploy-path>/{releases,logs}
```

### 2. Setup Infrastructure
```bash
# Redis (bound to localhost)
docker run -d --name redis --restart unless-stopped \
  -p 127.0.0.1:6379:6379 \
  redis:7-alpine

# FFmpeg for audio processing
apt-get install ffmpeg
```

### 3. Configure Environment
```bash
# Create .env file in deploy root (use .env.example as template)
# Ensure permissions restrict access: chmod 600 .env
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
# Export Service Deployment Guide

This document covers deploying the new async export service to your Hetzner production server.

## Overview

The export system consists of:
- **API Service** (existing, enhanced): Enqueues export jobs
- **Export Worker** (new): Processes jobs from queue
- **PostgreSQL**: Stores job state (already running on snel-bot)
- **Redis**: Bull queue backend (new container)
- **FFmpeg**: System dependency (for encoding)

## Prerequisites

- SSH access to snel-bot
- Docker and Docker Compose
- Existing PostgreSQL running on port 5433
- PM2 installed globally
- FFmpeg installed on system

## Step 1: Add Redis Container

SSH into the server and add Redis to your docker-compose file:

```bash
ssh snel-bot
cd /path/to/docker-compose  # Adjust path as needed
```

Add to `docker-compose.yml`:

```yaml
redis-export:
  image: redis:7-alpine
  container_name: redis-export
  ports:
    - "127.0.0.1:6379:6379"  # Local only for security
  volumes:
    - redis-export-data:/data
  command: redis-server --appendonly yes
  restart: unless-stopped

volumes:
  redis-export-data:
```

Then:

```bash
docker compose up -d redis-export
docker logs redis-export  # Verify it started

# Test connection
redis-cli ping  # Should return PONG
```

## Step 2: Deploy Updated Backend

```bash
cd /opt/voisss-processing  # Or wherever you deploy

# Pull latest from GitHub
git pull origin main

# Install new dependencies
npm install --production

# Verify environment variables
cat .env  # Check DATABASE_URL and REDIS_HOST

# If you need to update, edit .env
# nano .env
```

**Required .env variables:**

```bash
DATABASE_URL=postgresql://user:password@localhost:5433/voisss
REDIS_HOST=localhost        # Or 127.0.0.1
REDIS_PORT=6379
EXPORT_TEMP_DIR=/tmp/voisss-exports
EXPORT_OUTPUT_DIR=/var/www/voisss-exports
EXPORT_PUBLIC_URL=https://your-domain.com  # Or http://localhost:5577 for dev
WORKER_INSTANCES=2
WORKER_CONCURRENCY=2
```

## Step 3: Create Output Directory

```bash
# On server
sudo mkdir -p /var/www/voisss-exports
sudo chown $(whoami) /var/www/voisss-exports
sudo chmod 755 /var/www/voisss-exports

# Verify
ls -la /var/www/voisss-exports
```

## Step 4: Verify FFmpeg Installation

```bash
ffmpeg -version  # Should show version info

# If not installed:
# Ubuntu/Debian:
sudo apt-get install ffmpeg

# Check it works:
which ffmpeg  # Should show path
```

## Step 5: Restart Services with PM2

```bash
cd /opt/voisss-processing

# Restart API and start worker
pm2 restart ecosystem.config.js

# Verify both processes started
pm2 status
# Should show:
# - voisss-processing (API)
# - voisss-export-worker (x2 instances)

# Save PM2 config
pm2 save
```

## Step 6: Verify Services

```bash
# Check API health
curl http://localhost:5577/health
# Should return: {"status":"healthy", ...}

# Check logs
pm2 logs voisss-processing        # API logs
pm2 logs voisss-export-worker     # Worker logs

# Monitor in realtime
pm2 monit
```

## Step 7: Test Export Endpoint

```bash
# Create test request
curl -X POST http://localhost:5577/api/export/request \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "mp3",
    "audioUrl": "https://example.com/sample.webm",
    "transcriptId": "tt_test_123",
    "userId": "test_user"
  }'

# Response should look like:
# {
#   "jobId": "export_abc123...",
#   "estimatedSeconds": 60,
#   "statusUrl": "/api/export/export_abc123.../status"
# }

# Check status (poll)
curl http://localhost:5577/api/export/export_abc123.../status
# Before complete: {"status":"pending",...}
# After complete: {"status":"completed","outputUrl":"..."}
```

## Step 8: Configure Nginx (Optional)

If you want to serve exported files through your domain:

```nginx
# Add to your nginx config
location /exports/ {
    alias /var/www/voisss-exports/;
    expires 24h;
    add_header Cache-Control "public, max-age=86400";
}
```

Reload nginx:

```bash
sudo nginx -s reload
# Or
sudo systemctl reload nginx
```

## Monitoring

### View Logs

```bash
# API logs
pm2 logs voisss-processing --lines 100

# Worker logs
pm2 logs voisss-export-worker --lines 100

# Both
pm2 logs

# Realtime monitoring
pm2 monit
```

### Check Queue Depth

```bash
# SSH in and use redis-cli
redis-cli

# Check queue size
LLEN bull:voisss-export:  # Shows pending jobs
```

### Database Jobs

```bash
# SSH to DB or psql
psql -h localhost -U postgres -d voisss

# Check jobs
SELECT id, status, kind, created_at FROM export_jobs ORDER BY created_at DESC LIMIT 10;

# Count by status
SELECT status, COUNT(*) FROM export_jobs GROUP BY status;
```

## Scaling Workers

To increase processing capacity:

```bash
# Edit ecosystem.config.js
WORKER_INSTANCES=4  # Default is 2

# Or set environment variable before restart
export WORKER_INSTANCES=4
pm2 restart ecosystem.config.js
```

**Performance notes:**
- Each FFmpeg process uses ~200MB RAM + CPU
- 2 workers: ~2 GB RAM, handles ~20 exports/hour
- 4 workers: ~4 GB RAM, handles ~40 exports/hour
- Monitor with `pm2 monit`

## Troubleshooting

### Worker not starting

```bash
pm2 logs voisss-export-worker --lines 50
# Common issues:
# - DATABASE_URL not set
# - Redis not running
# - FFmpeg not installed
# - Insufficient disk space
```

### Jobs stuck in processing

```bash
# Check if worker crashed
pm2 status

# Check for stale jobs
psql -h localhost -U postgres -d voisss
SELECT * FROM export_jobs WHERE status = 'processing' AND created_at < NOW() - INTERVAL '1 hour';

# Manually reset (be careful!)
UPDATE export_jobs SET status = 'pending' WHERE id = 'export_xxx';
```

### Redis connection refused

```bash
# Verify Redis is running
docker ps | grep redis

# Check port
redis-cli ping

# If not working:
docker logs redis-export
```

### Output files not appearing

```bash
# Check directory permissions
ls -la /var/www/voisss-exports
df -h  # Check disk space

# Check FFmpeg worked
ls -la /tmp/voisss-exports/

# Monitor worker processing
pm2 logs voisss-export-worker --grep "Encoding"
```

## Cleanup & Maintenance

### Auto-cleanup jobs

Jobs are automatically cleaned up after:
- Completed jobs: 1 hour (removed from queue only, kept in DB)
- Failed jobs: Kept indefinitely (for debugging)
- Old jobs: See below

### Manual cleanup old jobs

```bash
# In psql
DELETE FROM export_jobs 
WHERE created_at < NOW() - INTERVAL '7 days' 
AND status IN ('completed', 'failed');
```

Or in code (runs automatically from export-service):

```javascript
const { cleanupExpiredJobs } = require('./services/export-service');
await cleanupExpiredJobs(24);  // Cleanup jobs > 24 hours old
```

### Clear temp files

```bash
# Remove old temp files (older than 1 day)
find /tmp/voisss-exports -type f -mtime +1 -delete
```

## Rollback

If something goes wrong:

```bash
# Stop the service
pm2 stop voisss-export-worker

# Revert code
git reset --hard HEAD~1
npm install --production

# Restart
pm2 start ecosystem.config.js

# Verify
pm2 status
```

## Next Steps

1. Update frontend to use `/api/export/request` endpoint
2. Add progress UI in Next.js (poll `/api/export/:jobId/status`)
3. Configure S3/external storage for long-term file retention
4. Set up monitoring/alerts for queue depth and error rates


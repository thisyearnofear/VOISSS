# VOISSS Backend Service

Dedicated processing service for VOISSS audio transformations via ElevenLabs API.

## Features

- ✅ Persistent connections to ElevenLabs API
- ✅ No cold starts
- ✅ Extended timeouts (120s)
- ✅ Proper error handling
- ✅ PM2 process management
- ✅ Health monitoring
- ✅ Async export service (MP3, MP4, carousel)
- ✅ PostgreSQL-backed job queue (DB-driven, no Redis required)
- ✅ Crash recovery with stale-lease requeue + exponential retry backoff
- ✅ Auto-migrations on startup

## API Endpoints

### Health Check
```
GET /health
```

### List Voices
```
GET /api/voices
```

### Transform Voice
```
POST /api/transform
Content-Type: multipart/form-data

Fields:
- audio: Audio file (required)
- voiceId: Target voice ID (required)
- modelId: Model ID (optional)
- outputFormat: Output format (optional)
```

### Dubbing
```
POST /api/dubbing/start
GET /api/dubbing/:dubbingId/status
GET /api/dubbing/:dubbingId/audio/:targetLanguage
```

### Export Service (Async)
```
POST /api/export/request
- Enqueue export job (MP3, MP4, carousel)
- Returns: jobId, estimatedSeconds, statusUrl
- Response: 202 Accepted

GET /api/export/:jobId/status
- Poll job status
- Returns: status, outputUrl, outputSize, error, timestamps
```

## Deployment

### Prerequisites
- Node.js 16+
- PM2 installed globally
- Nginx (optional, for reverse proxy)

### Environment Variables

Create a `.env` file (see `.env.example` for full template):
```env
# ElevenLabs
ELEVENLABS_API_KEY=your_api_key_here

# Server
PORT=5577
NODE_ENV=production

# Database (for export service)
DATABASE_URL=postgresql://user:password@localhost:5433/voisss

# Auth (fail-closed: required in production)
API_KEYS=web:[redacted],agent:[redacted]

# Export configuration
EXPORT_TEMP_DIR=/tmp/voisss-exports
EXPORT_OUTPUT_DIR=/var/www/voisss-exports
EXPORT_PUBLIC_URL=https://your-domain.com

# Worker scaling
WORKER_INSTANCES=2
WORKER_CONCURRENCY=2
```

### Install & Run

```bash
npm install --production
pm2 start ecosystem.config.js
pm2 save
```

### With Nginx (Recommended)

1. Configure your domain's DNS A record to point to your server
2. Install SSL certificate with certbot
3. Configure nginx reverse proxy
4. Reload nginx

## Services

This deployment runs 2 PM2 processes:

1. **voisss-processing** - API service (ElevenLabs, dubbing, export endpoints)
2. **voisss-export-worker** - Job processor (x2 instances for async exports)

## Monitoring

```bash
# View all logs
pm2 logs

# API logs
pm2 logs voisss-processing --lines 20

# Worker logs
pm2 logs voisss-export-worker --lines 20

# Check status
pm2 status

# Real-time monitoring
pm2 monit

# Restart all
pm2 restart ecosystem.config.js
```

## Export Service Architecture

- **API Endpoint**: `POST /api/export/request` enqueues job
- **Queue**: DB-driven (PostgreSQL atomic claim + lease + retry), no Redis required
- **Database**: PostgreSQL tracks job state
- **Worker**: Processes jobs with FFmpeg, crash recovery via stale-lease sweep
- **Status**: `GET /api/export/:jobId/status` for polling

See `DEPLOYMENT.md` for detailed setup instructions.

## Security

- **Fail-closed auth**: protected routes require `API_KEYS`; if unset they reject all requests (unless `ALLOW_UNAUTHENTICATED_DEV=true` in non-production)
- API key stored server-side only; never exposed to the browser
- **SSRF guard**: export downloads are restricted to an http(s) host allowlist with private-IP blocking and redirect revalidation (`EXPORT_ALLOWED_HOSTS` extends it)
- **Wallet identity binding**: mission writes require a `Bearer <wallet>` address that matches `userId` in the body
- HTTPS via nginx reverse proxy
- CORS allowlist configured via `CORS_ORIGINS` (production should use https only)
- No sensitive data in logs
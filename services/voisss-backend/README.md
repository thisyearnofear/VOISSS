# VOISSS Backend Service

Dedicated processing service for VOISSS audio transformations via ElevenLabs API.

## Features

- ✅ Persistent connections to ElevenLabs API
- ✅ No cold starts
- ✅ Extended timeouts (120s)
- ✅ Proper error handling
- ✅ PM2 process management
- ✅ Health monitoring

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

## Deployment

### Prerequisites
- Node.js 16+
- PM2 installed globally
- Nginx (optional, for reverse proxy)

### Environment Variables

Create a `.env` file:
```env
ELEVENLABS_API_KEY=your_api_key_here
PORT=5577
NODE_ENV=production
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

## Monitoring

```bash
# View logs
pm2 logs voisss-backend

# Check status
pm2 status

# Restart
pm2 restart voisss-backend
```

## Security

- API key stored server-side only
- HTTPS via nginx reverse proxy
- CORS configured for frontend access
- No sensitive data in logs
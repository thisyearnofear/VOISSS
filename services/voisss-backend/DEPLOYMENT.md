# VOISSS Backend Deployment Guide

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

If you prefer manual deployment:

```bash
# From project root
cd services/voisss-backend

# Create deployment package
tar -czf voisss-backend.tar.gz server.js package.json ecosystem.config.js .env.example

# Copy to server
scp voisss-backend.tar.gz user@your-server:/tmp/

# SSH and deploy
ssh user@your-server
cd /tmp
tar -xzf voisss-backend.tar.gz
cp server.js package.json ecosystem.config.js /opt/voisss-processing/
cd /opt/voisss-processing
npm install --production
pm2 restart voisss-processing
```

## First-Time Server Setup

### 1. Create Deployment Directory
```bash
ssh user@your-server
mkdir -p /opt/voisss-processing
cd /opt/voisss-processing
```

### 2. Configure Environment
```bash
# Create .env file
cat > .env << EOF
ELEVENLABS_API_KEY=your_api_key_here
PORT=5577
NODE_ENV=production
EOF
```

### 3. Install Dependencies
```bash
npm install --production
```

### 4. Start Service
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on server reboot
```

### 5. Configure Nginx (Optional)
```bash
# Set up your nginx configuration
# Configure SSL with certbot
# Reload nginx
```

## Monitoring

```bash
# View logs
pm2 logs voisss-processing

# Check status
pm2 status

# Monitor performance
pm2 monit

# Restart if needed
pm2 restart voisss-processing
```

## Troubleshooting

### Service won't start
```bash
pm2 logs voisss-processing --lines 50
```

### Check if port is available
```bash
netstat -tuln | grep 5577
```

### Verify environment variables
```bash
cd /opt/voisss-processing
cat .env
```

## Security Notes

- Never commit `.env` files
- Keep SSH keys secure
- Use GitHub secrets for sensitive data
- Rotate API keys periodically
- Monitor access logs
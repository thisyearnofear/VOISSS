# VOISSS Deployment Guide

## Pre-Deployment Checklist

### 1. Generate Spender Wallet (Web Platform)
```bash
# Generate new wallet for production
node -e "
const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');
const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);
console.log('🔑 Private Key (KEEP SECRET!):', pk);
console.log('📍 Address:', account.address);
"
```

### 2. Fund Spender Wallet
```bash
# Send ETH to spender address for gas fees
# Recommended: 0.5 - 1 ETH for production

# Check balance
cast balance 0xYOUR_SPENDER_ADDRESS --rpc-url https://mainnet.base.org
```

### 3. Environment Variables
Ensure all required environment variables are set in your deployment platform.

## Web Platform Deployment

### Using Vercel:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to staging
vercel --env NODE_ENV=staging

# Deploy to production
vercel --prod --env NODE_ENV=production
```

### Required Environment Variables:
```env
# Base Chain Configuration
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# Contract Addresses
NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS=0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07
NEXT_PUBLIC_PAPAJAMS_TOKEN_ADDRESS=0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c

# Spender Wallet (Backend - DO NOT EXPOSE TO CLIENT)
SPENDER_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_SPENDER_ADDRESS=0xspender_address

# AI Services
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key

# IPFS
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret
```

## Mobile Platform Deployment

### Build for Production:
```bash
cd apps/mobile
pnpm build

# Deploy to Expo
pnpm expo publish

# Or build native binaries
pnpm expo run:android  # Generate APK/IPA
pnpm expo run:ios
```

### Mobile Environment Variables:
```env
# Scroll Chain Configuration
EXPO_PUBLIC_SCROLL_VRF_ADDRESS=0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208
EXPO_PUBLIC_SCROLL_PRIVACY_ADDRESS=0x0abD2343311985Fd1e0159CE39792483b908C03a
EXPO_PUBLIC_SCROLL_CHAIN_ID=534351
EXPO_PUBLIC_SCROLL_RPC=https://sepolia-rpc.scroll.io/
```

## Serverpod Backend Deployment (Flutter)

### Deploy to Production Server:
```bash
# SSH into production server
ssh your-server

# Navigate to Serverpod directory
cd /path/to/voisss-butler-server

# Pull latest code
git pull origin main

# Install dependencies
dart pub get

# Run migrations
dart bin/main.dart --apply-migrations

# Restart services with Docker
docker compose down
docker compose up -d

# Check logs
docker logs -f voisss_butler_server
```

## Post-Deployment Monitoring

### Monitor Spender Wallet (Web)
```typescript
// Add to monitoring service (e.g., Datadog, Sentry)
const balance = await publicClient.getBalance({
  address: '0xYOUR_SPENDER_ADDRESS' as `0x${string}`,
});

if (balance < parseEther("0.1")) {
  alert("⚠️ Spender wallet balance low!");
}
```

### Setup Alerts
- Low balance notifications (< 0.1 ETH)
- Failed transaction monitoring
- API performance metrics
- Uptime monitoring

## Verification Steps

### Web Platform:
```bash
# Check health endpoint
curl https://your-domain.com/api/base/save-recording

# Verify token balances
curl https://your-domain.com/api/user/token-balance
```

### Mobile Platform:
- Test with Expo Go app
- Verify Scroll contract interactions
- Check audio recording functionality

### Serverpod Backend:
```bash
# Check health
curl https://butler.your-domain.com/butler/health

# Test AI endpoint
curl -X POST "https://butler.your-domain.com/butler/chat?message=Hello"
```

## Rollback Plan

### If Issues Occur:
1. Revert to previous deployment
2. Temporarily disable gasless transactions if needed
3. Check error logs and transaction history
4. Verify environment variables

## Security Checklist
- [ ] `SPENDER_PRIVATE_KEY` stored securely
- [ ] Environment variables properly set
- [ ] Spender wallet funded
- [ ] Rate limiting enabled
- [ ] Error logging configured (without sensitive data exposure)
- [ ] Monitoring alerts setup

## Maintenance Schedule

### Daily:
- Check spender wallet balance
- Review error logs
- Check uptime status

### Weekly:
- Review transaction success rate
- Check for failed transactions
- Review user feedback

### Monthly:
- Analyze usage metrics
- Review gas costs
- Check token economics
- Performance optimization
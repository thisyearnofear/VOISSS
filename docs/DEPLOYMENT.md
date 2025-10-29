# 🚀 VOISSS Deployment Guide

## Pre-Deployment Checklist

### 1. Generate Spender Wallet

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

**Save these values securely:**
- `SPENDER_PRIVATE_KEY`: Store in password manager
- `NEXT_PUBLIC_SPENDER_ADDRESS`: Can be public

### 2. Fund Spender Wallet

```bash
# Send ETH to spender address for gas fees
# Recommended: 0.5 - 1 ETH for production

# Check balance
cast balance 0xYOUR_SPENDER_ADDRESS --rpc-url https://mainnet.base.org
```

### 3. Update Environment Variables

**Local (.env):**
```bash
# Backend Spender Wallet
SPENDER_PRIVATE_KEY=0x...
NEXT_PUBLIC_SPENDER_ADDRESS=0x...

# Base Chain
BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_CHAIN_ID=8453

# Contract
NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=0x...
```

**Production (Deployment Platform):**
- Add all environment variables to Vercel/Netlify/etc
- Ensure `SPENDER_PRIVATE_KEY` is marked as secret
- Verify `NEXT_PUBLIC_*` variables are accessible to frontend

## Deployment Steps

### 1. Build & Test Locally

```bash
# Install dependencies
pnpm install

# Build project
pnpm build

# Test locally
pnpm dev

# Verify:
# - Wallet connection works
# - Permission grant flow works
# - Gasless save works
# - No console errors
```

### 2. Deploy to Staging

```bash
# Deploy to staging environment
git push staging main

# Verify staging deployment:
curl https://staging.your-domain.com/api/base/save-recording

# Expected response:
{
  "status": "healthy",
  "spenderAddress": "0x...",
  "balance": "...",
  "chain": "base",
  "chainId": 8453
}
```

### 3. Test on Staging

**Manual Testing:**
- [ ] Connect wallet
- [ ] Grant spend permission
- [ ] Record audio
- [ ] Save recording (should be gasless)
- [ ] Verify transaction on Basescan
- [ ] Check spender wallet balance decreased

**Automated Testing:**
```bash
# Run integration tests
pnpm test:integration

# Test API endpoint
curl -X POST https://staging.your-domain.com/api/base/save-recording \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x...",
    "permissionHash": "0x...",
    "ipfsHash": "Qm...",
    "title": "Test Recording",
    "isPublic": true
  }'
```

### 4. Deploy to Production

```bash
# Deploy to production
git push production main

# Or via deployment platform
vercel --prod
# or
netlify deploy --prod
```

### 5. Verify Production

```bash
# Check health endpoint
curl https://your-domain.com/api/base/save-recording

# Monitor logs
vercel logs --follow
# or
netlify logs
```

## Post-Deployment Monitoring

### 1. Monitor Spender Wallet

**Setup Monitoring:**
```typescript
// Add to monitoring service (e.g., Datadog, Sentry)
const balance = await spenderWallet.getBalance({
  address: spenderWallet.account.address,
});

if (balance < parseEther("0.1")) {
  alert("⚠️ Spender wallet balance low!");
}
```

**Manual Check:**
```bash
# Check balance daily
cast balance 0xYOUR_SPENDER_ADDRESS --rpc-url https://mainnet.base.org
```

### 2. Setup Alerts

**Low Balance Alert:**
```typescript
// Trigger when balance < 0.1 ETH
if (balance < parseEther("0.1")) {
  sendSlackAlert("Spender wallet needs funding");
  sendEmailAlert("admin@your-domain.com");
}
```

**Failed Transaction Alert:**
```typescript
// Track failed transactions
if (txReceipt.status === 'reverted') {
  logError("Transaction failed", { txHash, error });
  incrementMetric("failed_transactions");
}
```

### 3. Document for Team

**Share with team:**
- Spender wallet address (public)
- How to check balance
- How to fund wallet
- Emergency contacts
- Troubleshooting guide

## Monitoring Dashboard

### Key Metrics to Track

1. **Spender Wallet Balance**
   - Current balance
   - Daily spend rate
   - Estimated days remaining

2. **Transaction Success Rate**
   - Total transactions
   - Successful transactions
   - Failed transactions
   - Average gas cost

3. **Active Permissions**
   - Total active permissions
   - New permissions today
   - Expired permissions

4. **API Performance**
   - Request count
   - Average response time
   - Error rate

## Rollback Plan

### If Issues Occur

1. **Immediate Actions:**
   ```bash
   # Revert to previous deployment
   vercel rollback
   # or
   git revert HEAD
   git push production main
   ```

2. **Disable Gasless Saves:**
   ```typescript
   // Temporary: Disable backend spender
   // Set environment variable
   DISABLE_GASLESS_SAVES=true

   // Frontend will fall back to user-paid transactions
   ```

3. **Investigate:**
   - Check spender wallet balance
   - Review error logs
   - Check transaction history
   - Verify environment variables

## Security Checklist

- [ ] `SPENDER_PRIVATE_KEY` stored securely (not in git)
- [ ] Environment variables set in deployment platform
- [ ] Spender wallet funded with appropriate amount
- [ ] Rate limiting enabled on API endpoints
- [ ] Error logging configured
- [ ] Monitoring alerts setup
- [ ] Team documented on procedures
- [ ] Backup plan in place

## Maintenance

### Weekly Tasks
- [ ] Check spender wallet balance
- [ ] Review transaction success rate
- [ ] Check for failed transactions
- [ ] Review error logs

### Monthly Tasks
- [ ] Analyze gas costs
- [ ] Review permission usage
- [ ] Optimize gas usage if needed
- [ ] Update documentation

### Quarterly Tasks
- [ ] Rotate spender wallet keys
- [ ] Review security practices
- [ ] Update dependencies
- [ ] Performance optimization

## Emergency Contacts

**Technical Issues:**
- DevOps Lead: [contact]
- Backend Lead: [contact]
- On-call Engineer: [contact]

**Financial Issues:**
- Finance Team: [contact]
- Wallet Manager: [contact]

## Useful Commands

```bash
# Check spender balance
cast balance 0xSPENDER_ADDRESS --rpc-url https://mainnet.base.org

# Send ETH to spender
cast send 0xSPENDER_ADDRESS --value 0.5ether --rpc-url https://mainnet.base.org

# Check transaction
cast tx 0xTX_HASH --rpc-url https://mainnet.base.org

# View logs
vercel logs --follow
netlify logs

# Check API health
curl https://your-domain.com/api/base/save-recording

# Test permission grant (frontend)
# Open browser console and run:
await window.ethereum.request({
  method: 'eth_requestAccounts'
});
```

## Success Criteria

✅ Spender wallet funded and operational
✅ API health check returns "healthy"
✅ Users can grant permissions
✅ Gasless saves work without popups
✅ Transactions confirmed on Basescan
✅ Monitoring alerts configured
✅ Team documented on procedures

## Next Steps After Deployment

1. Monitor for 24 hours
2. Gather user feedback
3. Analyze metrics
4. Optimize if needed
5. Document learnings
6. Plan next iteration

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________
**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Complete
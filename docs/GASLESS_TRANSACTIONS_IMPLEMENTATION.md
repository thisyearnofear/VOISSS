# Gasless Transactions Implementation Guide

## Overview

VOISSS now implements **true gasless, popup-free transactions** using Base Account's Spend Permissions with a backend spender wallet. After a one-time permission grant, users can save recordings without any wallet popups!

## Architecture

### Before (Sub Account Pattern)
```
User → Sub Account → Transaction → [POPUP EVERY TIME] → User pays gas
```
❌ Wallet popup for every transaction
❌ User pays gas fees
❌ Poor UX

### After (Backend Spender Pattern)
```
User → [ONE-TIME PERMISSION] → Backend Spender → Transaction → ✅ NO POPUP
```
✅ One-time permission grant
✅ Zero popups after setup
✅ Backend pays gas (can be sponsored)
✅ Excellent UX

## User Flow

### First-Time User

1. **Connect Wallet** (Standard popup)
   - User connects Base Account
   - No Sub Account creation needed

2. **Grant Spend Permission** (ONE-TIME popup)
   - User clicks "Grant Permission"
   - Approves spend permission for backend spender
   - Permission stored for future use

3. **Save Recordings** (NO POPUPS!)
   - User records voice
   - Clicks "Save"
   - Backend executes transaction
   - User sees success message
   - **Zero wallet popups!** ✨

### Returning User

```
User visits → Auto-connects → Records → Saves → ✅ NO POPUPS
```

## Implementation Details

### 1. Backend Spender Wallet

**File:** `apps/web/src/lib/spender-wallet.ts`

```typescript
// Server-side only wallet that executes transactions
const spenderWallet = createWalletClient({
  account: privateKeyToAccount(process.env.SPENDER_PRIVATE_KEY),
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
});
```

**Security:**
- Private key stored server-side only
- Never exposed to frontend
- Executes transactions on behalf of users

### 2. Gasless Save API

**File:** `apps/web/src/app/api/base/save-recording/route.ts`

**Flow:**
1. Receives: `userAddress`, `permissionHash`, `ipfsHash`, `metadata`
2. Verifies spend permission is active
3. Prepares spend calls (includes approval if needed)
4. Executes transaction using spender wallet
5. Returns transaction hash

**Example Request:**
```typescript
POST /api/base/save-recording
{
  "userAddress": "0x...",
  "permissionHash": "0x...",
  "ipfsHash": "Qm...",
  "title": "My Recording",
  "isPublic": true
}
```

**Example Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "allTxHashes": ["0x...", "0x..."],
  "status": "success",
  "blockNumber": "12345678"
}
```

### 3. Frontend Integration

**File:** `apps/web/src/hooks/useBaseAccount.ts`

**Key Functions:**

```typescript
// Request spend permission (one-time)
const requestPermission = async () => {
  const permission = await requestSpendPermission({
    account: universalAddress,
    spender: SPENDER_ADDRESS,
    token: NATIVE_TOKEN,
    chainId: 8453,
    allowance: parseEther("10"), // 10 ETH max
    periodInDays: 30, // Monthly reset
    provider,
  });
  
  localStorage.setItem('spendPermissionHash', permission.hash);
};

// Check for existing permission
const checkForPermission = async (userAddress) => {
  const permissions = await fetchPermissions({
    account: userAddress,
    chainId: 8453,
    spender: SPENDER_ADDRESS,
    provider,
  });
  
  if (permissions.length > 0) {
    const status = await getPermissionStatus(permissions[0]);
    setPermissionActive(status.isActive);
  }
};
```

**File:** `apps/web/src/services/baseRecordingService.ts`

```typescript
// Gasless save via backend API
const saveRecording = async (ipfsHash, metadata) => {
  const permissionHash = localStorage.getItem('spendPermissionHash');
  
  const response = await fetch('/api/base/save-recording', {
    method: 'POST',
    body: JSON.stringify({
      userAddress,
      permissionHash,
      ipfsHash,
      title: metadata.title,
      isPublic: metadata.isPublic,
    }),
  });
  
  const data = await response.json();
  return data.txHash;
};
```

### 4. UI Updates

**File:** `apps/web/src/components/RecordingStudio.tsx`

**Permission Grant UI:**
```tsx
{!permissionActive && (
  <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl">
    <h4>One-Time Setup Required</h4>
    <p>Grant spend permission once for gasless, popup-free saves forever!</p>
    <button onClick={requestPermission}>
      🔓 Grant Permission (One-Time)
    </button>
  </div>
)}
```

**Active Permission Status:**
```tsx
{permissionActive && (
  <div className="p-3 bg-green-900/30 border border-green-500/30 rounded-xl">
    ✨ Gasless saves enabled! No more wallet popups.
  </div>
)}
```

## Environment Variables

### Required Variables

```bash
# Backend Spender Wallet (Server-side only)
SPENDER_PRIVATE_KEY=0x...  # NEVER expose to frontend!
NEXT_PUBLIC_SPENDER_ADDRESS=0x...  # Public address

# Base Chain
BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_CHAIN_ID=8453

# Contract
NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=0x...
```

### Generating Spender Wallet

```bash
# Generate new wallet
node -e "const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts'); const pk = generatePrivateKey(); const account = privateKeyToAccount(pk); console.log('Private Key:', pk); console.log('Address:', account.address);"

# Add to .env (server-side only!)
SPENDER_PRIVATE_KEY=0x...
NEXT_PUBLIC_SPENDER_ADDRESS=0x...
```

### Funding Spender Wallet

```bash
# The spender wallet needs ETH for gas fees
# Send ETH to NEXT_PUBLIC_SPENDER_ADDRESS

# Check balance
curl -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xSPENDER_ADDRESS","latest"],"id":1}'
```

## Deployment

### 1. Setup Environment

```bash
# Copy example env
cp apps/web/.env.example apps/web/.env

# Generate spender wallet
# Add SPENDER_PRIVATE_KEY and NEXT_PUBLIC_SPENDER_ADDRESS

# Fund spender wallet with ETH for gas
```

### 2. Deploy to Production

```bash
# Build
pnpm build

# Deploy (Vercel/Netlify/etc)
# Ensure environment variables are set in deployment platform
```

### 3. Verify Deployment

```bash
# Check spender wallet health
curl https://your-domain.com/api/base/save-recording

# Expected response:
{
  "status": "healthy",
  "spenderAddress": "0x...",
  "balance": "1000000000000000000",
  "chain": "base",
  "chainId": 8453
}
```

## Security Considerations

### 1. Private Key Security

- ✅ Store `SPENDER_PRIVATE_KEY` server-side only
- ✅ Never expose to frontend or version control
- ✅ Use environment variables in deployment platform
- ✅ Rotate keys periodically

### 2. Spend Permission Limits

```typescript
// Set reasonable limits
allowance: parseEther("10"),  // Max 10 ETH per period
periodInDays: 30,             // Monthly reset
```

### 3. Permission Verification

```typescript
// Always verify permission before executing
const { isActive, remainingSpend } = await getPermissionStatus(permission);

if (!isActive || remainingSpend < amount) {
  throw new Error("Invalid or insufficient permission");
}
```

### 4. Rate Limiting

```typescript
// Add rate limiting to API endpoint
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per window
});
```

## Monitoring

### 1. Spender Wallet Balance

```typescript
// Monitor balance and alert when low
const balance = await spenderWallet.getBalance({
  address: spenderWallet.account.address,
});

if (balance < parseEther("0.1")) {
  // Alert: Low balance!
  sendAlert("Spender wallet balance low");
}
```

### 2. Transaction Success Rate

```typescript
// Track transaction success/failure
const metrics = {
  total: 0,
  success: 0,
  failed: 0,
};

// Log to monitoring service
console.log('Transaction metrics:', metrics);
```

### 3. Permission Status

```typescript
// Track active permissions
const activePermissions = await fetchPermissions({
  account: userAddress,
  chainId: 8453,
  spender: SPENDER_ADDRESS,
  provider,
});

console.log('Active permissions:', activePermissions.length);
```

## Troubleshooting

### Issue: "No spend permission found"

**Solution:**
```typescript
// User needs to grant permission
await requestPermission();
```

### Issue: "Insufficient funds"

**Solution:**
```bash
# Fund spender wallet
# Send ETH to NEXT_PUBLIC_SPENDER_ADDRESS
```

### Issue: "Permission expired"

**Solution:**
```typescript
// Request new permission
await requestPermission();
```

### Issue: "Transaction failed"

**Solution:**
```typescript
// Check spender wallet balance
const balance = await spenderWallet.getBalance({
  address: spenderWallet.account.address,
});

// Check permission status
const { isActive, remainingSpend } = await getPermissionStatus(permission);
```

## Benefits

### For Users

✅ **One-time setup** - Grant permission once
✅ **Zero popups** - No wallet prompts after setup
✅ **No gas fees** - Backend pays gas
✅ **Seamless UX** - Feels like Web2

### For Developers

✅ **Simple integration** - Clean API
✅ **Flexible** - Easy to extend
✅ **Secure** - Permission-based access
✅ **Scalable** - Backend handles load

### For Business

✅ **Better conversion** - Fewer friction points
✅ **Lower churn** - Improved UX
✅ **Predictable costs** - Backend pays gas
✅ **Competitive advantage** - Best-in-class UX

## Migration from Sub Accounts

### What Changed

1. **Removed:** Sub Account creation and management
2. **Removed:** Auto Spend Permissions at SDK level
3. **Added:** Backend spender wallet
4. **Added:** Manual spend permission flow
5. **Added:** Gasless transaction API

### Migration Steps

1. Generate spender wallet
2. Update environment variables
3. Deploy backend API
4. Update frontend to request permissions
5. Test permission grant flow
6. Test gasless transactions
7. Monitor spender wallet balance

## Future Enhancements

### 1. Paymaster Integration

```typescript
// Sponsor gas fees via paymaster
const sdkInstance = createBaseAccountSDK({
  paymasterUrls: {
    [base.id]: 'https://paymaster.base.org'
  }
});
```

### 2. Multi-Chain Support

```typescript
// Support multiple chains
const SUPPORTED_CHAINS = [base, optimism, arbitrum];

// Request permission per chain
for (const chain of SUPPORTED_CHAINS) {
  await requestSpendPermission({
    chainId: chain.id,
    // ...
  });
}
```

### 3. Dynamic Allowances

```typescript
// Adjust allowance based on user tier
const allowance = userTier === 'premium' 
  ? parseEther("100")  // 100 ETH for premium
  : parseEther("10");  // 10 ETH for free
```

## References

- [Base Account Documentation](https://docs.base.org/base-account)
- [Spend Permissions Guide](https://docs.base.org/base-account/guides/spend-permissions)
- [Viem Documentation](https://viem.sh)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)

## Support

For issues or questions:
1. Check troubleshooting section
2. Review implementation files
3. Check spender wallet balance
4. Verify environment variables
5. Contact development team

---

**Implementation Status:** ✅ Complete
**Last Updated:** 2025-01-18
**Version:** 1.0.0
# 🚀 Base Chain Deployment Guide

## Prerequisites

1. **Node.js & npm** installed
2. **Base wallet** with ETH for gas fees
3. **Environment variables** configured

## Step 1: Install Dependencies

```bash
cd apps/web
npm install
```

## Step 2: Configure Environment

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Update the following variables:

```env
# Your wallet private key (for deployment only)
PRIVATE_KEY=your_private_key_here

# Base RPC URLs (default values work)
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Optional: BaseScan API key for verification
BASESCAN_API_KEY=your_basescan_api_key

# IPFS Configuration (existing)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret

# ElevenLabs (existing)
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Step 3: Deploy to Base Sepolia (Testnet)

```bash
npm run deploy:base-sepolia
```

Expected output:
```
🚀 Deploying VoiceRecords contract to Base...
📦 Deploying contract...
✅ VoiceRecords deployed to: 0x1234567890123456789012345678901234567890
📊 Initial total recordings: 0
🧪 Testing basic functionality...
✅ Test transaction confirmed in block: 12345
📊 Total recordings after test: 1
🎉 Deployment and testing completed successfully!
```

## Step 4: Update Environment Variables

Add the deployed contract address to your `.env.local`:

```env
NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=0x1234567890123456789012345678901234567890
```

## Step 5: Deploy to Base Mainnet (Production)

⚠️ **Only after thorough testing on Sepolia**

```bash
npm run deploy:base
```

## Step 6: Verify Contract (Optional)

```bash
# For Sepolia
npm run verify:base-sepolia 0x1234567890123456789012345678901234567890

# For Mainnet
npm run verify:base 0x1234567890123456789012345678901234567890
```

## Step 7: Test Gasless Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:4445/studio`

3. Connect your Base Account

4. Test recording and gasless saving

## Contract Features

### ✅ Gasless Transactions
- Sub Accounts with Auto Spend Permissions
- No wallet popups after initial setup
- Sponsored gas fees via paymaster (optional)

### ✅ Full IPFS Hash Support
- No truncation issues (unlike Starknet felt252)
- Native string support in Solidity
- Complete audio file references

### ✅ Simple & Efficient
- Gas-optimized storage
- Minimal contract complexity
- Easy to audit and maintain

## Troubleshooting

### Contract Not Deployed
```
Error: VOICE_RECORDS_CONTRACT not set
```
**Solution**: Deploy contract and update `NEXT_PUBLIC_VOICE_RECORDS_CONTRACT`

### Insufficient Funds
```
Error: insufficient funds for gas
```
**Solution**: Add ETH to your deployment wallet

### RPC Issues
```
Error: Failed to fetch
```
**Solution**: Check RPC URLs in `.env.local`

### Sub Account Creation Failed
```
Error: Sub Account creation failed
```
**Solution**: Ensure Base Account SDK is properly configured

## Gas Costs (Base Mainnet)

| Operation | Estimated Gas | Cost (~$0.001/gas) |
|-----------|---------------|---------------------|
| Deploy Contract | ~800,000 | ~$0.80 |
| Save Recording | ~80,000 | ~$0.08 |
| Get Recording | 0 (view) | Free |
| Increment Play Count | ~30,000 | ~$0.03 |

## Security Notes

1. **Private Key**: Never commit private keys to version control
2. **Environment Variables**: Use `.env.local` for sensitive data
3. **Contract Verification**: Always verify contracts on BaseScan
4. **Testing**: Thoroughly test on Sepolia before mainnet deployment

## Next Steps

1. **Deploy Contract** ✅
2. **Test Gasless Flow** ✅
3. **Add Paymaster** (optional for sponsored gas)
4. **Integrate Messaging APIs** (WhatsApp, Telegram)
5. **Launch Base Builder Quest Demo** 🚀

## Support

- **Base Documentation**: https://docs.base.org
- **Sub Accounts Guide**: https://docs.base.org/tools/account-kit
- **BaseScan**: https://basescan.org (mainnet) / https://sepolia.basescan.org (testnet)
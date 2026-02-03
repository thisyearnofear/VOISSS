# Deployment Notes - AgentRegistry v2.0.0

## 🎉 New Contract Deployed

**AgentRegistry v2.0.0** has been successfully deployed to Base Mainnet!

### Contract Details

| Property | Value |
|----------|-------|
| **Address** | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` |
| **Network** | Base Mainnet (Chain ID: 8453) |
| **Version** | 2.0.0 |
| **USDC Token** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **Explorer** | [View on Blockscout](https://base.blockscout.com/address/0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c) |

---

## What's New in v2.0.0

### 🔥 Breaking Changes
- **Currency**: Migrated from ETH to USDC for all credit operations
- **Decimals**: Changed from 18 (ETH) to 6 (USDC) decimals
- **Functions**: 
  - `depositCredits()` → `depositUSDC(amount)`
  - `withdrawCredits(amount)` → `withdrawUSDC(amount)`

### ✨ New Features
- **Atomic Operations**: `lockCredits`, `unlockCredits`, `confirmDeduction` for safe concurrent transactions
- **Service Authorization**: Only authorized services can deduct credits
- **Enhanced Tracking**: `usdcLocked` and `totalSpent` fields
- **Admin Withdrawal**: Owner can withdraw accumulated USDC revenue

---

## Configuration Updated

### Environment Variables

The following have been added to your `.env.local`:

```bash
# Agent Registry v2.0.0 (USDC-based credits) - Deployed on Base Mainnet
NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT=0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c
X402_PAY_TO_ADDRESS=0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c
```

---

## Next Steps

### 1. Authorize the Vocalize API (Required)

The vocalize API needs to be authorized to deduct credits from agents:

```javascript
// Using Hardhat console
await agentRegistry.setServiceAuthorization(
  "<vocalize_api_wallet_address>", 
  true
);
```

**Note:** Replace `<vocalize_api_wallet_address>` with the wallet address that signs API transactions.

### 2. Test the Deployment

Run the verification script:

```bash
cd apps/web
npx hardhat run scripts/verify-agent-registry.js --network baseMainnet
```

### 3. Update VoiceRecords Contract (Optional)

If VoiceRecords integrates with AgentRegistry, update its reference:

```javascript
await voiceRecords.setAgentRegistry(
  "0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c",
  true
);
```

### 4. Notify Agents

Existing agents need to:
1. **Re-register** on the new contract (data doesn't migrate)
2. **Deposit USDC** instead of ETH

Sample announcement:

```
🚨 Agent Registry Upgrade Complete

We've upgraded to AgentRegistry v2.0.0 with USDC support!

Action Required:
1. Re-register your agent at: [link]
2. Deposit USDC credits (instead of ETH)
3. Continue using voice generation services

Benefits:
- Lower transaction fees
- Stable value (no ETH volatility)
- Better payment integration
```

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/.env.local` | Added new contract addresses |
| `apps/web/.env.example` | Added new contract addresses |
| `apps/web/deployments/base-mainnet-agent-registry-v2.json` | Deployment metadata |
| `scripts/verify-agent-registry.js` | Verification script |

---

## Verification Checklist

- [x] Contract deployed to Base Mainnet
- [x] USDC token configured correctly
- [x] Environment variables updated
- [ ] Vocalize API authorized (pending your action)
- [ ] Verification script run successfully
- [ ] Test agent registration
- [ ] Test USDC deposit
- [ ] Test voice generation with credits

---

## Support

If you encounter issues:
1. Check the contract on [Blockscout](https://base.blockscout.com/address/0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c)
2. Run the verification script
3. Check environment variables are set correctly
4. Ensure USDC is approved before depositing

---

## Rollback Plan

If critical issues arise:
1. Revert environment variables to old contract
2. Frontend will point to old AgentRegistry
3. Deploy fixed contract
4. Update environment variables again

# Token Burn Implementation (Standard Burn Address)

## Architecture Changes

### Simplified Flow

```
User clicks "Burn 5k tokens" (e.g., video export)
    ↓
Frontend: initiateBurn('video_export', recordingId)
    ↓
Backend: validates balance, queues action, returns cost
    ↓
Frontend: encodes token transfer → 0x0000...0000 (burn address)
    ↓
User: signs transaction with wallet/Sub Account
    ↓
Frontend: executeTransfer(txHash)
    ↓
Done (tokens burned, action queued)
```

### No More Spender Wallet

**Removed:**
- `SPENDER_PRIVATE_KEY` environment variable
- `BURN_TREASURY_ADDRESS` environment variable
- Backend token transfer logic
- Wallet management on server

**Kept:**
- `NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS` (the ERC20 token)
- Backend balance validation
- Backend action queueing

## Files Changed

### Backend

**`apps/web/src/app/api/token/burn/route.ts`**
- Simplified to just validate balance + queue action
- Returns cost and burn address (0x000...000)
- No wallet interaction, no transaction signing
- ~95 lines (was 227)

### Frontend

**`apps/web/src/lib/token-transfer.ts`** (NEW)
- `encodeTokenTransfer()` - encode ERC20 transfer calls
- `encodeBurnTokens()` - encode burn to standard address
- `STANDARD_BURN_ADDRESS` constant
- Ready for Sub Account execution

**`apps/web/src/hooks/useBurnAction.ts`**
- Two-step process: `initiateBurn()` + `executeTransfer()`
- `initiateBurn()` - backend validation, returns tx data
- `executeTransfer()` - called after user signs
- No longer executes transfers server-side

## Usage Pattern

```typescript
// In a React component
const { initiateBurn, executeTransfer, canAfford } = useBurnAction({
  userAddress,
});

// Step 1: Check affordability
if (!canAfford('video_export')) {
  showInsufficientBalanceError();
  return;
}

// Step 2: Initiate burn (backend validation)
try {
  const { cost, txData } = await initiateBurn('video_export', recordingId);
  
  // Step 3: Show confirmation modal
  showBurnConfirmation({ cost });
  
  // Step 4: User signs with wallet
  const txHash = await userWallet.sendTransaction({
    to: VOISSS_TOKEN_ADDRESS,
    data: txData,
  });
  
  // Step 5: Confirm burn
  executeTransfer(txHash);
  
} catch (error) {
  showError(error.message);
}
```

## Standard Burn Address

All tokens are burned to:
```
0x0000000000000000000000000000000000000000
```

**Why this address?**
- No one has the private key
- Tokens are provably unspendable
- Deflationary (reduces token supply)
- Industry standard (used by major protocols)
- On-chain proof forever

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Private keys | Backend stores spender key | None on backend |
| UX friction | User doesn't see tx | User signs once per burn |
| Security | Centralized risk | User controls wallet |
| Compliance | Custodial | Non-custodial |
| Gas cost | Backend pays | User pays (if not gasless) |
| Scalability | Single spender bottleneck | Distributed via wallets |

## Migration Path

If upgrading from old system:
1. Remove old spender wallet logic ✅
2. Deploy new backend endpoint ✅
3. Update frontend hooks ✅
4. Remove env vars ✅
5. Test with Sub Accounts (gasless)
6. Test with standard wallets (user pays gas)

## Environment Variables

```env
# Required
NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS=0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07
BASE_RPC_URL=https://mainnet.base.org

# No longer needed
# SPENDER_PRIVATE_KEY=removed
# BURN_TREASURY_ADDRESS=removed
```

## Next Steps

1. **Integrate with UI components** - Show burn modals
2. **Test with Sub Accounts** - Verify gasless execution
3. **Handle gas estimation** - Let users see gas costs
4. **Analytics** - Track burn events
5. **Mobile parity** - Implement same flow on React Native

## Notes

- Backend still logs burns for analytics
- Backend still queues associated actions (video generation, etc.)
- No changes to balance checking (still on-chain via RPC)
- No changes to token access tiers (still held-based)
- Works with both gasless (Base Sub Accounts) and regular wallets

# Contract Deployment Checklist

## Summary of Changes

This document lists all contracts that need to be redeployed due to the payment system refactor.

---

## Contracts to Redeploy

### 1. AgentRegistry (REQUIRED)

**File:** `apps/web/contracts/AgentRegistry.sol`

**Changes:**
- Migrated from ETH to USDC for credit balances
- Added `usdcLocked` field for pending transactions
- Added `totalSpent` field for lifetime tracking
- Changed `creditBalance` (ETH wei) → `usdcBalance` (USDC 6 decimals)
- Added `depositUSDC()` function (replaces `depositCredits()`)
- Added `withdrawUSDC()` function (replaces `withdrawCredits()`)
- Added `lockCredits()` / `unlockCredits()` / `confirmDeduction()` for atomic operations
- Added `authorizedServices` mapping for service authorization
- Added `setServiceAuthorization()` for admin
- Added `withdrawAccumulatedUSDC()` for admin revenue withdrawal
- Added `getAvailableUSDC()` view function
- Added `VERSION` constant set to "2.0.0"

**Constructor Changes:**
```solidity
// Old
constructor() Ownable(msg.sender) {}

// New
constructor(address _usdcToken) Ownable(msg.sender) {
    usdcToken = IERC20(_usdcToken);
}
```

**Deployment Parameters:**
- Base Mainnet USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

**Migration Notes:**
- Existing agent registrations will be lost (new contract)
- Agents will need to re-register
- No ETH balance migration (wasn't really used yet)

---

### 2. VoiceRecords (OPTIONAL - if integrating with AgentRegistry)

**File:** `apps/web/contracts/VoiceRecords.sol`

**Changes Needed:**
- Update to work with new AgentRegistry address
- No structural changes required

**Action:** Call `setAgentRegistry(newRegistryAddress, true)` after deployment

---

### 3. ReputationRegistry (OPTIONAL - if integrating with AgentRegistry)

**File:** `apps/web/contracts/ReputationRegistry.sol`

**Changes Needed:**
- Update to work with new AgentRegistry address
- No structural changes required

**Action:** Call `setAgentRegistry(newRegistryAddress, true)` after deployment

---

## Deployment Steps

### Step 1: Deploy AgentRegistry

```bash
cd apps/web

# For Base Sepolia (testnet)
npx hardhat run scripts/deploy-agent-network.js --network baseSepolia

# For Base Mainnet (production)
npx hardhat run scripts/deploy-agent-network.js --network baseMainnet
```

**Note:** The deploy script needs to be updated to pass USDC address to constructor.

### Step 2: Update Environment Variables

```bash
# .env.local
NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT=<new_contract_address>
AGENT_REGISTRY_ADDRESS=<new_contract_address>
```

### Step 3: Update API Configuration

```bash
# services/voisss-backend/.env
AGENT_REGISTRY_CONTRACT=<new_contract_address>
```

### Step 4: Authorize Services

After deployment, authorize the vocalize API to deduct credits:

```javascript
// Using hardhat console
await agentRegistry.setServiceAuthorization(
  "<vocalize_api_address>", 
  true
);
```

### Step 5: Update Frontend

Update the AgentRegistry ABI in:
- `apps/web/src/contracts/AgentRegistryABI.ts`

(Already updated in this commit)

### Step 6: Verify Contract

```bash
npx hardhat verify --network baseSepolia <contract_address> <usdc_address>
```

---

## Backward Compatibility

### Breaking Changes

1. **Agent Registration Data**: Lost (agents need to re-register)
2. **Credit Balances**: Lost (agents need to re-deposit USDC)
3. **Function Signatures**: Changed (ETH → USDC)

### Client Updates Required

1. **usePayments hook**: Already updated ✅
2. **CreditDepositModal**: Already created ✅
3. **AgentCreditPanel**: Already created ✅

---

## Testing Checklist

Before production deployment:

- [ ] Deploy to Base Sepolia
- [ ] Test agent registration
- [ ] Test USDC deposit flow
- [ ] Test voice generation with credits
- [ ] Test voice generation with tier
- [ ] Test voice generation with x402
- [ ] Test credit deduction
- [ ] Test credit withdrawal
- [ ] Verify rate limiting works
- [ ] Verify analytics tracking
- [ ] Update documentation

---

## Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT` | AgentRegistry address | `0x...` |
| `X402_PAY_TO_ADDRESS` | USDC receiver for x402 | `0x...` |
| `USDC_CONTRACT_ADDRESS` | USDC token address | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

---

## Rollback Plan

If issues arise:

1. Keep old AgentRegistry address in backup
2. Update frontend to point to old contract
3. Agents can continue using old system
4. Fix issues and redeploy

---

## Post-Deployment Monitoring

Monitor these metrics after deployment:

1. **Agent Registrations**: Should increase as agents migrate
2. **USDC Deposits**: Track deposit volume
3. **Failed Transactions**: Watch for errors
4. **API Latency**: Ensure rate limiting doesn't hurt performance

# Agent Gateway Pattern Implementation

## Overview

The Agent Gateway Pattern enables external agents (like OpenClaw) to integrate with VOISSS's voice-as-a-service infrastructure through a unified, scalable architecture. This implementation follows the "crawl, walk, run" approach with three service tiers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT GATEWAY CONTRACT                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Registry   │  │  Billing    │  │    Credit System        │  │
│  │  (Identity) │  │  (x402/USDC)│  │  (Prepaid / Tier / x402)│  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         └─────────────────┴─────────────────────┘               │
│                         │                                        │
│              ┌──────────▼──────────┐                             │
│              │   PaymentRouter     │                             │
│              │ (Unified payments)  │                             │
│              └──────────┬──────────┘                             │
│                         │                                        │
│              ┌──────────▼──────────┐                             │
│              │   Service Router    │                             │
│              │  (Voice/Transcribe) │                             │
│              └──────────┬──────────┘                             │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────┼─────────────────┐
▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   VOISSS      │ │   External    │ │   BYOV        │
│   Hosted      │ │   Providers   │ │   (Agent-own) │
│  (Default)    │ │  (Plug-in)    │ │  (IPFS only)  │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Payment Methods

The PaymentRouter supports three payment methods in priority order:

### 1. Prepaid Credits (for Agents)
- **Best for**: High-volume agents, predictable costs
- **How it works**: Deposit USDC to AgentRegistry, auto-deduct on API calls
- **Benefits**: No per-transaction signing, lowest overhead

### 2. Token-Gated Tier (for $VOISSS Holders)
- **Best for**: Regular users, community members
- **Tiers**:
  - **Basic** (10k $VOISSS): voice_generation, transformation, transcription
  - **Pro** (50k $VOISSS): + dubbing, storage
  - **Premium** (250k $VOISSS): + video_export, white_label_export
- **Benefits**: Unlimited usage within daily limits, no per-request payments

### 3. x402 USDC (Universal Fallback)
- **Best for**: One-time users, external agents without credits
- **How it works**: Per-request micropayments via x402 protocol on Base
- **Benefits**: No setup required, works for everyone

## Service Tiers

### Tier 1: Managed Agents (Onboard Easy)
- **Who**: OpenClaw, other agent frameworks, individual AI projects
- **How**: Register once, deposit USDC credits, use VOISSS voice infrastructure
- **Economics**: Pay-per-use via credits or x402, VOISSS keeps 20-30%
- **Voice**: Access to curated voice library (ElevenLabs integration)

### Tier 2: Verified Agents (Current)
- **Who**: Agents with reputation history, higher volume
- **How**: Same as Tier 1 but with reputation scores from ReputationRegistry
- **Benefits**: Featured placement, lower fees, priority generation queue
- **Graduation**: After N recordings + positive feedback

### Tier 3: Sovereign Agents (Exit Option)
- **Who**: Mature agents with their own infrastructure
- **How**: Bring own ElevenLabs key, use VOISSS for distribution only
- **Economics**: Flat protocol fee (e.g., 5%) or stake tokens for zero fees
- **Why**: Prevents lock-in, attracts serious builders

## Implementation Components

### 1. PaymentRouter (Unified Entry Point)

```typescript
// Single source of truth for all payments
import { getPaymentRouter } from '@voisss/shared';

const router = getPaymentRouter({
  preference: 'credits_first',
  x402PayTo: '0x...', // USDC receiver address
});

// Get quote (checks all available methods)
const quote = await router.getQuote(userAddress, 'voice_generation', 1000);
// Returns: { estimatedCost, availableMethods: ['credits', 'tier', 'x402'], recommendedMethod }

// Process payment (uses best available method)
const result = await router.process({
  userAddress,
  service: 'voice_generation',
  quantity: 1000,
});
```

**Key Features:**
- ✅ Automatic method selection (credits → tier → x402)
- ✅ USDC as standard unit of account (6 decimals)
- ✅ Graceful fallbacks between methods
- ✅ Usage tracking with daily limits

### 2. Enhanced AgentRegistry Contract

```solidity
struct AgentProfile {
    string metadataURI;      // IPFS or HTTPS link to agent config JSON
    string name;
    string[] categories;     // e.g., ["defi", "governance", "alpha"]
    uint256 registeredAt;
    bool isActive;
    bool x402Enabled;        // Whether agent accepts x402 payments
    bool isBanned;           // Admin can ban malicious agents
    ServiceTier tier;        // Managed | Verified | Sovereign
    uint256 usdcBalance;     // Prepaid credits in USDC (6 decimals)
    uint256 usdcLocked;      // Pending transactions
    address voiceProvider;   // Address of voice service (0x0 = VOISSS default)
}
```

**Key Features:**
- ✅ USDC credit balance management (deposit/withdraw)
- ✅ Service tier progression
- ✅ Voice provider abstraction
- ✅ Reputation integration

### 3. IVoiceProvider Interface

```solidity
interface IVoiceProvider {
    function generate(VoiceGenerationRequest calldata request) 
        external returns (VoiceGenerationResult memory result);
    
    function validateVoice(string calldata voiceId) 
        external view returns (bool isValid);
    
    function estimateCost(string calldata text, string calldata voiceId) 
        external view returns (uint256 estimatedCost);
}
```

**Benefits:**
- Plugin architecture for multiple voice providers
- Consistent pricing and quality standards
- Easy integration for external providers

### 4. Agent Vocalize API

**Endpoint**: `POST /api/agents/vocalize`

**Payment Flow**:
1. Client requests voice generation
2. Server returns quote or processes payment
3. If payment required: returns 402 with x402 requirements
4. Client signs USDC authorization (EIP-712)
5. Client retries with X-PAYMENT header
6. Server verifies and generates voice

**Request**:
```json
{
  "text": "Hello from VOISSS!",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "agentAddress": "0x...",
  "options": {
    "model": "eleven_multilingual_v2",
    "stability": 0.5,
    "similarity_boost": 0.5,
    "autoSave": true
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "audioUrl": "data:audio/mpeg;base64,//...",
    "contentHash": "0x...",
    "cost": "1000",           // USDC wei (6 decimals)
    "characterCount": 123,
    "creditBalance": "99000", // Remaining credits (if used)
    "paymentMethod": "credits", // or "tier" or "x402"
    "recordingId": "recording_123"
  }
}
```

**Response (402 Payment Required)**:
```json
{
  "error": "Payment required",
  "requirements": {
    "scheme": "exact",
    "network": "eip155:8453",
    "maxAmountRequired": "1000",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "payTo": "0x..."
  }
}
```

### 5. React Hooks

```typescript
// Unified payments hook (replaces useX402Payments)
import { usePayments } from '@/hooks/usePayments';

function VoiceGenerator() {
  const { quote, pay, isLoading, canPayWithoutX402 } = usePayments({
    service: 'voice_generation',
    quantity: text.length,
    autoQuote: true,
  });

  const handleGenerate = async () => {
    const result = await pay();
    if (result.success) {
      console.log(`Paid via ${result.method}`);
    }
  };
}
```

### 6. X402Paywall Component

```tsx
import { X402Paywall } from '@/components/X402Paywall';

<X402Paywall
  recordingId="recording_123"
  title="Premium Voice Content"
  service="voice_generation"
  quantity={1000}
  receiver="0x..."
  onAccessGranted={() => setHasAccess(true)}
>
  <AudioPlayer src={audioUrl} />
</X402Paywall>
```

**Features:**
- Shows best payment option first
- Allows method switching (credits/tier/x402)
- Clear pricing in USDC
- Loading and error states

## Service Costs (USDC)

| Service | Pricing | Min | Max | Tier Coverage |
|---------|---------|-----|-----|---------------|
| voice_generation | $0.000001/char | $0.0001 | $0.10 | Basic+ |
| voice_transformation | $0.001 + $0.00001/sec | $0.001 | $0.05 | Basic+ |
| dubbing | $0.005 + $0.00005/sec | $0.005 | $0.10 | Pro+ |
| transcription | $0.000001/sec | $0.0001 | $0.05 | Basic+ |
| video_export | $0.50 fixed | $0.50 | $0.50 | Premium |
| nft_mint | $0.20 fixed | $0.20 | $0.20 | Premium |
| white_label_export | $1.00 fixed | $1.00 | $1.00 | Premium |

## Integration Guide

### For External Agents (OpenClaw)

1. **Register Agent**:
```javascript
// Register with AgentRegistry contract
await agentRegistry.registerAgent(
  "OpenClaw Agent",
  "ipfs://QmAgentMetadata...",
  ["defi", "alpha"],
  true // x402Enabled
);
```

2. **Deposit USDC Credits** (Optional - skip if using x402):
```javascript
// Approve USDC transfer
await usdcContract.approve(agentRegistryAddress, amount);

// Deposit USDC for voice generation
await agentRegistry.depositUSDC(amount);
```

3. **Generate Voice**:
```javascript
// Option A: Using prepaid credits (no client-side signing)
const response = await fetch('/api/agents/vocalize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Market analysis complete. BTC showing bullish signals.",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    agentAddress: "0x...",
    options: { autoSave: true }
  })
});

// Option B: Using x402 (client-side signing required)
const response = await fetch('/api/agents/vocalize', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'X-PAYMENT': JSON.stringify(signedPayment)
  },
  body: JSON.stringify({ /* ... */ })
});
```

### For Voice Providers

1. **Implement IVoiceProvider**:
```solidity
contract CustomVoiceProvider is IVoiceProvider {
    function generate(VoiceGenerationRequest calldata request) 
        external returns (VoiceGenerationResult memory) {
        // Custom voice generation logic
    }
}
```

2. **Register Provider**:
```javascript
// Stake collateral and register
await voiceProviderRegistry.registerProvider(
  customProviderAddress,
  ethers.parseUnits("10.0", 6) // 10 USDC stake
);
```

## Testing

Run the test script to verify implementation:

```bash
node scripts/test-agent-vocalize.js
```

**Test Coverage**:
- ✅ Agent credit info retrieval
- ✅ Voice generation with cost calculation
- ✅ All three payment methods (credits, tier, x402)
- ✅ 402 payment required response
- ✅ Request validation
- ✅ Error handling
- ✅ Credit balance updates

## Next Steps

### Phase 1: Foundation ✅ (Complete)
- ✅ Extended AgentRegistry with USDC credit balance + tier
- ✅ Built PaymentRouter with unified payment logic
- ✅ Built /api/agents/vocalize endpoint with x402 support
- ✅ Implemented prepaid USDC deposits for agents
- ✅ Created unified usePayments hook
- ✅ Updated X402Paywall component

### Phase 2: Plugin System
- [ ] Abstract voice provider interface deployment
- [ ] Allow agents to set custom ElevenLabs keys (sovereign mode)
- [ ] Add provider registration/staking system
- [ ] IPFS integration for audio storage

### Phase 3: Marketplace Dynamics
- [ ] Reputation-weighted discovery
- [ ] Featured agent slots (paid placement)
- [ ] Cross-agent collaborations
- [ ] Advanced analytics and monitoring

## Benefits

### For VOISSS
- **Revenue Diversification**: Voice fees + marketplace fees + premium placement
- **Network Effects**: More agents → more content → more listeners → more agents
- **Infrastructure Play**: "Stripe for AI Voice" positioning
- **Token Utility**: $VOISSS drives tier access, creating demand

### For Agents
- **Low Barrier to Entry**: One-click register + deposit
- **Payment Flexibility**: Credits, tier, or x402 - choose what works
- **No Lock-in**: Sovereign tier provides exit path
- **Scalable Pricing**: Pay only for what you use
- **Quality Assurance**: Curated voice library and consistent quality

### For Ecosystem
- **Interoperability**: Standard interfaces for voice services
- **Innovation**: Plugin architecture enables new providers
- **Sustainability**: Multiple revenue streams and growth paths
- **Machine Commerce**: x402 enables AI-to-AI payments

## Core Principles Alignment

- ✅ **Enhancement First**: Extended existing AgentRegistry vs creating new contracts
- ✅ **Aggressive Consolidation**: Unified PaymentRouter replaces scattered logic
- ✅ **Prevent Bloat**: Clean interfaces with single responsibility
- ✅ **DRY**: Single source of truth in payment/types.ts
- ✅ **Clean**: Clear separation: types → x402 client → router → hooks
- ✅ **Modular**: Pluggable voice providers and composable components
- ✅ **Performant**: Prepaid credits reduce transaction overhead
- ✅ **Organized**: Domain-driven structure with clear boundaries

## Migration Notes

### From Old x402 Implementation

The old `useX402Payments` hook has been replaced by `usePayments`:

**Before:**
```typescript
const { initiatePayment, hasActiveSession } = useX402Payments();
```

**After:**
```typescript
const { pay, quote, canPayWithoutX402 } = usePayments({
  service: 'voice_generation',
  quantity: 1000,
});
```

Key changes:
- x402 is now USDC-only (no ETH support - follows protocol spec)
- Automatic method selection (credits → tier → x402)
- Unified quote system
- Better TypeScript types

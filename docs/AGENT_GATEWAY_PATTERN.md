# Agent Gateway Pattern Implementation

## Overview

The Agent Gateway Pattern enables external agents (like OpenClaw) to integrate with VOISSS's voice-as-a-service infrastructure through a unified, scalable architecture. This implementation follows the "crawl, walk, run" approach with three service tiers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT GATEWAY CONTRACT                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Registry   │  │  Billing    │  │    Credit System        │  │
│  │  (Identity) │  │  (x402/ETH) │  │  (Prepaid / Streaming)  │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         └─────────────────┴─────────────────────┘               │
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

## Service Tiers

### Tier 1: Managed Agents (Onboard Easy)
- **Who**: OpenClaw, other agent frameworks, individual AI projects
- **How**: Register once, deposit credits, use VOISSS voice infrastructure
- **Economics**: Pay-per-use (x402 per character), VOISSS keeps 20-30%
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

### 1. Enhanced AgentRegistry Contract

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
    uint256 creditBalance;   // Prepaid credits for voice generation (wei)
    address voiceProvider;   // Address of voice service (0x0 = VOISSS default)
}
```

**Key Features:**
- ✅ Credit balance management (deposit/withdraw)
- ✅ Service tier progression
- ✅ Voice provider abstraction
- ✅ Reputation integration

### 2. IVoiceProvider Interface

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

### 3. Agent Vocalize API

**Endpoint**: `POST /api/agents/vocalize`

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

**Response**:
```json
{
  "success": true,
  "data": {
    "audioUrl": "data:audio/mpeg;base64,//...",
    "contentHash": "0x...",
    "cost": 0.0123,
    "characterCount": 123,
    "creditBalance": 0.9877,
    "recordingId": "recording_123"
  }
}
```

### 4. Agent Credit Panel UI

React component for Studio integration:
- Real-time credit balance display
- Deposit/withdraw functionality
- Service tier information
- Usage statistics

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

2. **Deposit Credits**:
```javascript
// Deposit ETH for voice generation
await agentRegistry.depositCredits({ value: ethers.parseEther("1.0") });
```

3. **Generate Voice**:
```javascript
// Call VOISSS API
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
  ethers.parseEther("10.0") // stake amount
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
- ✅ Request validation
- ✅ Error handling
- ✅ Credit balance updates

## Next Steps

### Phase 1: Foundation (Current)
- ✅ Extended AgentRegistry with credit balance + tier
- ✅ Built /api/agents/vocalize endpoint
- ✅ Implemented prepaid deposit/withdraw for agents
- ✅ Created Agent Credit Panel UI

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

### For Agents
- **Low Barrier to Entry**: One-click register + deposit
- **No Lock-in**: Sovereign tier provides exit path
- **Scalable Pricing**: Pay only for what you use
- **Quality Assurance**: Curated voice library and consistent quality

### For Ecosystem
- **Interoperability**: Standard interfaces for voice services
- **Innovation**: Plugin architecture enables new providers
- **Sustainability**: Multiple revenue streams and growth paths

## Core Principles Alignment

- ✅ **Enhancement First**: Extended existing AgentRegistry vs creating new contracts
- ✅ **Aggressive Consolidation**: Unified credit system across all services
- ✅ **Prevent Bloat**: Clean interfaces with single responsibility
- ✅ **DRY**: Shared types and validation logic
- ✅ **Clean**: Clear separation between contracts, API, and UI
- ✅ **Modular**: Pluggable voice providers and composable components
- ✅ **Performant**: Prepaid credits reduce transaction overhead
- ✅ **Organized**: Domain-driven structure with clear boundaries
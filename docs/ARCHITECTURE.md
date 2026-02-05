# VOISSS Architecture & Technology

## Monorepo Structure
```
voisss/
├── apps/
│   ├── web/          # Next.js 14 + Base Account SDK
│   ├── mobile/       # React Native + Expo
│   └── mobile-flutter/ # Flutter + Serverpod
├── packages/
│   ├── shared/       # Common utilities & types
│   ├── contracts/    # Solidity smart contracts
│   └── ui/           # Shared components
└── docs/             # Documentation
```

## Technology Stack

### Web Platform
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Base Account SDK, wagmi/viem
- **AI Services**: ElevenLabs, Google Gemini
- **Storage**: IPFS via Pinata

### Mobile Platform
- **Framework**: React Native with Expo
- **Router**: Expo Router
- **Language**: TypeScript
- **Blockchain**: Scroll integration with wagmi/viem
- **Audio**: expo-audio for native recording

### Flutter Platform
- **Frontend**: Flutter with Dart
- **Backend**: Serverpod (Dart)
- **Database**: PostgreSQL
- **AI**: Venice AI (Llama 3.3 70B)
- **Hosting**: Hetzner Cloud

## Key Components

### Core Services
- **AIVoicePanel**: Main interface for voice transformation
- **TokenAccessService**: Manages token tiers and burn actions
- **MissionSystem**: Handles mission creation and participation
- **IPFSService**: Manages decentralized storage

### Blockchain Integration
- **Base Account SDK**: Handles wallet connections and Sub Accounts
- **Gasless Transactions**: Spender wallet pays gas fees
- **Contract Interactions**: Recording storage and retrieval

### Token System
- **$VOISSS Tiers**:
  - Freemium: 0 tokens - 1 free transform/session
  - Basic: 10k tokens - Unlimited transforms, dubbing
  - Pro: 50k tokens - Priority processing, advanced voices
  - Premium: 250k tokens - VIP Lane mode, creator tools

- **$PAPAJAMS Creator Token**:
  - Minimum: 1M tokens to create missions
  - Rewards: 70% $papajams, 30% $voisss per mission

## Platform Status

| Platform | Status | Key Features |
|----------|--------|--------------|
| **Web** | ✅ Production Ready | Gasless txs, AI transformation, mission system |
| **Mobile** | ⚠️ Functional, needs completion | Native recording, VRF, privacy |
| **Flutter** | ✅ Live (AI Butler) | Serverpod backend, Venice AI |

## Development Workflow

### Shared Package
The `@voisss/shared` package contains:
- Common types and interfaces
- Blockchain service abstractions
- Configuration files
- Utility functions
- Contract ABIs

### Cross-Platform Compatibility
- UI components are shared via `@voisss/ui` package
- Common business logic in `@voisss/shared`
- Platform-specific implementations where needed
- Consistent API contracts across platforms

## Security Considerations

- **Spender Wallet**: Keep private key secure, monitor balance regularly
- **Token Validation**: Always validate token balances on backend
- **Rate Limiting**: Implement rate limits on API endpoints
- **Input Validation**: Validate all user inputs
- **Contract Verification**: Verify contract addresses match deployed contracts

## Agent Registry

The Agent Registry manages AI agent registrations with a USDC-based credit system for voice generation payments.

### Smart Contract
- **Location**: `apps/web/contracts/AgentRegistry.sol`
- **Mainnet Address**: `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c`
- **Version**: v2.0.0
- **Network**: Base Mainnet

### Features
- **Agent Registration**: Register AI agents with voice capabilities
- **USDC Credit System**: Prepaid credits for voice generation (6 decimals)
- **Atomic Operations**: Lock/unlock/confirm pattern for secure payments
- **Service Tiers**: Bronze/Silver/Gold tiers with different benefits
- **x402 Fallback**: Automatic fallback to x402 when credits exhausted
- **Reputation System**: Track agent performance and ratings

### Key Functions
```solidity
// Register a new agent
function registerAgent(
    string memory metadataURI,
    string memory name,
    string[] memory categories,
    bool x402Enabled
) external returns (uint256 agentId)

// Deposit USDC for credits
function depositUSDC(uint256 amount) external

// Withdraw unused credits
function withdrawUSDC(uint256 amount) external

// Deduct credits for service (requires authorization)
function deductCredits(
    address agent,
    uint256 amount,
    string memory serviceName
) external returns (bool)

// Lock credits for atomic operation
function lockCredits(address agent, uint256 amount) external returns (bool)

// Unlock credits (on failure)
function unlockCredits(address agent, uint256 amount) external

// Confirm deduction (on success)
function confirmDeduction(address agent, uint256 amount) external

// Authorize service contract to deduct credits
function setServiceAuthorization(address service, bool authorized) external onlyOwner
```

### USDC Configuration
- **USDC Contract**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Decimals**: 6
- **Min Deposit**: 1 USDC
- **Min Withdrawal**: 1 USDC

### Service Tiers & Discounts
| Tier | Requirement | Service Discount | Key Benefits |
|------|-------------|------------------|--------------|
| **None** | No tokens | 0% | Pay-as-you-go access |
| **Bronze** | 10k $VOISSS | 10% OFF | Discounted rates, standard priority |
| **Silver** | 50k $VOISSS | 25% OFF | Advanced rates, high priority |
| **Gold** | 250k+ $VOISSS | 50% OFF | VIP rates, maximum priority lane |

### Whitelisting & Beta Access
The `PaymentRouter` includes a whitelisting mechanism for complimentary (100% discount) access. Whitelisted addresses bypass all payment requirements and are automatically routed to the tier access path with a $0 cost. This is used for platform owners, system agents, and authorized beta testers.
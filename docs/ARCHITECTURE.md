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
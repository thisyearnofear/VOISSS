# VOISSS Development Guide

## 🏗️ Technical Architecture

### Monorepo Structure
VOISSS is built as a **monorepo** using pnpm workspaces and Turbo for optimal development experience and code sharing across platforms.

```
voisss/
├── apps/
│   ├── web/                   # Next.js 15 + Starknet.js
│   │   ├── src/app/          # App router pages
│   │   ├── src/components/   # React components
│   │   └── src/hooks/        # Custom hooks
│   ├── mobile/               # React Native + Expo
│   │   ├── app/             # Expo Router pages
│   │   ├── components/      # Mobile components
│   │   └── hooks/           # Mobile-specific hooks
│   └── mobile-flutter/       # Flutter + starknet.dart
│       ├── lib/             # Flutter source
│       └── pubspec.yaml     # Dependencies
├── packages/
│   ├── shared/              # Common utilities
│   │   ├── src/types/       # TypeScript types
│   │   ├── src/services/    # Business logic
│   │   └── src/contracts/   # Contract ABIs
│   ├── contracts/           # Cairo smart contracts
│   └── ui/                  # Shared components
```

### Technology Stack

#### Frontend Frameworks
- **Web**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Mobile (RN)**: React Native with Expo Router, TypeScript
- **Mobile (Flutter)**: Flutter 3.32.0 with Dart

#### Blockchain Integration
- **Starknet**: Cairo smart contracts on Sepolia testnet
- **Web3 Libraries**: starknet.js (Web/RN), starknet.dart (Flutter)
- **Wallets**: ArgentX, Braavos integration

#### AI & Audio
- **Voice AI**: ElevenLabs API for voice transformation
- **Audio Processing**: Web Audio API, React Native Audio
- **Storage**: IPFS for decentralized content storage

## 🎯 Current Implementation Status

### ✅ Production Ready Features

#### AI Voice Transformation Platform
- **ElevenLabs Integration**: Professional-grade voice cloning
- **API Architecture**: Secure server-side API routes
  - `/api/elevenlabs/list-voices` - Fetch available voices
  - `/api/elevenlabs/transform-voice` - Process audio transformation
- **Freemium Model**: 1 free transformation, unlimited with wallet
- **Security**: API keys managed server-side, never exposed to client

#### User Experience Revolution
- **Progressive Disclosure**: Wallet connection only when needed
- **Mobile-First Design**: Optimized for primary mobile audience
- **Modal-based Flows**: Context-aware wallet connection
- **Content Architecture**: Dedicated Platform and Features pages

#### Starknet Integration
- **Smart Contracts**: Deployed on Starknet Sepolia
  - `VoiceStorage.cairo` - Recording metadata and ownership
  - `UserRegistry.cairo` - User profiles and reputation
  - `AccessControl.cairo` - Permission management
- **Wallet Integration**: ArgentX and Braavos support
- **Cross-platform**: Consistent blockchain interaction across all apps

### 🚧 In Development

#### SocialFi Mission System
**Status**: Foundation complete, UI implementation in progress

**Core Types** (`packages/shared/src/types/socialfi.ts`):
```typescript
export interface Mission {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number; // STRK tokens
  expiresAt: Date;
  maxParticipants?: number;
}

export interface MissionResponse {
  id: string;
  missionId: string;
  userId: string;
  audioUrl: string;
  transcript?: string;
  consentGiven: boolean;
  submittedAt: Date;
}
```

**Mission Service** (`packages/shared/src/services/mission-service.ts`):
- Mission management with demo data
- Response tracking and validation
- Reward calculation and distribution
- Privacy and consent controls

#### Components Built
- `MissionBoard.tsx` - Display active missions
- `MissionCard.tsx` - Individual mission interface
- `MissionFilters.tsx` - Filter by topic/difficulty
- `MissionRecordingInterface.tsx` - Recording flow for missions

### 🔧 Technical Implementation Details

#### Build System
- **Turbo**: Optimized monorepo builds and caching
- **TypeScript**: Strict type checking across all packages
- **ESLint**: Consistent code quality and formatting
- **Production Builds**: All apps compile successfully

#### State Management
- **Web**: React Context + Custom hooks
- **Mobile (RN)**: Zustand for lightweight state management
- **Mobile (Flutter)**: Provider pattern with ChangeNotifier

#### API Architecture
```typescript
// Server-side API routes (Next.js)
POST /api/elevenlabs/transform-voice
- Input: Audio file + voice selection
- Output: Transformed audio URL
- Security: Server-side API key handling

GET /api/elevenlabs/list-voices
- Output: Available voice options
- Caching: Voice list cached for performance
```

#### Database Schema
```typescript
// Recording metadata (stored on Starknet)
interface Recording {
  id: string;
  userId: string;
  title: string;
  ipfsHash: string;
  createdAt: number;
  tags: string[];
  isPublic: boolean;
}

// Mission responses (hybrid storage)
interface MissionResponse {
  onChainId: string;      // Starknet transaction
  ipfsMetadata: string;   // IPFS content hash
  localCache: object;     // Local app storage
}
```

## 🐛 Known Issues & Solutions

### Resolved Issues
- ✅ **TypeScript Compilation**: All type errors resolved across packages
- ✅ **Mobile Responsive**: Touch targets and layout optimized
- ✅ **Wallet State Management**: Proper connection/disconnection handling
- ✅ **Audio Preview**: Playback functionality working correctly

### Current Challenges
- **IPFS Upload Speed**: Investigating faster pinning services
- **Mobile Wallet Integration**: Flutter starknet.dart wallet connections
- **Audio Quality**: Optimizing compression vs quality balance

## 📊 Performance Metrics

### Build Performance
- **Web App**: ~2.3s cold build, ~0.8s hot reload
- **Mobile (RN)**: ~15s initial build, ~3s incremental
- **Mobile (Flutter)**: ~25s initial build, ~2s hot reload

### Bundle Sizes
- **Web**: 1.2MB initial bundle (gzipped)
- **Mobile (RN)**: 8.5MB APK size
- **Mobile (Flutter)**: 12MB APK size

### API Response Times
- **Voice List**: ~200ms average
- **Voice Transform**: ~3-8s depending on audio length
- **IPFS Upload**: ~2-5s for typical recordings

## 🔄 Development Workflow

### Local Development
```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev --filter=@voisss/web
pnpm dev --filter=@voisss/mobile

# Run tests
pnpm test

# Build for production
pnpm build
```

### Deployment Pipeline
1. **Development**: Local testing with hot reload
2. **Staging**: Netlify preview deployments
3. **Production**: Netlify production deployment
4. **Mobile**: Expo EAS builds for app stores

### Code Quality
- **Pre-commit Hooks**: ESLint, Prettier, TypeScript checks
- **CI/CD**: GitHub Actions for automated testing
- **Code Review**: Required for all pull requests

## 🔐 Security Considerations

### API Security
- **Environment Variables**: All sensitive keys server-side only
- **Rate Limiting**: Implemented on AI transformation endpoints
- **Input Validation**: File type and size validation
- **Error Handling**: No sensitive information in error messages

### Blockchain Security
- **Smart Contract Auditing**: Contracts reviewed for common vulnerabilities
- **Wallet Integration**: Secure connection patterns
- **Transaction Signing**: User confirmation required for all transactions

### Data Privacy
- **IPFS Storage**: Content addressing for immutable storage
- **User Consent**: Explicit consent for public recordings
- **Data Minimization**: Only necessary data stored on-chain

## 🚀 Next Development Priorities

### Immediate (Next 2 weeks)
1. **Complete Mission UI**: Finish MissionBoard integration
2. **Reward Distribution**: Implement STRK token rewards
3. **Content Moderation**: Basic filtering and reporting

### Short-term (Next month)
1. **Creator Profiles**: User reputation and stats
2. **Discovery Feed**: Public recording exploration
3. **Mobile App Polish**: Enhanced UX for mobile apps

### Medium-term (Next quarter)
1. **NFT Marketplace**: Voice recording NFTs
2. **Advanced AI**: Custom voice cloning
3. **Enterprise Features**: Team collaboration tools

---

**Last Updated**: December 2024
**Build Status**: ✅ All systems operational
**Next Milestone**: SocialFi mission system launch
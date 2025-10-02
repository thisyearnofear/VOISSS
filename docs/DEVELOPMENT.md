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
- **Web**: Next.js 15 with App Router, TypeScript, Tailwind CSS - **PRODUCTION READY**
- **Mobile (RN)**: React Native with Expo Router, TypeScript - **FUNCTIONAL, NEEDS COMPLETION**
- **Mobile (Flutter)**: Flutter 3.32.0 with Dart - **PROTOTYPE STAGE, NOT LAUNCH READY**

#### Blockchain Integration
- **Starknet**: Cairo smart contracts on Sepolia testnet
- **Web3 Libraries**: starknet.js (Web/RN), starknet.dart (Flutter)
- **Wallets**: ArgentX, Braavos integration (Web only - mobile pending)

#### AI & Audio
- **Voice AI**: ElevenLabs API for voice transformation
- **Audio Processing**: Web Audio API, React Native Audio
- **Storage**: IPFS for decentralized content storage

## 🎯 Honest Implementation Status

### ✅ Web App - PRODUCTION READY

#### Complete Features
- **AI Voice Transformation**: Full ElevenLabs integration with 29+ languages
- **Starknet Integration**: Complete wallet connection, smart contract interaction
- **IPFS Storage**: Decentralized recording storage and metadata
- **Mission System**: SocialFi features with reward distribution
- **User Experience**: Mobile-responsive, progressive disclosure
- **Security**: Server-side API management, secure wallet integration
- **Codebase**: ~2,000+ lines, comprehensive implementation

### ⚠️ React Native App - FUNCTIONAL BUT INCOMPLETE

#### Working Features
- **Native Audio Recording**: expo-audio integration working
- **Local Storage**: File management and caching
- **AI Transformation**: ElevenLabs API integration
- **Basic UI**: Recording interface and playback

#### Missing Critical Features
- **Starknet Integration**: Limited wallet connection capabilities
- **IPFS Sync**: No decentralized storage integration
- **Mission System**: SocialFi features not implemented
- **Cross-platform Sync**: No sync with Web app
- **Codebase**: ~1,500+ lines, solid foundation but incomplete

**Timeline to Production**: 2-3 months of focused development

### ❌ Flutter App - PROTOTYPE STAGE

#### Basic Structure Only
- **Recording Capability**: Basic audio recording (14 Dart files total)
- **Starknet Setup**: Partial integration, not functional
- **IPFS Service**: Exists but minimal implementation
- **UI**: Basic screens, not production-quality

#### Missing for Production
- **AI Transformation**: Not implemented
- **Complete Starknet Integration**: Needs full rebuild
- **Mission System**: Not implemented
- **Comprehensive Testing**: No test coverage
- **Production Architecture**: Current structure inadequate
- **Codebase**: ~800 lines, minimal implementation

**Reality Check**: This app is NOT launch ready and requires 6+ months of development

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
- **Web**: React Context + Custom hooks - **PRODUCTION READY**
- **Mobile (RN)**: Zustand for lightweight state management - **FUNCTIONAL**
- **Mobile (Flutter)**: Provider pattern with ChangeNotifier - **PROTOTYPE STAGE**

#### API Architecture
```typescript
// Server-side API routes (Next.js) - PRODUCTION READY
POST /api/elevenlabs/transform-voice
- Input: Audio file + voice selection
- Output: Transformed audio URL
- Security: Server-side API key handling
- Status: ✅ Fully functional

POST /api/elevenlabs/dub-audio
- Input: Audio file + source/target languages
- Output: Dubbed audio with transcript
- Features: Auto-detection, 29+ languages
- Status: ✅ Fully functional

GET /api/elevenlabs/list-voices
- Output: Available voice options
- Caching: Voice list cached for performance
- Status: ✅ Fully functional
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
- **React Native Starknet Integration**: Wallet connection needs completion
- **Flutter App Development**: Requires complete rebuild for production
- **IPFS Upload Speed**: Investigating faster pinning services
- **Audio Quality**: Optimizing compression vs quality balance
- **Mobile Testing**: Need comprehensive testing across devices

### Critical Issues to Address
- **False Launch Claims**: Flutter app is NOT App Store ready
- **Resource Allocation**: Focus needed on completing React Native
- **Timeline Expectations**: Set realistic development schedules
- **Quality Assurance**: Implement proper testing processes

## 📊 Performance Metrics

### Build Performance
- **Web App**: ~2.3s cold build, ~0.8s hot reload
- **Mobile (RN)**: ~15s initial build, ~3s incremental
- **Mobile (Flutter)**: ~25s initial build, ~2s hot reload

### Bundle Sizes
- **Web**: 1.2MB initial bundle (gzipped) - **PRODUCTION OPTIMIZED**
- **Mobile (RN)**: 8.5MB APK size - **FUNCTIONAL BUILD**
- **Mobile (Flutter)**: 12MB iOS IPA size - **PROTOTYPE BUILD, NOT APP STORE READY**

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
2. **Staging**: Netlify preview deployments (Web only)
3. **Production**: Netlify production deployment (Web only)
4. **Mobile**: 
   - **React Native**: Expo EAS builds (functional but incomplete)
   - **Flutter**: Prototype builds only (NOT App Store ready)

## 🚀 Realistic Development Priorities

### Immediate (Next 2 weeks) - Web Focus
1. **Web App Optimization**: Performance and user experience improvements
2. **User Acquisition**: Marketing and onboarding optimization
3. **Bug Fixes**: Address any production issues
4. **Analytics**: Implement user behavior tracking

### Short-term (2-3 months) - React Native Completion
1. **Complete Starknet Integration**: Full wallet connection and blockchain features
2. **IPFS Sync**: Implement cross-platform synchronization
3. **Mission System**: Add SocialFi features to mobile
4. **Testing**: Comprehensive mobile testing and QA

### Medium-term (6+ months) - Flutter Decision Point
1. **Evaluate Flutter ROI**: Assess if Flutter development is worth the investment
2. **Consider Alternatives**: Focus on Web + React Native might be more efficient
3. **If Proceeding**: Complete rebuild of Flutter app with production architecture
4. **iOS Premium Features**: Only if justified by market demand

### Long-term (Next year)
1. **Advanced Features**: NFT marketplace, custom voice cloning
2. **Enterprise Solutions**: Team collaboration tools
3. **Platform Expansion**: Consider additional platforms based on success metrics

---

**Last Updated**: January 2025
**Build Status**: ✅ Web production ready, ⚠️ Mobile apps in development
**Next Milestone**: React Native completion, realistic Flutter assessment
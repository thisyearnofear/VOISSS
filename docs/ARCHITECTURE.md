# 🏗️ VOISSS Architecture & Development Guide

## Technical Architecture

### Monorepo Structure
VOISSS is built as a **monorepo** using pnpm workspaces and Turbo for optimal development experience and code sharing across platforms.

```
voisss/
├── apps/
│   ├── web/                   # Next.js 15 + Base Account SDK
│   │   ├── src/app/          # App router pages
│   │   ├── src/components/   # React components
│   │   └── src/hooks/        # Custom hooks
│   ├── mobile/               # React Native + Expo
│   │   ├── app/             # Expo Router pages
│   │   ├── components/      # Mobile components
│   │   └── hooks/           # Mobile-specific hooks
│   └── mobile-flutter/       # Flutter + Base Account SDK
│       ├── lib/             # Flutter source
│       └── pubspec.yaml     # Dependencies
├── packages/
│   ├── shared/              # Common utilities
│   │   ├── src/types/       # TypeScript types
│   │   ├── src/services/    # Business logic
│   │   └── src/contracts/   # Contract ABIs
│   ├── contracts/           # Solidity smart contracts
│   └── ui/                  # Shared components
```

### Technology Stack

#### Frontend Frameworks
- **Web**: Next.js 15 with App Router, TypeScript, Tailwind CSS - **PRODUCTION READY**
- **Mobile (RN)**: React Native with Expo Router, TypeScript - **FUNCTIONAL, NEEDS COMPLETION**
- **Mobile (Flutter)**: Flutter 3.32.0 with Dart - **PROTOTYPE STAGE, NOT LAUNCH READY**

#### Blockchain Integration
- **Base Chain**: Solidity smart contracts on Sepolia testnet
- **Web3 Libraries**: Base Account SDK (Web/RN), Base Account SDK (Flutter)
- **Wallets**: Base Account integration with Sub Accounts for gasless transactions

#### AI & Audio
- **Voice AI**: ElevenLabs API for voice transformation & Conversational AI (WebSocket)
- **Intelligence**: Google Gemini 3.0 Flash (via ElevenLabs Agent or direct API)
- **Audio Processing**: Web Audio API, React Native Audio
- **Storage**: IPFS for decentralized content storage

## 🔧 Recent Refactoring Improvements

### ✅ Completed Refactoring (January 2025)

**Phase 1: Code Cleanup**
- Fixed undefined `variantBlobFree` reference in AIVoicePanel
- Removed stale state variables (`setVariantBlobFree`, `setDubbedBlob`)
- Consolidated audio blob management into version ledger system

**Phase 2: Module Boundary Separation**
- Created strict client/server export boundaries
- Added `index.server.ts` for server-only exports
- Eliminated browser bundling of Node.js dependencies (pg, dns, net, tls)
- Updated all API routes to use explicit server imports

**Phase 3: TypeScript Tightening**
- Replaced 20+ `any` types with proper interfaces
- Fixed prop type mismatches (AudioVersionSource vs string)
- Added comprehensive error handling types
- Enabled strict TypeScript mode (already configured)

**Phase 4: Service Initialization**
- Removed smart factory pattern from `createMissionService`
- Created explicit factory functions:
  - `createMissionServiceWithLocalStorage()` - Browser
  - `createMissionServiceWithMemoryDatabase()` - Testing
  - `createMissionService()` - Explicit database injection
- Moved database setup to API layer initialization
- Updated all API routes to use explicit database initialization

**Phase 5: Hook Architecture**
- Created `useMissionService()` hook with version ledger integration
- Removed all dynamic imports and lazy loading workarounds
- Added `useMissionServiceWithVersionLedger()` for seamless version tracking
- Completed integration testing - all builds pass

### 📊 Key Improvements

**Before Refactoring:**
```typescript
// ❌ Problem: Auto-detection caused bundling issues
import { createMissionService } from '@voisss/shared';
const service = createMissionService(); // Tries to bundle pg in browser!
```

**After Refactoring:**
```typescript
// ✅ Solution: Explicit environment-specific initialization
import { createMissionServiceWithLocalStorage } from '@voisss/shared';
const service = createMissionServiceWithLocalStorage(); // Browser-safe!
```

### 🎯 Benefits Achieved

1. **Eliminated Bundling Errors** - Browser builds no longer include server-only dependencies
2. **Improved Type Safety** - 20+ any types replaced with proper interfaces
3. **Clear Architecture** - Explicit database initialization, proper module boundaries
4. **Better Developer Experience** - IDE autocomplete works, clear import patterns
5. **Version Ledger Integration** - Mission responses track audio version history
6. **Maintainable Code** - Clean separation of concerns, easy to test

## 🎯 Honest Implementation Status

### ✅ Web App - PRODUCTION READY

#### Complete Features
- **Intelligent Voice Assistant**: Dual-mode (WebSocket/Manual) Conversational AI powered by Gemini 3.0
- **AI Voice Transformation**: Full ElevenLabs integration with 29+ languages
- **Base Chain Integration**: Complete wallet connection, smart contract interaction with gasless transactions
- **IPFS Storage**: Decentralized recording storage and metadata
- **Mission System**: SocialFi features with creator gating, token-based rewards, and milestone distribution
  - Mission creation gated by minimum token balance (1M $papajams)
  - Auto-publishing and auto-expiration for missions
  - Milestone-based reward distribution (submission, quality approved, featured)
  - Centralized platform configuration for easy token/reward updates
- **User Experience**: Mobile-responsive, progressive disclosure
- **Security**: Server-side API management, secure wallet integration
- **Codebase**: ~2,500+ lines, comprehensive implementation

### ⚠️ React Native App - FUNCTIONAL BUT INCOMPLETE

#### Working Features
- **Native Audio Recording**: expo-audio integration working
- **Local Storage**: File management and caching
- **AI Transformation**: ElevenLabs API integration
- **Basic UI**: Recording interface and playback

#### Missing Critical Features
- **Base Chain Integration**: Limited wallet connection capabilities
- **IPFS Sync**: No decentralized storage integration
- **Mission System**: SocialFi features not implemented
- **Cross-platform Sync**: No sync with Web app
- **Codebase**: ~1,500+ lines, solid foundation but incomplete

**Timeline to Production**: 2-3 months of focused development

### ❌ Flutter App - PROTOTYPE STAGE

#### Basic Structure Only
- **Recording Capability**: Basic audio recording (14 Dart files total)
- **Base Chain Setup**: Partial integration, not functional
- **IPFS Service**: Exists but minimal implementation
- **UI**: Basic screens, not production-quality

#### Missing for Production
- **AI Transformation**: Not implemented
- **Complete Base Chain Integration**: Needs full rebuild
- **Mission System**: Not implemented
- **Comprehensive Testing**: No test coverage
- **Production Architecture**: Current structure inadequate
- **Codebase**: ~800 lines, minimal implementation

**Reality Check**: This app is NOT launch ready and requires 6+ months of development

## 💰 Token Access & Utility

### $VOISSS Token Model (Holding-First, Burn-Minimal)

**Single source of truth**: `packages/shared/src/config/tokenAccess.ts`

#### Holding Tiers (No Transaction Signing)

| Tier | Balance | Features |
|------|---------|----------|
| **Freemium** | None | 1 free AI transform/session, basic recording |
| **Basic** | 10k+ | Unlimited transforms, dubbing, transcription, standard voices |
| **Pro** | 50k+ | Priority processing, advanced voices, multi-language |
| **Premium** | 250k+ | VIP Lane mode (gasless saves), creator tools, mission creation |

#### Burn Actions (Spending, Premium Outputs)

| Action | Cost | Purpose |
|--------|------|---------|
| Video Export | 5k $voisss | Shareable transcript video |
| NFT Mint | 2k $voisss | On-chain recording artifact |
| White-Label Export | 10k $voisss | API access for embedded recordings |
| Batch Overage | 1 $voisss/op | Anti-abuse (100+ operations/24h) |

#### Implementation

- **`useTokenAccess()` hook** (`packages/shared/src/hooks/useTokenAccess.ts`)
  - Single balance fetch on mount, auto-refresh every 60s
  - Returns: `tier`, `balance`, `canAccess()`, `meetsMinimum()`, `getBurnCost()`
  - Works on web and mobile via shared package
  
- **`useBurnAction()` hook** (`apps/web/src/hooks/useBurnAction.ts`)
  - Manage burn action lifecycle (check affordability, execute, handle errors)
  - Shows confirmation modal before signing
  
- **Token Burn Service** (`packages/shared/src/services/token-burn-service.ts`)
  - `canAffordBurnAction()`, `getBurnActionDisplay()`, `calculateBatchOverageCost()`
  - Backend endpoint: `POST /api/token/burn`

#### Studio Modes → Token Tiers

- `standard` = None (freemium)
- `ghost` = Basic (10k, relay through spender)
- `pro` = Pro (50k, 24h gasless)
- `vip` = Premium (250k, permanent gasless)

### $PAPAJAMS Token (Mission Rewards)

**Config**: `packages/shared/src/config/platform.ts`

- Mission creator minimum: 1M $papajams
- Reward distribution: 70% $papajams (future 30% $voisss split planned)
- Milestone-based: 50% submission, 30% quality, 20% featured

### Mission UX Enhancements (Token Discovery & Eligibility)

**Completed Enhancement**: Mission board now provides transparent token information and mission eligibility indication.

#### Features
- **Token Contract Discovery**: Users can access VOISSS & PAPAJAMS contract addresses via collapsible panel in mission filters
- **Mission Eligibility**: Visual indicator (green/eligible, red/insufficient tier) in each mission card
- **Graceful Error Handling**: Balance check failures provide recovery options (manual verification, retry)
- **Direct Purchase Links**: One-click paths to Uniswap for token acquisition

#### Implementation Details
- **Config**: `packages/shared/src/config/tokenAccess.ts` - TOKEN_METADATA centralized
- **Hook Enhancement**: `packages/shared/src/hooks/useTokenAccess.ts` - balanceStatus state + fallback handling
- **API Enhancement**: `apps/web/src/app/api/user/token-balance/route.ts` - fallback response options
- **UI Components**: 
  - `MissionCard.tsx` - Eligibility calculation & display
  - `MissionFilters.tsx` - Token info collapsible section
  - `MissionBoard.tsx` - Token data flow integration

## 🎯 Current Focus & Roadmap

### ✅ **Current: Mission UX & Creator Economy**
- **Completed**: $voisss token access tiers and burn actions (holding-first model)
- **Completed**: Unified `useTokenAccess()` hook replacing scattered balance checks
- **Completed**: Studio modes mapped to token tiers (ghost/pro/vip)
- **Completed**: Token burn service for premium outputs (video export, NFT mint)
- **Completed**: Mission system with $papajams creator requirements
- **Completed**: Mission card eligibility UI with tier checking and token gap calculation
- **Completed**: Mission board token discovery and eligibility indication
- **In Progress**: Backend mission persistence (Supabase integration)
- **In Progress**: Integrate $voisss token contract calls (currently mocked)
- **Upcoming**: Auto-expiration cron job and reward claim mechanisms

### ✅ **Short-term: Web & React Native Unification**
- Consolidate all shared logic (types, services, utils) into `packages/shared`.
- Unify reusable UI components into `packages/ui`.
- Achieve feature parity between Web and React Native.
- Drive both applications to a production-ready state.

### 🔄 **Short-term: Growth & Polish (Post-Unification)**
- User acquisition and engagement for the Web app.
- UI/UX polishing and bug fixes for both platforms.
- Performance optimization and analytics integration.

### ⏸️ **Future: Flutter Re-evaluation (On Hold)**
- Evaluate ROI and market demand based on the success of the unified apps.
- If proceeding, development will resume on the existing prototype.

## 🔧 Environment Setup

### Required Environment Variables

```bash
# apps/web/.env.local
ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_BASE_CHAIN_ID=84532
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

### Smart Contract Deployment

```bash
cd apps/web
npm run deploy:base-sepolia
npm run update:contract <contract_address>
```

## 📱 Mobile Development

### React Native (Functional, needs completion)
```bash
cd apps/mobile
pnpm start
# Scan QR code with Expo Go app
# Note: Some features incomplete, 2-3 months to production
```

### Flutter iOS (On Hold)
```bash
# Development for the Flutter app is currently on hold.
# The codebase remains for future evaluation.
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm test --filter=@voisss/shared

# Test gasless transactions
cd apps/web && npm run test:gasless
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Use conventional commits

## 📚 Documentation

- **[Getting Started](./GETTING_STARTED.md)** - Quick setup and first run
- **[Architecture](./ARCHITECTURE.md)** - Technical implementation details
- **[API Reference](./api/)** - Smart contract and API references

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: https://voisss.netlify.app/
- **Hackathon Group**: https://t.me/+jG3_jEJF8YFmOTY1

---

**🌐 Web-First Strategy | 📱 Phased Mobile Development | 🚀 Production Ready Web App**
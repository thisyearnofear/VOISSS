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

## 🎯 Current Focus & Roadmap

### ✅ **Current: Mission System & Creator Economy**
- **Completed**: Centralized platform configuration (`packages/shared/config/platform.ts`)
- **Completed**: Reward service with milestone-based distribution
- **Completed**: Mission creation form with token eligibility checks
- **Completed**: Wallet state management improvements (localStorage persistence)
- **In Progress**: Backend mission persistence (Supabase integration)
- **In Progress**: Token balance verification on Base chain
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
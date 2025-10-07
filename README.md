# VOISSS 🎤

[![Starknet](https://img.shields.io/badge/Starknet-Sepolia-blue)](https://sepolia.starkscan.co/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.32.0-blue)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

> **🏆 Built for the Starknet Re{ignite} Hackathon**

**VOISSS** is a decentralized AI-powered voice recording platform that transforms how we capture, organize, and share audio content. Built as a comprehensive ecosystem with a **Web-first strategy** and phased mobile development.

## 🚀 Live Platform

**🌐 Web App**: https://voisss.netlify.app/ ✅ **PRODUCTION READY**

## 🏗️ Architecture & Status

**Web-First Strategy with Phased Mobile Rollout:**

- 🌐 **Web dApp** (Next.js + starknet.js) - **PRODUCTION READY** ✅
  - AI voice transformation & community features
  - Full Starknet integration
  - Ready for user acquisition

- 📱 **React Native Mobile** (Expo + starknet.js) - **FUNCTIONAL, NEEDS COMPLETION** 🔄
  - Cross-platform mobile recording
  - 2-3 months to production readiness
  - Core features working, needs polish

- 📱 **Flutter iOS** (starknet.dart) - **ON HOLD** ⏸️
  - Native iOS exploration paused
  - Development is currently focused on Web and React Native
  - Will be re-evaluated in the future

## ✨ Key Features

### 🎤 AI Voice Transformation
- **Professional AI Voices**: ElevenLabs integration with curated voice library
- **Freemium Model**: 1 free transformation per session, unlimited with wallet
- **Real-time Preview**: Listen before saving

### 🌍 Multi-Language Dubbing
- **29+ Languages**: Auto-detect source, translate to target language
- **Native Accents**: Preserve authentic pronunciation and intonation
- **Freemium Access**: 1 free dubbing per session, unlimited with wallet

### 🔗 Starknet Integration
- **Decentralized Storage**: IPFS + Starknet smart contracts
- **SocialFi Missions**: Complete tasks for STRK rewards
- **Creator Economy**: Monetize recordings through blockchain

### 📱 Cross-Platform Development

- **Web**: Full-featured desktop experience ✅ **PRODUCTION READY**
- **Mobile React Native**: Cross-platform development 🔄 **IN PROGRESS**
- **Mobile Flutter**: iOS native exploration ⏸️ **ON HOLD**
- **Sync**: Cross-platform data synchronization (Web ready, mobile in development)

## 🛠 Tech Stack

```
voisss/
├── apps/
│   ├── web/                   # Next.js + Starknet.js
│   ├── mobile/                # React Native + Expo
│   └── mobile-flutter/        # Flutter (On Hold)
├── packages/
│   ├── shared/                # Common types & utilities
│   ├── contracts/             # Cairo smart contracts
│   └── ui/                    # Shared components
└── docs/                      # Documentation
```

### Core Technologies
- **Frontend**: Next.js 15, React Native, Flutter
- **Blockchain**: Starknet, Cairo smart contracts
- **AI**: ElevenLabs voice transformation
- **Storage**: IPFS for decentralized content
- **Build**: Turbo monorepo with pnpm workspaces

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Expo CLI (for mobile)
- Flutter SDK (optional, on hold)

### Installation

```bash
# Clone repository
git clone https://github.com/thisyearnofear/VOISSS.git
cd VOISSS

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Add your ElevenLabs API key and other required variables

# Start development for the active apps
pnpm dev

# Or start specific apps
pnpm dev:web      # Web app (production ready)
pnpm dev:mobile   # React Native (in progress)
# pnpm dev:flutter  # Flutter (on hold)
```

### Individual App Development

```bash
# Web app (Production Ready)
cd apps/web && pnpm dev

# React Native mobile (Functional, needs completion)
cd apps/mobile && pnpm start
```

## 🎯 Current Focus & Roadmap

### ✅ **Immediate Focus: Web & React Native Unification**
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
NEXT_PUBLIC_STARKNET_CHAIN_ID=SN_SEPOLIA
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

### Smart Contract Deployment

```bash
cd packages/contracts
scarb build
starkli declare target/dev/voisss_VoiceStorage.contract_class.json
starkli deploy [class_hash] [constructor_args]
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

# Test smart contracts
cd packages/contracts && scarb test
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

- **[Development Guide](./docs/DEVELOPMENT.md)** - Technical implementation details and honest app assessments
- **[Roadmap](./docs/ROADMAP.md)** - Web-first strategy and realistic development phases
- **[Consolidation Guide](./docs/CONSOLIDATION_GUIDE.md)** - Platform strategy and launch timeline
- **[API Documentation](./docs/api/)** - Smart contract and API references

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: https://voisss.netlify.app/
- **Starknet Contracts**: [Sepolia Starkscan](https://sepolia.starkscan.co/)
- **Hackathon Group**: https://t.me/+jG3_jEJF8YFmOTY1

---

**Built with ❤️ for the Starknet ecosystem**  
**🌐 Web-First Strategy | 📱 Phased Mobile Development | 🚀 Production Ready Web App**
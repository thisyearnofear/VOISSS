# VOISSS - Getting Started Guide

## Overview

VOISSS is a decentralized AI-powered voice recording platform that transforms how we capture, organize, and share audio content. Built with a web-first strategy and phased mobile development.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, pnpm, Git
- Flutter SDK & Dart SDK (for mobile-flutter)

### Setup
```bash
git clone https://github.com/thisyearnofear/VOISSS.git
cd VOISSS
pnpm install

# Web platform setup
cd apps/web
cp .env.example .env.local
# Add your environment variables
pnpm dev  # Runs on http://localhost:4445
```

### Environment Variables (Web)
```env
# Base Chain & Wallet
NEXT_PUBLIC_BASE_CHAIN_ID=84532
NEXT_PUBLIC_SPENDER_ADDRESS=0x...
SPENDER_PRIVATE_KEY=0x...

# AI Services
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key
NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS=0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07
NEXT_PUBLIC_PAPAJAMS_TOKEN_ADDRESS=0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c
```

## 🏗️ Architecture Overview

### Tech Stack
- **Web**: Next.js 14, TypeScript, Tailwind, Base Account SDK
- **Mobile**: React Native, Expo, TypeScript, Scroll integration
- **AI**: ElevenLabs, Google Gemini 3.0 Flash
- **Blockchain**: Base (gasless), Scroll (VRF/Privacy), IPFS storage
- **Backend**: Serverpod (Flutter platform)

### Monorepo Structure
```
voisss/
├── apps/
│   ├── web/          # Next.js + Base integration
│   ├── mobile/       # React Native + Scroll
│   └── mobile-flutter/ # Flutter + Serverpod
├── packages/
│   ├── shared/       # Common utilities
│   ├── contracts/    # Solidity smart contracts
│   └── ui/           # Shared components
```

## 📱 Platform Status

| Platform | Status | Key Features |
|----------|--------|--------------|
| **Web** | ✅ Production Ready | Gasless txs, AI transformation, mission system |
| **Mobile** | ⚠️ Functional, needs completion | Native recording, VRF, privacy |
| **Flutter** | ✅ Live (AI Butler) | Serverpod backend, Venice AI |

## 🎯 Key Features

### AI Voice Transformation
- 29+ languages with native accents
- Real-time preview
- Freemium model (1 free/session, unlimited with tokens)

### Mission System
- Creator economy with token gating
- Milestone rewards: 50% submission, 30% quality, 20% featured
- Auto-publishing and auto-expiration

### Cross-Platform
- Web: Base integration (gasless)
- Mobile: Scroll integration (VRF/Privacy)
- Flutter: Serverpod backend (AI assistant)

## 📄 Scripts

### Monorepo
```bash
pnpm dev          # All apps
pnpm dev:web      # Web only
pnpm dev:mobile   # Mobile only
pnpm build        # Build all
pnpm test         # Test all
```

### Web Platform
```bash
pnpm dev          # Development
pnpm build        # Production build
pnpm deploy:base-sepolia  # Deploy contracts
```

### Mobile Platform
```bash
pnpm dev          # Development
pnpm android      # Android build
pnpm ios          # iOS build
```

## 🔗 Links

- **Live Web**: https://voisss.netlify.app/
- **AI Butler API**: https://butler.voisss.famile.xyz/
- **Community**: https://t.me/+jG3_jEJF8YFmOTY1
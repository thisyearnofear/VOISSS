# VOISSS 🎤

[![Base](https://img.shields.io/badge/Base-Sepolia-blue)](https://sepolia.basescan.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.32.0-blue)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

**VOISSS** is a decentralized AI-powered voice recording platform that transforms how we capture, organize, and share audio content. Built as a comprehensive ecosystem with a **Web-first strategy** and phased mobile development.

## 🚀 Live Platform & Contracts

**🌐 Web App**: https://voisss.netlify.app/ ✅ **PRODUCTION READY**

**🔗 Smart Contracts (Scroll Sepolia)** ✅ **DEPLOYED**
- ScrollVRF: `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208`
- ScrollPrivacy: `0x0abD2343311985Fd1e0159CE39792483b908C03a`
- [Deployment Details](./packages/contracts/SCROLL_SEPOLIA_DEPLOYED.md)

## 🏗️ Architecture & Status

**Web-First Strategy with Phased Mobile Rollout + Multi-Chain Architecture:**

- 🌐 **Web dApp** (Next.js + Base Account SDK) - **PRODUCTION READY** ✅
  - AI voice transformation & community features
  - Full Base chain integration with gasless transactions
  - Ready for user acquisition

- 📱 **React Native Mobile** (Expo + Scroll Sepolia) - **SCROLL INTEGRATION IN PROGRESS** 🔄
  - Cross-platform mobile recording with AI transformation
  - **ScrollVRF**: Fair randomness for voice style selection
  - **ScrollPrivacy**: Private recording storage with access control
  - Core features working, Scroll contracts integrated
  - 2-3 months to production readiness

- 📱 **Flutter Desktop/Mobile** (Serverpod + Venice AI) - **AI BUTLER LIVE** ✅
  - AI-powered voice assistant via Serverpod backend
  - Connects to https://butler.voisss.famile.xyz/
  - No blockchain integration (Serverpod architecture)
  - Working part of the ecosystem for AI interactions

## ✨ Key Features

### 🎤 AI Voice Transformation
- **Professional AI Voices**: ElevenLabs integration with curated voice library
- **Freemium Model**: 1 free transformation per session, unlimited with wallet
- **Real-time Preview**: Listen before saving

### 🌍 Multi-Language Dubbing
- **29+ Languages**: Auto-detect source, translate to target language
- **Native Accents**: Preserve authentic pronunciation and intonation
- **Freemium Access**: 1 free dubbing per session, unlimited with wallet

### 🔗 Base Chain Integration
- **Decentralized Storage**: IPFS + Base smart contracts
- **Gasless Transactions**: Zero-cost recording saves via Sub Accounts
- **Creator Economy**: Monetize recordings through blockchain

### 📱 Cross-Platform Development

- **Web**: Full-featured desktop experience ✅ **PRODUCTION READY**
- **Mobile React Native**: Cross-platform development 🔄 **IN PROGRESS**
- **Mobile Flutter**: iOS native exploration ⏸️ **ON HOLD**
- **Sync**: Cross-platform data synchronization (Web ready, mobile in development)

### ## Inspiration
VOISSS was born from a pivotal question: In an era where AI can synthesize any voice in seconds, who truly owns your acoustic identity? As we move toward an AI-agent economy, our voices are becoming our most valuable digital signatures. We were inspired to build a platform that doesn't just "process" voice, but empowers it—giving creators and global citizens a way to transform their vocal expression while maintaining sovereign ownership through decentralized infrastructure.

### ## What it does
VOISSS is a decentralized AI voice protocol that allows users to record, transform, and secure their voices on-chain. It features:
*   **🎭 AI Voice Transformation**: Morph your voice into high-fidelity AI personas using the ElevenLabs frontier model.
*   **🎙️ Intelligent Assistant**: A premium, context-aware AI companion powered by **Gemini 3.0 Flash** that provides insights and manages recordings through agentic voice commands.
*   **⛓️ Decentralized Storage**: Every recording is stored as a secure, on-chain artifact on IPFS and indexed via the Base blockchain.
*   **🧠 AI Insights**: Multi-modal analysis of recordings to generate transcripts, summaries, and tags automatically.
*   **📝 Transcript Composer**: A tool to create shareable video transcripts directly from your AI-transformed audio.

### ## How we built it
The stack is a cutting-edge fusion of frontier AI and Web3 infrastructure:
*   **Frontier Intelligence**: Integrated **Google Gemini 3.0 Flash** (released Dec 2025) for lightning-fast reasoning, context-aware assistance, and multimodal insights.
*   **Vocal Synthesis**: Leveraged **ElevenLabs** for professional-grade TTS and voice cloning to ensure emotional resonance and native accents.
*   **Web3 Backbone**: Built on **Base** (Coinbase's L2) for gasless, high-speed on-chain recording provenance. Used Wagmi/Viem for blockchain interactions and Sub Accounts for zero-friction user onboarding.
*   **Frontend**: Developed with **Next.js 14**, utilizing a unified Design System and a shared component architecture across web and mobile.

### ## Challenges we ran into
Integrating real-time voice interaction with decentralized protocols presented significant latency hurdles. Ensuring the AI Assistant could respond naturally while simultaneously handling blockchain state and IPFS uploads required a robust, asynchronous architecture. Coordinating the "Agentic" capabilities of Gemini—allowing it to trigger UI actions across the app—required a deep dive into state synchronization and global context management.

### ## Accomplishments that we're proud of
We are incredibly proud of achieving **Gemini 3.0 "Agentic" integration**, where the assistant doesn't just talk, but can actually control the application's navigation and workflow based on spoken intent. Successfully implementing a **gasless on-chain storage flow** that feels as smooth as a standard web app is another major win, bridging the gap between Web2 UX and Web3 security. Finally, achieving **production readiness** for our web platform within the hackathon timeframe was a significant milestone.

### ## What we learned
We learned that the true power of AI agents lies in **Context Awareness**. By feeding the assistant real-time page data and recording metadata, it transformed from a simple chatbot into a genuine productivity partner. We also deepened our understanding of the **L2 ecosystem**, particularly how to optimize metadata for on-chain permanence while maintaining the speed users expect from modern voice applications.

### ## What's next for VOISSS
The roadmap includes **Autonomous Dubbing Pipelines** where the AI can translate and dub entire video content in one click. We are also pursuing deep **Farcaster Integration** to allow "Voice Moments" to be shared directly across the decentralized social graph. Lastly, we plan to release the **VOISSS Creator SDK**, allowing other developers to build voice-powered, decentralized applications on top of our protocol.

**Try it**: Visit [/help](https://voisss.vercel.app/help) and click "Talk to VOISSS Assistant"

## 🛠 Tech Stack

```
voisss/
├── apps/
│   ├── web/                   # Next.js + Base Account SDK
│   ├── mobile/                # React Native + Expo
│   └── mobile-flutter/        # Flutter (On Hold)
├── packages/
│   ├── shared/                # Common types & utilities
│   ├── contracts/             # Solidity smart contracts
│   └── ui/                    # Shared components
└── docs/                      # Documentation
```

### Core Technologies
- **Frontend**: Next.js 15, React Native, Flutter
- **Blockchain**: Base, Solidity smart contracts
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

pkill -f "expo start" 2>/dev/null; sleep 2; echo "Killed existing expo processes"

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

- **[Getting Started](./docs/GETTING_STARTED.md)** - Quick setup and first run
- **[Architecture](./docs/ARCHITECTURE.md)** - Technical implementation details
- **[Deployment](./docs/DEPLOYMENT.md)** - Production deployment guide
- **[Roadmap](./docs/ROADMAP.md)** - Future vision and development phases

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: https://voisss.netlify.app/

---

**🌐 Web-First Strategy | 📱 Phased Mobile Development | 🚀 Production Ready Web App**
# VOISSS 🎤

[![Base](https://img.shields.io/badge/Base-Sepolia-blue)](https://sepolia.basescan.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.32.0-blue)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

**VOISSS** is a decentralized AI-powered voice recording platform with **agentic AI integration** that transforms how we capture, organize, and share audio content. Built as a comprehensive ecosystem with a **Web-first strategy** and phased mobile development.

## 🚀 Live Platform & Contracts

**🌐 Web App**: https://voisss.netlify.app/ ✅ **PRODUCTION READY**

**🔗 Smart Contracts (Base Mainnet)** ✅ **DEPLOYED FOR WEB**
- **AgentRegistry**: `0x27793FB04A35142445dd08F908F3b884061Ea3FA` (v1) / `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` (v2)
- **ReputationRegistry**: `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127`
- **VoiceRecords**: `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D`

**📱 Mobile App Contracts (Scroll Sepolia)** 🔄 **IN DEVELOPMENT**
- **ScrollVRF**: `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208` (Mobile Only)
- **ScrollPrivacy**: `0x0abD2343311985Fd1e0159CE39792483b908C03a` (Mobile Only)

## ✨ Key Features

### 🎙️ **Agentic AI Assistant** (Powered by Gemini 3.0 Flash)
- **Context-Aware**: Interprets current page state and user intent
- **Actionable**: Controls app navigation and workflow via voice commands
- **Multi-Modal**: Processes voice, text, and metadata for intelligent responses

### 🎤 AI Voice Transformation
- **Professional AI Voices**: ElevenLabs integration with curated voice library
- **Freemium Model**: 1 free transformation per session, unlimited with wallet
- **Real-time Preview**: Listen before saving

### 🌍 Multi-Language Dubbing
- **29+ Languages**: Auto-detect source, translate to target language
- **Native Accents**: Preserve authentic pronunciation and intonation

### 🔗 Base Chain Integration (Web App Only)
- **Decentralized Storage**: IPFS + Base smart contracts
- **Gasless Transactions**: Zero-cost recording saves via Sub Accounts
- **Creator Economy**: Monetize recordings through blockchain

## 🏗️ Architecture

- 🌐 **Web dApp** (Next.js + Base Account SDK) - **PRODUCTION READY** ✅
- 📱 **React Native Mobile** (Expo + Scroll) - **IN PROGRESS** 🔄
- 📱 **Flutter Desktop/Mobile** (Serverpod) - **AI BUTLER LIVE** ✅

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React Native, Flutter
- **Blockchain**: Base (Web), Scroll (Mobile), Cairo/Solidity smart contracts
- **AI**: Google Gemini 3.0 Flash (Agentic), ElevenLabs voice transformation
- **Storage**: IPFS for decentralized content
- **Build**: Turbo monorepo with pnpm workspaces

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local

# Start development
pnpm dev:web      # Web app (production ready)
pnpm dev:mobile   # React Native (in progress)
```

## 📚 Documentation

Comprehensive guides available in our docs directory:

- **[Getting Started](./docs/GETTING_STARTED.md)** - Setup and run instructions
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture details
- **[Agentic Integration](./docs/AGENT_INTEGRATION.md)** - AI assistant implementation
- **[Blockchain Integration](./docs/BLOCKCHAIN_INTEGRATION.md)** - Multi-chain setup
- **[Base Mainnet Contracts](./packages/contracts/BASE_MAINNET_DEPLOYED.md)** - Web app contract details
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🌐 Base-Exclusive Web App | 🎙️ Agentic AI Integration | 🚀 Production Ready**
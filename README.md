# VOISSS 🎤

[![Base](https://img.shields.io/badge/Base-Sepolia-blue)](https://sepolia.basescan.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.32.0-blue)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

**VOISSS** is evolving into a **B2B voice licensing marketplace** where AI agents purchase and license authentic human voices. Built on proven infrastructure (blockchain provenance, IPFS storage, gasless transactions) with a **Web-first strategy** targeting the AI agent explosion.

**Strategic Pivot:** From B2C voice recording tool → B2B marketplace for AI agent voice licensing

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

### 🎯 **Voice Licensing Marketplace** (Coming Soon)
- **For AI Agents**: License authentic human voices with instant API integration
- **For Voice Contributors**: Earn passive income from your recordings (70% revenue share)
- **Legal Protection**: Licensed voices with indemnification, not stolen content
- **Pricing**: $49-$2K+/mo for agents, automatic royalty distribution for contributors

### 🏗️ **Existing Infrastructure** (Production Ready)
- **Blockchain Provenance**: Ownership tracking via Base smart contracts
- **IPFS Storage**: Decentralized, immutable voice assets
- **Gasless Transactions**: Zero-friction contributor onboarding
- **AI Voice Synthesis**: ElevenLabs integration with 29+ languages
- **Agent API**: x402 payment protocol for metered voice generation

### 🎙️ **Agentic AI Assistant** (Powered by Gemini 3.0 Flash)
- **Context-Aware**: Interprets current page state and user intent
- **Actionable**: Controls app navigation and workflow via voice commands
- **Multi-Modal**: Processes voice, text, and metadata for intelligent responses

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

# Configure x402 payments (see X402_SETUP.md)
# - Get CDP API keys from https://portal.cdp.coinbase.com
# - Set X402_PAY_TO_ADDRESS to your wallet
# - Add ELEVENLABS_API_KEY and PINATA credentials

# Start development
pnpm dev:web      # Web app (production ready)
pnpm dev:mobile   # React Native (in progress)
```

### Marketplace Quick Start (NEW)

```bash
# Deploy marketplace contract
cd apps/web
pnpm deploy:marketplace

# Add contract address to .env.local
echo "NEXT_PUBLIC_VOICE_LICENSE_MARKET_ADDRESS=0x..." >> .env.local

# Visit marketplace
open http://localhost:4445/marketplace
```

See [apps/web/MARKETPLACE.md](./apps/web/MARKETPLACE.md) for detailed implementation guide.

## 💳 x402 Payment System

VOISSS uses x402 protocol for agent-to-agent micropayments. See [X402_SETUP.md](./X402_SETUP.md) for complete setup guide.

Quick test:
```bash
# Verify configuration
pnpm x402:debug check-env

# Run end-to-end test
export TEST_AGENT_PRIVATE_KEY=0xYourKey
pnpm x402:test
```

## 📚 Documentation

Consolidated guides in the `/docs` directory:

| Document | Purpose |
|----------|---------|
| **[MARKETPLACE_STRATEGY.md](./docs/MARKETPLACE_STRATEGY.md)** | 🆕 B2B marketplace strategy, MVP roadmap, go-to-market |
| **[DOCS_OVERVIEW.md](./docs/DOCS_OVERVIEW.md)** | Platform summary, live links, quick reference |
| **[GETTING_STARTED.md](./docs/GETTING_STARTED.md)** | Setup, environment config, running locally |
| **[AGENT_INTEGRATION.md](./docs/AGENT_INTEGRATION.md)** | Agentic AI, external agent API, security |
| **[BLOCKCHAIN_GUIDE.md](./docs/BLOCKCHAIN_GUIDE.md)** | Smart contracts, tokens, x402 payments |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🎯 B2B Voice Marketplace | 🤖 AI Agents as Primary Customers | 👥 Humans as Suppliers | 🚀 MVP in Progress**
# VOISSS Documentation Overview

**Last Updated:** February 2026  
**Version:** 2.0

This is the consolidated documentation index for VOISSS. All essential information is organized into four core documents.

---

## 📚 Documentation Index

| Document | Purpose | Key Topics |
|----------|---------|------------|
| **[MARKETPLACE_STRATEGY.md](./MARKETPLACE_STRATEGY.md)** | 🆕 B2B marketplace strategy and roadmap | MVP phases, pricing, go-to-market, risk mitigation |
| **[GETTING_STARTED.md](./GETTING_STARTED.md)** | Quick setup and run instructions | Prerequisites, environment setup, platform scripts |
| **[AGENT_INTEGRATION.md](./AGENT_INTEGRATION.md)** | Agentic AI and external agent guide | Gemini integration, agent API, security, events |
| **[BLOCKCHAIN_GUIDE.md](./BLOCKCHAIN_GUIDE.md)** | Blockchain contracts and payments | Smart contracts, tokens, x402, mission system |

---

## 🏗️ Platform Summary

### What is VOISSS?

VOISSS is evolving into a **B2B voice licensing marketplace** where AI agents purchase and license authentic human voices from contributors. Built on proven infrastructure (blockchain provenance, IPFS storage, gasless transactions, AI voice synthesis).

**Strategic Pivot:** Leveraging existing B2C platform to solve the "generic TTS problem" for AI agents while creating passive income for voice contributors.

### Core Value Proposition

**For AI Agents (Customers):**
- Authentic, licensed voices (not stolen/generic TTS)
- Instant API integration (<30 min)
- Legal protection with indemnification
- Pricing: $49-$2K+/mo based on usage

**For Voice Contributors (Suppliers):**
- Passive income from existing recordings (70% revenue share)
- Blockchain ownership tracking
- Gasless onboarding (no crypto friction)
- Portfolio management dashboard

---

## 🌐 Live Platform & Contracts

### Web App (Production Ready)
- **URL**: https://voisss.netlify.app/
- **Network**: Base Mainnet

### Smart Contracts (Base Mainnet)
| Contract | Address | Purpose |
|----------|---------|---------|
| AgentRegistry (v2) | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` | Agent registration, USDC credits |
| ReputationRegistry | `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127` | Agent reputation tracking |
| VoiceRecords | `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D` | Recording storage |
| $VOISSS Token | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` | Access tiers |
| $PAPAJAMS Token | `0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c` | Creator rewards |

### Mobile Contracts (Scroll Sepolia - Development)
| Contract | Address | Purpose |
|----------|---------|---------|
| ScrollVRF | `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208` | Fair randomness |
| ScrollPrivacy | `0x0abD2343311985Fd1e0159CE39792483b908C03a` | Private storage |

### AI Butler API
- **URL**: https://butler.voisss.famile.xyz/
- **Stack**: Flutter + Serverpod + Venice AI

---

## 📱 Platform Status

| Platform | Status | Blockchain | Key Features |
|----------|--------|------------|--------------|
| **Web** | ✅ Production Ready | Base Mainnet | Gasless txs, AI transformation, missions |
| **Mobile (React Native)** | 🔄 In Progress | Scroll Sepolia | Native recording, VRF, privacy |
| **Flutter** | ✅ Live | None | Serverpod backend, Venice AI, AI Butler |

---

## 🎯 Key Features

### Agentic AI (Gemini 3.0 Flash)
- Context-aware intelligence with page state interpretation
- Actionable capabilities: navigation, workflow automation, content management
- Multi-modal processing: voice, text, metadata

### AI Voice Transformation
- ElevenLabs integration with curated voice library
- 29+ languages with native accents
- Freemium model: 1 free/session, unlimited with wallet tokens

### Token Access Tiers
| Tier | Balance | Features |
|------|---------|----------|
| Freemium | 0 | 1 free transform/session |
| Basic | 10k+ $VOISSS | Unlimited transforms, dubbing |
| Pro | 50k+ $VOISSS | Priority processing, advanced voices |
| Premium | 250k+ $VOISSS | VIP Lane, creator tools |

### Mission System
- Creator economy with token gating (1M $PAPAJAMS minimum)
- Milestone rewards: 50% submission, 30% quality, 20% featured
- Auto-publishing and auto-expiration

---

## 🏛️ Monorepo Structure

```
voisss/
├── apps/
│   ├── web/              # Next.js 15 + Base Account SDK
│   ├── mobile/           # React Native + Expo + Scroll
│   └── mobile-flutter/   # Flutter + Serverpod
├── packages/
│   ├── shared/           # Common utilities, types, services
│   ├── contracts/        # Solidity smart contracts
│   └── ui/               # Shared UI components
└── docs/                 # This documentation
```

---

## 🛡️ Security & Rate Limiting

VOISSS implements enterprise-grade security for AI agent traffic:

### Multi-Layer Security
1. **Verification**: Reverse CAPTCHA, behavioral analysis, agent proof headers
2. **Rate Limiting**: Tier-based limits (5-500 req/min), multi-dimensional controls
3. **Threat Detection**: DDoS, abuse, fraud, impersonation patterns
4. **Event System**: Central-decentral hub eliminates polling inefficiency

### Agent Rate Limits
| Tier | Requests/Min | Cost/Min (USDC) | Characters/Min |
|------|--------------|-----------------|----------------|
| Unregistered | 5 | $5 | 500 |
| Registered | 20 | $20 | 2,000 |
| Verified | 100 | $100 | 10,000 |
| Premium | 500 | $500 | 50,000 |

---

## 💳 x402 Payment System

VOISSS uses x402 protocol for agent-to-agent micropayments:

- **Protocol**: EIP-712 `TransferWithAuthorization` for USDC on Base
- **Cost**: ~$0.000001 per character for voice generation
- **Partner Tiers**: Silver (15% off), Gold (30% off), Platinum (50% off)
- **Token Discounts**: $VOISSS holders get up to 50% discount on services

### Payment Flow
1. Request voice generation (receive 402 if payment required)
2. Sign EIP-712 payment authorization
3. Retry with `X-PAYMENT` header
4. Receive audio URL and recording ID

---

## 📋 Quick Reference

### Essential Commands
```bash
pnpm install              # Install dependencies
pnpm dev:web              # Start web development server
pnpm dev:mobile           # Start mobile development server
pnpm build                # Build all platforms
pnpm test                 # Run tests
```

### Environment Setup
```bash
# Copy environment templates
cp apps/web/.env.example apps/web/.env.local
cp .env.example .env

# Essential variables
NEXT_PUBLIC_BASE_CHAIN_ID=8453      # Base Mainnet
X402_PAY_TO_ADDRESS=0xYourWallet    # Payment recipient
ELEVENLABS_API_KEY=your_key         # Voice generation
```

### Contract Deployment
- Web contracts: Base Mainnet (production ready)
- Mobile contracts: Scroll Sepolia (development)
- Legacy: Starknet Cairo contracts (archived reference)

---

## 🔗 Additional Resources

- **GitHub**: https://github.com/thisyearnofear/VOISSS
- **Telegram**: https://t.me/+jG3_jEJF8YFmOTY1
- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **CDP Portal** (x402): https://portal.cdp.coinbase.com

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

# VOISSS 🎤

[![Base](https://img.shields.io/badge/Base-Mainnet-blue)](https://basescan.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.32.0-blue)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

**VOISSS** is a B2B voice licensing marketplace where AI agents purchase authentic human voices with blockchain provenance and instant API access.

**Live:** https://voisss.netlify.app

---

## 🚀 Quick Start

```bash
git clone https://github.com/thisyearnofear/VOISSS.git && cd VOISSS
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web      # http://localhost:4445
```

**New to VOISSS?** See [GETTING_STARTED.md](./docs/GETTING_STARTED.md) for a 5-minute guide.

---

## 💡 Why VOISSS?

**For AI Agents:**
- 🎯 Pay-per-character pricing (~$0.000001/char)
- ⚡ Instant API access with x402 payments
- 🔗 Multi-chain support (Base, Arbitrum, Optimism, Polygon, Solana)
- 🔒 Blockchain-verified provenance

**For Voice Contributors:**
- 💰 70% revenue share on all licenses
- 🎤 Keep full control of your voice rights
- 📈 Passive income from AI agent usage
- 🔐 Smart contract-enforced payments

---

## Platform Status

| Platform | Status | Blockchain | Features |
|----------|--------|------------|----------|
| Web | ✅ Production | Base Mainnet | Full marketplace, API, payments |
| Mobile (RN) | 🔄 In Progress | Scroll Sepolia | VRF, privacy controls |
| Flutter | ✅ Live | Serverpod | AI butler, voice chat |

**Stats:** 21+ voices • Base mainnet • Multi-chain payments • Production API • Full engagement system

---

## Key Contracts (Base Mainnet)

| Contract | Address |
|----------|---------|
| AgentRegistry (v2) | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` |
| ReputationRegistry | `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127` |
| VoiceRecords | `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D` |
| $VOISSS Token | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` |

## ✨ Features

### Voice Marketplace
- **21+ Professional Voices** — Browse and license authentic human voices
- **Instant Licensing** — Smart contract-based automatic licensing
- **Transparent Pricing** — $49-$2K+/mo with 70% revenue to contributors
- **Blockchain Provenance** — Every voice verified on Base mainnet

### Agent API
- **Pay-Per-Character** — ~$0.000001/char with no monthly fees
- **Multi-Chain Payments** — x402 and OWS support for 9 blockchains
- **Tier-Based Discounts** — Up to 50% off for high-volume agents
- **Real-Time Events** — WebSocket, webhook, and polling support

### AI-Powered Features
- **Voice Assistant** — Gemini-powered context-aware assistant
- **Content Analysis** — Automatic insights and humanity verification
- **Contributor Voice Cloning** — Studio flow creates ElevenLabs voice IDs with IPFS-archived reference samples
- **AI Memory Archive** — Decentralized Arkiv storage for voice insights and humanity certificates
- **Multi-Language** — 29+ languages supported
- **Mission System** — Creator economy with $PAPAJAMS rewards

### Arkiv × ETHNS Builder Challenge Integration

**Chain:** Braga Testnet (Chain ID `60138453102`)

**Entity Schema:**
| Entity Type | Attributes | Expiration | Purpose |
|-------------|-----------|------------|---------|
| `VoiceInsight` | `project`, `title`, `createdAt` (numeric), `entityType` | 365 days | AI-generated voice analysis, emotional insights, sentiment |
| `HumanityCertificate` | `project`, `badge`, `status`, `parentInsightId`, `createdAt` (numeric) | 730 days | Humanity verification attestation linked to parent insight |

**Advanced Features:**
- **User Ownership** — Server wallet creates entities, then transfers `$owner` to user's wallet atomically via `mutateEntities`
- **Batch Operations** — Create insight + certificate + ownership transfer in a single transaction (`/api/arkiv/save-batch`)
- **Numeric Time Attributes** — `createdAt` stored as `Date.now()` for `gt()` / `lt()` range queries
- **Differentiated Expiration** — 30-day working drafts, 365-day insights, 730-day certificates
- **Advanced Querying** — Combinable filters: `ownerAddress`, `createdAfter`, `createdBefore`, `searchTerm`, pagination with cursor
- **Explorer Links** — Every entity links to `https://explorer.braga.hoodi.arkiv.network/entity/{entityKey}`

### Engagement & Virality
- **Referral System** — Automatic tracking, conversion rewards, viral bonuses
- **Streak Mechanics** — Daily recording streaks with milestone rewards and freeze protection
- **Leaderboards** — Real-time rankings across earnings, quality, volume, and streaks
- **Achievements** — 9+ achievements with bronze/silver/gold/platinum tiers
- **Notifications** — In-app notification system with priority levels
- **Social Sharing** — Built-in sharing with referral code generation

---

## Documentation

| Doc | Contents |
|-----|----------|
| [QUICKSTART.md](./docs/QUICKSTART.md) | Setup, run commands, monorepo structure, troubleshooting |
| [AGENT_API.md](./docs/AGENT_API.md) | Voice generation API, OWS payments, security, events |
| [ACP_SPECIFICATION.md](./docs/ACP_SPECIFICATION.md) | Autonomous Agent Commerce Protocol (ACP) integration |
| [BLOCKCHAIN.md](./docs/BLOCKCHAIN.md) | Smart contracts, tokens, x402, marketplace, gasless txns |
| [HACKATHON.md](./docs/HACKATHON.md) | OWS hackathon strategy, demo script, submission materials |
| [CHALLENGE.md](./docs/CHALLENGE.md) | Arkiv builder challenge: entity schema, demo, features |

## Tech Stack

- **Frontend:** Next.js 15, React Native, Flutter
- **Blockchain:** Base (Web), Scroll (Mobile), Solidity
- **AI:** Google Gemini, ElevenLabs, Venice AI
- **Storage:** IPFS (Pinata), Arkiv Braga Testnet (decentralized insights)
- **Payments:** x402 protocol, OWS multi-chain

---

## Roadmap

### ✅ Completed (Q1 2026)
- Production deployment on Base mainnet
- Multi-chain payment support (x402 + OWS)
- Voice marketplace with 21+ voices
- Agent API with tier-based pricing
- AI-powered voice assistant
- Comprehensive engagement system (referrals, streaks, leaderboards, achievements)
- Arkiv Braga Testnet integration — decentralized voice insight and humanity certificate archive

### 🔄 In Progress (Q2 2026)
- Official JavaScript/TypeScript SDK
- Interactive API playground
- Advanced marketplace filters
- Instant licensing (remove manual approval)
- Contributor cloning marketplace binding and review workflow
- Mobile app consolidation

### 🎯 Planned (Q3-Q4 2026)
- Enterprise white-label solution
- 50+ language support
- Agent reputation system
- Community governance

---

## License

MIT — see [LICENSE](./LICENSE)

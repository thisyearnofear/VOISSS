# VOISSS 🎤

[![Base](https://img.shields.io/badge/Base-Sepolia-blue)](https://sepolia.basescan.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.32.0-blue)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

**VOISSS** is a B2B voice licensing marketplace where AI agents purchase authentic human voices. Built on Base blockchain with ElevenLabs TTS, IPFS storage, and OWS multi-chain payments.

**Live:** https://voisss.netlify.app

## Quick Start

```bash
git clone https://github.com/thisyearnofear/VOISSS.git && cd VOISSS
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web      # http://localhost:4445
```

## Platform Status

| Platform | Status | Blockchain |
|----------|--------|------------|
| Web | ✅ Production | Base Mainnet |
| Mobile (RN) | 🔄 In Progress | Scroll Sepolia |
| Flutter | ✅ AI Butler Live | Serverpod backend |

## Key Contracts (Base Mainnet)

| Contract | Address |
|----------|---------|
| AgentRegistry (v2) | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` |
| ReputationRegistry | `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127` |
| VoiceRecords | `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D` |
| $VOISSS Token | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` |

## Features

- **Voice Marketplace** — License authentic human voices for AI agents ($49-$2K+/mo, 70% revenue to contributors)
- **Agent API** — Pay-per-call voice synthesis via x402 or OWS multi-chain payments (~$0.000001/char)
- **OWS Payments** — 9 chains supported: Base, Arbitrum, Optimism, Polygon, Ethereum, Solana, Cosmos, TON, XRP
- **Agentic AI** — Gemini-powered context-aware voice assistant
- **Mission System** — Creator economy with $PAPAJAMS token gating

## Documentation

| Doc | Contents |
|-----|----------|
| [QUICKSTART.md](./docs/QUICKSTART.md) | Setup, run commands, monorepo structure, troubleshooting |
| [AGENT_API.md](./docs/AGENT_API.md) | Voice generation API, OWS payments, security, events |
| [BLOCKCHAIN.md](./docs/BLOCKCHAIN.md) | Smart contracts, tokens, x402, marketplace, gasless txns |
| [HACKATHON.md](./docs/HACKATHON.md) | OWS hackathon strategy, demo script, submission materials |

## Tech Stack

- **Frontend:** Next.js 15, React Native, Flutter
- **Blockchain:** Base (Web), Scroll (Mobile), Solidity
- **AI:** Google Gemini, ElevenLabs, Venice AI
- **Storage:** IPFS (Pinata)
- **Payments:** x402 protocol, OWS multi-chain

## License

MIT — see [LICENSE](./LICENSE)

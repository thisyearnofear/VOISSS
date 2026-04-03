# VOISSS Quickstart

**Last Updated:** April 2026

B2B voice licensing marketplace where AI agents purchase authentic human voices. Built on Base blockchain with ElevenLabs TTS, IPFS storage, and OWS multi-chain payments.

**Live:** https://voisss.netlify.app

---

## Prerequisites

- Node.js v18+
- pnpm v8+
- Git

## Setup

```bash
git clone https://github.com/thisyearnofear/VOISSS.git && cd VOISSS
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp .env.example .env
```

### Essential Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BASE_CHAIN_ID` | 8453 (Base Mainnet) |
| `SPENDER_PRIVATE_KEY` | Gasless tx wallet |
| `NEXT_PUBLIC_ELEVENLABS_API_KEY` | Voice synthesis |
| `PINATA_API_KEY` / `PINATA_API_SECRET` | IPFS storage |
| `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` | x402 payments |
| `X402_PAY_TO_ADDRESS` | Payment recipient wallet |

### Smart Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| AgentRegistry (v2) | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` |
| ReputationRegistry | `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127` |
| VoiceRecords | `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D` |
| $VOISSS Token | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` |
| $PAPAJAMS Token | `0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

## Run

```bash
pnpm dev:web      # Web app (port 4445)
pnpm dev:mobile   # React Native (in progress)
pnpm build        # Production build
pnpm test         # Run tests
```

### x402 Payment Testing

```bash
pnpm x402:debug check-env         # Verify config
export TEST_AGENT_PRIVATE_KEY=0xKey
pnpm x402:test                    # End-to-end payment test
```

## Monorepo Structure

```
voisss/
├── apps/
│   ├── web/              # Next.js 15 + Base Account SDK
│   ├── mobile/           # React Native + Expo + Scroll
│   └── mobile-flutter/   # Flutter + Serverpod + Venice AI
├── packages/
│   ├── shared/           # Common utilities, types, services
│   ├── contracts/        # Solidity smart contracts
│   └── ui/               # Shared UI components
├── docs/                 # 4 consolidated docs
├── scripts/              # Test and utility scripts
└── services/             # Backend services
```

## Platform Status

| Platform | Status | Blockchain |
|----------|--------|------------|
| Web | ✅ Production | Base Mainnet |
| Mobile (RN) | 🔄 In Progress | Scroll Sepolia |
| Flutter | ✅ AI Butler Live | None (Serverpod) |

## Common Issues

| Issue | Fix |
|-------|-----|
| "CDP API keys not configured" | Set `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` |
| "Invalid x402PayTo address" | Ensure valid 0x + 42 char address |
| "Payment verification failed" | Check CDP keys, verify agent has USDC on Base |
| "Facilitator error (401)" | Regenerate CDP keys at portal.cdp.coinbase.com |

## Network Config

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Base Mainnet | 8453 | https://mainnet.base.org | https://basescan.org |
| Base Sepolia | 84532 | https://sepolia.base.org | https://sepolia.basescan.org |
| Scroll Sepolia | 534351 | https://sepolia-rpc.scroll.io | https://sepolia.scrollscan.com |

## Documentation

| Doc | Contents |
|-----|----------|
| [AGENT_API.md](./AGENT_API.md) | Agent API, OWS payments, security, events |
| [BLOCKCHAIN.md](./BLOCKCHAIN.md) | Contracts, tokens, x402, marketplace |
| [HACKATHON.md](./HACKATHON.md) | OWS hackathon strategy, demo, submission |

## Links

- **GitHub:** https://github.com/thisyearnofear/VOISSS
- **Telegram:** https://t.me/+jG3_jEJF8YFmOTY1
- **CDP Portal:** https://portal.cdp.coinbase.com
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

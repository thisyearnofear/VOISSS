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
| `ELEVENLABS_API_KEY` | Server-side voice synthesis and contributor cloning |
| `NEXT_PUBLIC_ELEVENLABS_API_KEY` | Optional client-side ElevenLabs features |
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
│   ├── shared/           # Common utilities, types, services, route registry
│   ├── sdk/              # Public TypeScript SDK (@voisss/sdk)
│   └── ui/               # Shared UI components
├── services/
│   └── voisss-backend/   # Express service: dubbing, ACP listener worker
├── docs/                 # Documentation
│   └── adr/              # Architecture decision records
├── scripts/              # Test and utility scripts (incl. check:routes)
└── netlify.toml          # Web app deploy config
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
| "Voice cloning is not configured" | Set `ELEVENLABS_API_KEY` |
| "Failed to archive reference samples to IPFS" | Set `PINATA_API_KEY` and `PINATA_API_SECRET` |

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
| [ARKIV_INTEGRATION.md](./ARKIV_INTEGRATION.md) | Arkiv Braga Testnet: entity schema, API endpoints, query patterns |

## Links

- **GitHub:** https://github.com/thisyearnofear/VOISSS
- **Live App:** https://voisss.netlify.app
- **Getting Started:** [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Telegram:** https://t.me/+jG3_jEJF8YFmOTY1
- **CDP Portal:** https://portal.cdp.coinbase.com
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

---

## Next Steps

After setup, consider:
1. **Browse the marketplace** at `/marketplace` to see available voices
2. **Try the API** with the preview endpoint (no payment required)
3. **Read the agent API docs** at [AGENT_API.md](./AGENT_API.md)
4. **Join the community** on Telegram for support and updates

## Recent Progress (June 2026)

The repository is on a planned path from "hackathon prototype" (~6/10) to "solid production" (~9/10). The full plan lives in [adr/0001-starknet-cairo-removal.md](./adr/0001-starknet-cairo-removal.md) and following ADRs.

| Phase | Status | What landed |
|---|---|---|
| 0.1 | ✅ | Starknet / Cairo removed per [ADR 0001](./adr/0001-starknet-cairo-removal.md). 28 files deleted, 14 edited. Mobile app entanglement (UI only) deferred. |
| 0.2 | ✅ | ACP listener unified. JS worker replaced by a 20-line shim that calls `startAcpListenerWorker()` in `packages/shared`. PM2 still runs the same process. |
| 0.3 | ✅ | Route registry (`packages/shared/src/api/routes.ts`) is the canonical list of 84 endpoints, with `live` / `planned` / `deprecated` status. `pnpm run check:routes` validates the filesystem matches. |
| 1A | ✅ | The 4 documented-but-missing routes are live: `/api/acp/listener` (admin), `/api/butler/memory` (action-based GET/POST), `/api/agents/voice-clone` (410 alias to canonical). All have happy-path tests. |
| 2B (start) | 🚧 | Critical-path tests in place: `x402Client` (32), `PaymentRouter` (10), `agent-rate-limiter` (11). **73 tests, 0 flakes** across `apps/web` and `packages/shared`. |

### Up next (in order of leverage)

1. **More critical-path tests.** `agent-security`, `agent-event-hub`, `engagement-service`, and `persistent-mission-service` still have zero coverage. The security and event-hub tests are highest-leverage because they guard the most-trafficked route (`/api/agents/vocalize`).
2. **Smart contract tests.** `apps/web/contracts/` has 5 Solidity contracts and zero Hardhat tests. Phase 3 of the plan.
3. **Strict TypeScript across the repo.** Move to `"strict": true`, `"noUncheckedIndexedAccess": true`, and fix the resulting errors. Catches a class of bugs at compile time.
4. **CI pipeline.** The repo has only one workflow (`deploy-voisss-backend.yml`). Plan calls for typecheck + lint + tests + route check + Hardhat tests on every PR.
5. **OpenAPI from the route registry.** The hand-written `/api/agents/openapi.json` is six endpoints. The registry has 84. Auto-generate.
6. **E2E tests.** Playwright on the marketplace / studio / agent-vocalize flows.

For each, the work is mechanical and reviewable. None require a fundamental redesign.

---


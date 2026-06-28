# VOISSS × "90 Days. Ideate. Build. Ship. Grow." — Hackathon Submission

**Category:** Entrepreneurship & Job Creation  
**Live:** https://voisss.netlify.app  
**GitHub:** https://github.com/thisyearnofear/VOISSS

---

## What is VOISSS?

VOISSS is a **B2B voice licensing marketplace where AI agents are the primary customers**. AI agents autonomously discover, purchase, and use authentic human voices — paying micropayments in USDC directly to voice contributors.

**The core loop:**
1. A voice contributor records their voice once and lists it on VOISSS
2. AI agents find VOISSS via the [ACP marketplace](./docs/ACP_SPECIFICATION.md) or direct API
3. An AI agent pays ~$0.000001/character via x402 or USDC credits
4. Smart contract automatically routes 70% to the contributor, 30% to the platform
5. The contributor earns passive income — no human approval required at any step

---

## How AI Operates This Business

### What AI Does

| Function | System | Where |
|---|---|---|
| **Autonomous job discovery** | ACP Listener — scans Virtuals Protocol marketplace for voice jobs, scores them 0–100, and auto-bids | `packages/shared/src/services/acp-listener-service.ts` |
| **Content analysis** | Google Gemini 3.0 Flash — analyzes voice recordings for quality, emotional tone, and humanity verification | `apps/web/src/lib/ai-inference.ts` |
| **Voice generation** | ElevenLabs + our licensed voice library — converts text to audio on demand | `apps/web/src/app/api/agents/vocalize/route.ts` |
| **Payment routing** | x402 protocol + smart contracts — automatically selects cheapest payment method and routes revenue | `packages/shared/src/lib/payment-router.ts` |
| **Revenue distribution** | Solidity on Base Mainnet — 70/30 split enforced on-chain, no human approves payments | `apps/web/contracts/AgentRegistry.sol` |
| **Personalized recommendations** | Butler Memory Service + Arkiv — remembers user preferences across sessions, makes proactive suggestions | `packages/shared/src/services/butler-memory-service.ts` |
| **Multi-language support** | Gemini — real-time translation and dubbing in 29+ languages | `apps/web/src/app/api/voice-assistant/route.ts` |
| **Security & fraud detection** | Agent Security Service — multi-layer threat detection, trust scoring 0–1000 | `packages/shared/src/services/agent-security.ts` |

### What Humans Do

- **Voice contributors** record their voice (one time)
- **Founders** make strategic product and partnership decisions
- That's it. The transaction lifecycle is fully autonomous.

---

## Google Cloud Integration

**Google Gemini** is foundational — not a bolt-on feature:

- **`GEMINI_API_KEY`** powers all AI inference (content analysis, AI butler, language detection)
- **Fallback chain:** ACP Compute (Virtuals/Venice AI) → Google Gemini → local fallback
- **AI Butler:** Gemini-driven conversational assistant with decentralized memory (Arkiv)
- **29-language dubbing:** Gemini translates text before ElevenLabs synthesis
- **Humanity verification:** Gemini analyzes recordings for authenticity signals

Setup: `GEMINI_API_KEY=your_key` in `apps/web/.env.local`

---

## Jobs & Economic Opportunities Created

### For Voice Contributors
- **Passive income** from every AI agent API call — 70% revenue, enforced by smart contract
- **Mission system** — fund voice collection campaigns with $PAPAJAMS tokens
- **Streak & achievement rewards** — daily recording streaks up to 365 days

### For AI Builders & Indie Developers
- **Pay-per-character pricing** (~$0.000001/char) — no monthly subscription barrier
- **Multi-chain payments** — Base, Arbitrum, Optimism, Polygon, Ethereum
- **Full API + SKILL.md** — [SKILL.md](./SKILL.md) is a machine-readable skill that any AI agent can execute

### New Roles Created
- **Voice Mission Creator** — curates community voice campaigns, earns engagement rewards
- **Voice Licensing Agent** — autonomous AI that matches enterprise buyers with contributors

---

## AI in Production — Evidence

### Autonomous Agent Commerce Protocol (ACP) Listener
```
Status: LIVE
Endpoint: POST /api/acp/listener (action: "start")
Monitors: 3 offerings simultaneously (VoiceVocalize, VoiceInsight, VoiceClone)
```

### On-Chain Contracts (Base Mainnet — verifiable)
| Contract | Address | Basescan |
|---|---|---|
| AgentRegistry v2 | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` | [View](https://basescan.org/address/0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c) |
| ReputationRegistry | `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127` | [View](https://basescan.org/address/0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127) |
| VoiceRecords | `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D` | [View](https://basescan.org/address/0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D) |
| $VOISSS Token | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` | [View](https://basescan.org/address/0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07) |

### API Endpoints (Live Production)
```bash
# Test the live agent API
curl https://voisss.netlify.app/api/agents/themes

# Agent discovery manifest
curl https://voisss.netlify.app/.well-known/ai-plugin.json

# Platform stats
curl https://voisss.netlify.app/api/tools/platform-stats
```

---

## Quick Start for Developers

```bash
git clone https://github.com/thisyearnofear/VOISSS && cd VOISSS
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill in: ELEVENLABS_API_KEY, GEMINI_API_KEY
pnpm dev:web  # http://localhost:4445
```

See [GETTING_STARTED.md](./docs/GETTING_STARTED.md) for full setup.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, Tailwind CSS |
| AI | Google Gemini 3.0 Flash, ElevenLabs, Venice AI |
| Blockchain | Base Mainnet (Solidity), x402 micropayments |
| Storage | IPFS (Pinata), Arkiv Braga Testnet (decentralized memory) |
| Payments | Stripe (fiat → credits), x402 (USDC micropayments), OWS multi-chain |
| Agent Commerce | Virtuals Protocol ACP, OpenClaw, SKILL.md standard |

---

## Revenue Model

| Stream | Price | Revenue Split |
|---|---|---|
| Pay-per-character API | ~$0.000001/char | 70% creator / 30% platform |
| Developer license | $49/mo | 70% creator / 30% platform |
| Startup license | $499/mo | 70% creator / 30% platform |
| Enterprise / Custom voice clone | $2,000+ | Negotiated |
| Fiat credits (Stripe) | $5–$65 packs | Platform collects, distributes on-chain |


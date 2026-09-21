# VOISSS 🎤

[![Base](https://img.shields.io/badge/Base-Mainnet-blue)](https://basescan.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.24-black)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.32.0-blue)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Gemini-4285F4)](https://cloud.google.com/)
[![Hackathon](https://img.shields.io/badge/🏆-Hackathon%20Submission-FF6F00)](./docs/SUBMISSION_NARRATIVE.md)

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
- 🔗 Multi-chain OWS payments — 5 EVM chains live, Solana beta, 4 more quoting (9 total)
- 🔒 Blockchain-verified provenance
- 🤖 Agent-native: `/llms.txt`, `/.well-known/agent.json`, money-transport-parameters, OpenAPI spec, and WebMCP tools — drop-in skill file at root `SKILL.md`

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

**Stats:** 21+ voices • 5 EVM chains live + Solana beta • Agent-native discovery • Production API • 70% contributor split

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

> **Wedge:** the marketplace leads with *voice discovery*, not licensing — describe the voice you need in plain language and the grid re-ranks in ~300ms. Day-one inventory is the platform's ElevenLabs catalog (usable immediately via the vocalize API, pay-per-use). Contributor-listed voices licensed on-chain merge into the same ranked grid as supply arrives — the agent-native loop (intent → voice → audio → per-call payment via x402/ACP) is the wedge; the on-chain licensing layer is the moat for studios once there's real supply.

- **Intent-Based Discovery** — Describe the voice in plain language; Jev scores every voice in the catalog in one call and re-ranks the grid live
- **22+ Platform Voices** — ElevenLabs catalog with real preview audio, usable instantly via `/api/agents/vocalize`
- **On-Chain Licensing** — Contributor-listed voices with smart-contract licensing merge into the same grid when listed (VoiceLicenseMarket deploy pending)
- **Transparent Pricing** — Pay-per-use for platform voices; subscription licensing for on-chain listings with 70% revenue to contributors

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

### Arkiv Integration (Braga Testnet)

VOISSS uses Arkiv Braga Testnet as a decentralized data layer for voice insights, humanity verification, and agent memory. Entities are user-owned via on-chain ownership transfer, with numeric timestamps for range queries, idempotent writes, and cursor-based pagination.

**Docs:** [Arkiv Integration Guide](./docs/ARKIV_INTEGRATION.md)

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
| [ARKIV_INTEGRATION.md](./docs/ARKIV_INTEGRATION.md) | Arkiv Braga Testnet: entity schema, API endpoints, query patterns |
| [HOMEPAGE_SHOWCASE.md](./docs/HOMEPAGE_SHOWCASE.md) | Hero "real human vs. licensed AI" waveform comparison — assets, swap procedure, attribution |
| [STUDIO_HERO.md](./docs/STUDIO_HERO.md) | /studio "Earn 70%" hero — copy, design, click-through flow from the homepage showcase |

## Tech Stack

- **Frontend:** Next.js 15, React Native, Flutter
- **Blockchain:** Base (Web), Scroll (Mobile), Solidity
- **AI:** Google Gemini, ElevenLabs, Venice AI
- **Storage:** IPFS (Pinata), Arkiv Braga Testnet (decentralized insights)
- **Payments:** x402 protocol, OWS multi-chain

---

## Jev Intent Layer

Jev (TypeSafe AI's System One evaluation model) is an **optional** intent-classification layer on top of the existing voice pipeline. It does **not** replace any routing or model selection — it adds a new dimension: reading *what the agent wants the voice to sound like* and classifying emotional/intent categories in a single fast call, fractions of a cent per call.

### Shipped: marketplace intent search

**Live on `/marketplace`.** Typing a natural-language brief ("warm narrator for a meditation app") fires `POST /api/marketplace/voice-match`, which fans out one Jev call containing a boolean fit-check per voice plus brief-level questions (emotion Choice, use-case Choice, urgency Score). The grid re-sorts by fit probability as you type; the response also returns detected emotion/use-case/urgency, measured latency, and token usage.

- Auth: `AI_GATEWAY_API_KEY` (free via the Vercel AI Gateway, `typesafe-ai/jev`, AI SDK `experimental_evaluate`) or `TYPESAFE_API_KEY` (direct `POST /v1/systemone`, `jev-latest`)
- Catalog: scores the merged marketplace catalog — platform voices + on-chain listings
- B2B: callers may pass `{ brief, voices[] }` to score their own roster through the same endpoint
- Graceful: returns `jev_not_configured` (503) with no key; the marketplace degrades to normal browsing

### Proposed pipeline layer (additive, opt-in)

Jev reads the *intent* of the voice request and classifies it before the generation pipeline runs. One API call (`POST /v1/systemone`) carries a `state` (the voice spec / transcript) plus a `questions` map — all questions are evaluated **in parallel**, so adding questions barely changes response time. This is an **optional pre-flight signal** that enhances the routing logic:

```
Agent sends voice request
    │
    ├── [OPTIONAL] Jev fan-out — one call, many questions:
    │   Choice:  emotion?       → { choice, probabilities, confidence }
    │   Choice:  intent?        → { choice, probabilities, confidence }
    │   Score:   urgency?       → { score, legend, probabilities, confidence }
    │   Noul:    "has a CTA?"   → { noul: 0-1 }   (no confidence field)
    │   Noul:    "needs a disclaimer voice?" → { noul: 0-1 }
    │
    ├── Voice generation pipeline (existing, unchanged)
    │   Uses the classified signals as additional hints
    │   If Jev is unavailable, the pipeline proceeds as normal
    │
    └── Returns audio (unchanged)
```

Answers are typed per-question, not a single blob — your code composes them. **Gating note:** only Choice and Score answers return `confidence`; Noul returns a raw probability you threshold yourself. So questions that drive the "proceed unchanged if uncertain" fallback should be Choice/Score.

### Concept from examples

Like the "intent-based search" example — Jev reads the Gmail inbox and understands intent, not patterns. For VOISSS, Jev reads the voice spec and understands *emotional intent* — not just keyword matching, but what the agent actually wants the voice to convey.

- Agent says "make this sound excited" → `emotion` Choice answers `excited` at confidence 0.95 — an intent read, not a keyword match
- Agent says "this is a professional announcement" → `intent` Choice answers `announcement`, `emotion` answers `authoritative`
- Agent sends a raw transcript → `emotion` answers `conversational`, a `formality` Score lands low, a `"mentions pricing"` Noul returns ~0.0

### Why optionality

- The existing voice generation pipeline (Gemini, ElevenLabs) is the **source of truth** — Jev is a signal, not a generator
- If Jev is unavailable or returns uncertain, the pipeline proceeds unchanged
- Jev is ~100ms and fractions of a cent per call — it's a real-time decision layer, not the voice engine
- Not every voice request needs intent classification — the agent/operator chooses when to invoke it
- The `@solana/spl-token` payment flow and x402 settlement remain unchanged
- Jev's `state` is **text** — it judges fit from the voice spec and voice metadata/descriptions, not from listening to audio samples

### Beyond voice specs — other Jev hooks already in the codebase

- ~~**Voice matching / marketplace search**~~ — shipped (see above). One fan-out call returns a per-voice fit distribution plus brief insights, replacing the `tone=` keyword filter with intent matching.
- **ACP auto-bidder** — the listener already scores inbound jobs 0–100 and auto-bids at 80+ (see `docs/ACP_SPECIFICATION.md`). A Jev Score does that in ~100ms instead of a full LLM call.
- **Security confidence tiers** — the existing allow/challenge/block gates (0.9+/0.4–0.7/<0.4) map directly onto TypeSafe's confidence-gated routing pattern.
- **Pre-flight Nouls** — cheap yes/no checks before a paid generation: "is this usage covered by a non-exclusive license?", "does the content match this voice's tags?"

### Architecture sketch

```
apps/web/ (existing Next.js + Flutter)
    │
    ├── [OPTIONAL] jev-intent.ts module
    │   Reads: voice spec, transcript, agent prompt
    │   Sends: intent evaluation to Jev
    │   Returns: { emotion, confidence, intent }
    │
    ├── Voice generation pipeline (existing, unchanged)
    │   Google Gemini, ElevenLabs, Venice AI
    │
    └── x402 payment (existing, unchanged)
        ~$0.000001/char, multi-chain OWS
```

### Key files to reference (if implementing)

- `apps/web/` — existing Next.js marketplace (unchanged)
- `apps/flutter/` — existing Flutter AI butler (could accept Jev intent hints)
- Existing AI adapters (Gemini, ElevenLabs) — unchanged
- The x402 payment flow — unchanged

---

## License

MIT — see [LICENSE](./LICENSE)

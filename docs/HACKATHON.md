# OWS Hackathon — VOISSS

**Event:** OWS Hackathon — April 3, 2026  
**Track:** Track 3 — Pay-Per-Call Services & API Monetization  
**Live:** https://voisss.netlify.app

## Core Pitch

"Voice-as-a-Service for AI Agents — No accounts, no API keys, just an OWS wallet and instant voice generation across 9 chains."

**Why this wins:** 80% already built (x402, agent API, ElevenLabs live). Real production system, not a prototype. Perfect track match. Only agent-first voice platform with blockchain payments.

## What We're Building

Transform `/api/agents/vocalize` into an OWS-powered multi-chain voice API:
- Agents pay with OWS wallets (Base, Solana, Arbitrum, Optimism, Polygon)
- Dynamic pricing based on chain gas costs
- Real-time dashboard showing cross-chain agent activity
- Fallback to x402 for legacy agents

## Architecture

```
Agent Request → OWS Wallet Detection → Payment Quote
                     ↓
               Multi-Chain Payment (Base/Solana/Arb/Op/Poly)
                     ↓
               OWS Payment Verification → ElevenLabs → IPFS → Response
                     ↓
               Analytics DB (chain, cost, agent)
```

## Workstreams

### 1. OWS Payment Integration (Backend)
- `apps/web/src/lib/ows-payment.ts` — wallet verification, multi-chain quotes, payment verification
- Update `api/agents/vocalize/route.ts` — OWS detection, 402 with OWS instructions, verify before synthesis
- Support Base, Arbitrum, Optimism, Polygon with chain-specific pricing

### 2. Dashboard & Analytics (Frontend)
- `app/dashboard/hackathon/page.tsx` — stats cards, charts, live feed
- `api/analytics/hackathon/route.ts` — aggregate by chain, agent, time
- Polling every 5s, responsive, dark mode

### 3. Demo & Documentation (DevRel)
- Demo script: `docs/HACKATHON_DEMO.md`
- Integration guide: `docs/OWS_INTEGRATION.md`
- Test agent: `scripts/test-ows-agent.ts`
- Video demo: 2-3 min screen recording

## Demo Script (5 Minutes)

| Time | Action |
|------|--------|
| 0:00 | Problem: Agents need voices but APIs require accounts/keys |
| 1:00 | Solution: VOISSS + OWS — wallet + HTTP request, 9 chains |
| 2:00 | Live: curl with OWS headers → 402 → sign payment → audio URL |
| 3:00 | Multi-chain: Same agent, switch to Arbitrum, show 0.95x pricing |
| 4:00 | Dashboard: Real-time stats, revenue by chain, live feed |
| 4:30 | Close: Production system, autonomous agent economy |

## Video Recording Steps

1. Terminal: `echo $WALLET_ADDRESS` → curl to `/api/agents/vocalize` with OWS headers
2. Show 402 response with payment object (chain, amount, recipient)
3. Sign payment: `mp sign-payment --chain eip155:8453 --to ... --amount ...`
4. Retry with `X-OWS-Payment` header → show 200 with `audioUrl`, `cost`, `owsChain`
5. Repeat with Arbitrum (`eip155:42161`) → show 0.95x pricing
6. Switch to dashboard → point out stats, revenue by chain, live feed

**Target:** 2-3 min, 1080p, MP4. See `docs/HACKATHON_DEMO.md` for detailed recording guide.

## Submission Materials

### Project Description (200 words)

VOISSS is a pay-per-call voice synthesis API built for autonomous AI agents. No accounts, no API keys, no subscriptions — just an OWS wallet and an HTTP request. Agents generate high-quality voice using ElevenLabs and pay with USDC across 9 chains (Base, Solana, Arbitrum, Optimism, Polygon, Ethereum, Cosmos, TON, XRP Ledger).

Unlike traditional voice APIs requiring human-managed accounts, VOISSS enables truly autonomous agent commerce. An agent detects its wallet, receives a payment quote, signs a transaction, and gets voice back — all in under a second.

Built on production infrastructure already serving real users, VOISSS adds OWS multi-chain payments to an existing x402 payment system. Dynamic pricing adjusts per chain based on gas costs. A real-time dashboard tracks cross-chain agent activity, revenue, and usage metrics.

This solves a real problem: AI agents need voices for user interaction but current APIs create friction. VOISSS removes that friction and enables the autonomous agent economy.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Agent Client                          │
│  OWS Wallet  │  User-Agent Header  │  X-OWS-Wallet Header   │
│  (Base/Sol)  │                     │  X-OWS-Chain Header    │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              VOISSS Voice API (Next.js)                      │
│  1. Detect OWS wallet  2. Generate chain-specific quote     │
│  3. Return 402 with x402 details  4. Verify on retry        │
│  5. Call ElevenLabs → IPFS  6. Return audio URL + recording │
│                                                              │
│  OWS Payment Handler: wallet verify, multi-chain quotes,    │
│  gas-adjusted pricing, x402 verification                    │
│  Analytics Engine: track by chain/agent/time, feed dashboard│
└───────────────┬─────────────────────────────────────────────┘
                ▼
     ElevenLabs TTS  │  IPFS (Pinata)  │  Analytics DB
```

## Pre-Submission Checklist

### Technical
- [ ] OWS payment handler implemented
- [ ] Multi-chain support (3+ chains)
- [ ] Voice generation with OWS payments working
- [ ] Dashboard showing real-time stats
- [ ] Test agent making requests
- [ ] Fallback to x402 for legacy agents

### Documentation
- [x] Integration guide complete
- [x] Demo script finalized
- [x] Architecture diagram created
- [x] README updated with OWS info
- [ ] Video demo recorded

### Submission
- [x] Project description written
- [ ] Live demo URL working
- [ ] GitHub repo public
- [ ] Track selected (Track 3)
- [ ] Submission form filled

## Competitive Advantages

1. **Production System** — Live at voisss.netlify.app, not a prototype
2. **Real Infrastructure** — x402 payments working, adding OWS
3. **Multi-Chain Native** — 9 chains supported via OWS
4. **Zero Friction** — No accounts, no API keys, just wallet
5. **Scalable** — Already handling production traffic

## Resources

- **OWS Hackathon:** https://ows.build/hackathon
- **OWS SDK Docs:** https://docs.ows.build
- **MoonPay CLI:** https://github.com/moonpay/cli
- **Integration Guide:** [OWS_INTEGRATION.md](./OWS_INTEGRATION.md)
- **Demo Script:** [HACKATHON_DEMO.md](./HACKATHON_DEMO.md)
- **Test Agent:** `scripts/test-ows-agent.ts`

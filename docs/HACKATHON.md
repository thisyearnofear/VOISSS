# OWS Hackathon - VOISSS

**Voice-as-a-Service for AI Agents with Multi-Chain OWS Payments**

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://voisss.netlify.app/dashboard/hackathon)
[![Autonomous Agent Demo](https://img.shields.io/badge/Agent-Demo-green)](https://voisss.netlify.app/demo/ows-agent)
[![Track 3](https://img.shields.io/badge/Track-3%20Pay--Per--Call-purple)](https://ows.build/hackathon)
[![OWS](https://img.shields.io/badge/OWS-Multi--Chain-green)](https://openwallet.sh)

---

## 🎯 What is VOISSS?

VOISSS is a **production-ready** pay-per-call voice generation API designed for AI agents. No accounts, no API keys - just an OWS wallet and instant voice generation across 9 blockchains.

**The Problem:** AI agents need voices to run businesses (customer service, companions, assistants), but traditional APIs require complex onboarding and human-managed accounts.

**The Solution:** Pay-per-character voice generation with OWS multi-chain payments. Agents discover the API, pay with their wallet, and generate voices - no human in the loop.

---

## 🔗 Quick Links

- **Production API**: https://voisss.netlify.app/api/agents/vocalize
- **Autonomous Agent Demo**: https://voisss.netlify.app/demo/ows-agent (⭐ New)
- **Live Dashboard**: https://voisss.netlify.app/dashboard/hackathon
- **GitHub Repository**: https://github.com/thisyearnofear/VOISSS
- **Video Demo**: [Link to 3-minute demo video]

---

## ⚡ Quick Start for Developers

### 1. Setup OWS Wallet
Agents should use an OWS-compatible wallet (e.g., via MoonPay CLI).
```bash
# Create and fund an OWS wallet (Base recommended)
mp wallet create
mp fund --chain eip155:8453 --amount 10
```

### 2. Make Voice Generation Request
```bash
WALLET_ADDRESS=$(mp wallet address)

curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -H "X-OWS-Wallet: $WALLET_ADDRESS" \
  -H "X-OWS-Chain: eip155:8453" \
  -d '{
    "text": "Hello from an AI agent!",
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  }'
```

### 3. Handle 402 Payment Required
The API will return a `402 Payment Required` status with chain-specific payment details. Sign the payment with your OWS wallet and retry with the `X-OWS-Payment` header.

---

## 🏗️ Technical Architecture

### System Flow
```
Agent Request → OWS Wallet Detection → Payment Quote (402)
                     ↓
               Multi-Chain Payment (Base/Solana/Arb/Op/Poly)
                     ↓
               OWS Payment Verification → ElevenLabs → IPFS → Response (200)
                     ↓
               Real-Time Analytics Dashboard
```

### Key Components
1. **OWS Payment Handler** (`lib/ows-payment.ts`): Multi-chain wallet verification, HTTP Message Signatures (X-OWS-Signature), and pricing logic.
2. **Voice API** (`api/agents/vocalize/route.ts`): Triple support for OWS Signatures, OWS x402, and legacy x402 payments.
3. **Analytics Dashboard** (`app/dashboard/hackathon/page.tsx`): 5-second polling for real-time activity with reputation visualization.
4. **Autonomous Agent Demo** (`app/demo/ows-agent/page.tsx`): Real-time simulation of agentic commerce with OWS Zero-Trust signing.
5. **Test Agent** (`scripts/test-ows-agent.ts`): Simulates autonomous agent interaction using OWS headers.

---

## 🔷 OWS Integration & Multi-Chain Support

VOISSS supports 9 chains via OWS, providing a unified interface for agents on any network.

### Supported Chains
- **EVM (Full Support):** Base (⭐), Arbitrum, Optimism, Polygon, Ethereum.
- **Non-EVM (Structure Ready):** Solana, Cosmos, TON, XRP Ledger.

### OWS Zero-Trust Identity & Security
VOISSS implements the latest OWS identity standards, ensuring agents don't just pay, but prove their identity securely.
- **X-OWS-Signature**: HTTP Message Signatures (RFC 9421) for zero-trust request verification.
- **X-OWS-Agent-ID**: Persistent agent identity mapped to OWS wallet provenance.
- **X-OWS-Timestamp**: Replay attack protection for all signed requests.

### Multi-Provider AI Resilience & Fallbacks
VOISSS implements a robust, provider-agnostic AI inference layer that ensures 100% uptime for agent analysis and insights.
- **Primary**: Google Gemini 1.5/2.0 (Multimodal Audio-native analysis).
- **Secondary (Privacy-Focused)**: Venice AI (Llama 3.3 70B) for zero-logging metadata analysis.
- **Tertiary (Open-Source)**: Kilocode/OpenRouter (Minimax/GLM) for cost-effective fallback.
- **Automatic Fallback**: If the primary provider is rate-limited or unavailable, the system automatically cycles through fallbacks to ensure the agent never loses its "cognitive" layer.

### Chain-Specific Pricing Optimization
Pricing automatically adjusts based on gas costs, allowing agents to optimize for cost-efficiency.
- **Solana:** 0.85x ($0.00085/1k chars)
- **Polygon:** 0.9x ($0.0009/1k chars)
- **Arbitrum/Optimism:** 0.95x ($0.00095/1k chars)
- **Base:** 1.0x ($0.001/1k chars - Baseline)
- **Ethereum:** 1.1x ($0.0011/1k chars)

---

## 🎬 Demo Script (5 Minutes)

| Time | Action | Key Talking Point |
|------|--------|-------------------|
| 0:00 | **Problem** | Current voice APIs require human-managed accounts and keys. |
| 1:00 | **Solution** | VOISSS + OWS enables wallet-to-voice with zero friction. |
| 2:00 | **Live API** | `curl` with OWS headers → 402 → sign → 200 (Audio URL). |
| 3:00 | **Multi-Chain** | Switch from Base to Arbitrum, show 0.95x pricing update. |
| 4:00 | **Dashboard** | Real-time stats, revenue by chain, and agent activity feed. |
| 4:30 | **Conclusion** | Production-ready infrastructure for the autonomous economy. |

---

## 🏆 Why VOISSS Wins Track 3

1. **Production-Ready**: This is not a hackathon prototype. It's a live system at `voisss.netlify.app` with real payments and infrastructure.
2. **Autonomous Commerce**: Demonstrated via our live agent demo, agents manage their own P&L and policy-governed budgets autonomously.
3. **Real Use Case**: AI agents *need* voices for commerce, customer support, and interaction. We remove the friction of account creation.
3. **Multi-Chain Native**: 9 chains supported out-of-the-box via OWS, with gas-adjusted pricing that matters to agents.
4. **Zero Account UX**: No API keys, no subscriptions, no credit cards. Just a wallet and a request.
5. **Scale & Security**: Includes rate limiting, agent reputation scoring, and IPFS provenance.

---

## 🛠️ Tech Stack

- **Backend**: Next.js 15, TypeScript, Node.js
- **Payment**: x402 + OWS (Open Wallet Standard)
- **Voice**: ElevenLabs API
- **AI Inference**: Multi-provider resilience (Gemini, Venice AI, Kilocode/OpenRouter)
- **Storage**: IPFS (Pinata)
- **Blockchain**: 9 chains via OWS
- **Infrastructure**: Netlify, PostgreSQL, Redis

---

## 📞 Contact

- **Email**: papaandthejimjams@gmail.com
- **Telegram**: https://t.me/+jG3_jEJF8YFmOTY1
- **GitHub**: https://github.com/thisyearnofear/VOISSS

---
**Built for the OWS Hackathon - April 3, 2026** 🚀

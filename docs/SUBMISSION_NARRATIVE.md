# VOISSS — Hackathon Submission Narrative

**Category:** Entrepreneurship & Job Creation  
**Google Cloud Product:** Google Gemini 3.0 Flash  
**Live:** https://voisss.netlify.app  
**GitHub:** https://github.com/thisyearnofear/VOISSS

---

## The Business in One Sentence

VOISSS is a B2B voice licensing marketplace where AI agents are the primary customers — they autonomously discover voice opportunities, bid on jobs, purchase voice generation services, and distribute revenue to human contributors, all without a human in the loop.

## How AI Runs This Business

The entire transaction lifecycle is automated. Here is what AI does, step by step:

**1. Autonomous Job Discovery.** An ACP (Autonomous Agent Commerce Protocol) Listener runs as a persistent background process on our Hetzner server. It scans the Virtuals Protocol marketplace in real time for voice narration, dubbing, and audio content opportunities. Each job is scored 0–100 using keyword matching and relevance heuristics. If the score exceeds our confidence threshold, the system auto-bids on the job with a USDC budget. No human reviews these bids.

**2. Content Analysis via Google Gemini.** When a voice recording is submitted, Google Gemini 3.0 Flash analyzes it for quality, emotional tone, and humanity verification. This serves two purposes: it ensures only high-quality voices enter our marketplace, and it powers our AI Butler — a conversational assistant that remembers user preferences across sessions using decentralized Arkiv storage. Gemini also enables 29-language dubbing by translating text before ElevenLabs synthesis.

**3. Voice Generation.** Once a job is won or a direct API call comes in, our vocalize endpoint calls ElevenLabs with a licensed voice ID and returns studio-quality audio in milliseconds. The audio is stored on IPFS for permanent, decentralized access.

**4. Payment Routing.** The system automatically selects the cheapest payment method from five options: prepaid USDC credits, token-gated tier access, x402 micropayments, OWS (Open Wallet Standard) multi-chain payments, or Stripe fiat-to-credit conversion. The payment router considers the agent's balance, tier, and chain to minimize cost.

**5. Revenue Distribution.** Smart contracts on Base Mainnet enforce a 70/30 revenue split. When an AI agent pays ~$0.000001/character, 70% is automatically routed to the voice contributor's wallet. No human approves or touches these payments. The split is on-chain and immutable.

**6. Security & Fraud Detection.** Every API request passes through three security layers: agent verification (reverse CAPTCHA or wallet proof), behavioral threat detection with trust scoring (0–1000), and adaptive rate limiting with tier-based quotas. Suspicious activity triggers automatic throttling and event publication.

## What Humans Do

Humans have two roles in this system:

- **Voice contributors** record their voice once. That is their entire active contribution. After listing, the system handles discovery, licensing, payment, and delivery autonomously.
- **Founders** make strategic decisions: which partnerships to pursue, which blockchains to support, and which features to build next.

That is it. The operational business — finding customers, processing orders, collecting payment, and paying suppliers — runs on AI.

## Google Cloud Integration

Google Gemini is foundational, not a bolt-on. It powers content analysis, the AI butler, multi-language dubbing, and serves as a fallback inference provider in our resilient chain (ACP Compute → Gemini → local). No other AI provider is as deeply embedded in our operations.

## Jobs and Economic Opportunities Created

This is the Entrepreneurship & Job Creation category, and this is where VOISSS has its strongest impact:

**For voice contributors.** A voice actor in a developing economy can record 30 minutes of sample audio, list on VOISSS, and begin earning passive income immediately. Every time an AI agent anywhere in the world needs a voice, that contributor earns 70% of the revenue. The floor is zero — there is no cost to list. The ceiling is uncapped — more AI agents means more income. Smart contracts ensure payment without delay or intermediaries.

**For AI builders.** An indie developer building a voice-enabled chatbot can integrate VOISSS in five lines of code, pay $0.000001 per character, and have no monthly subscription. This removes the capital barrier that traditionally prevented solo developers from shipping voice products. One API call. One USDC payment. One licensed voice.

**New roles created.** The platform introduces roles that did not exist before: Voice Mission Curators (who fund and manage community voice collection campaigns), Autonomous Licensing Agents (AI agents that match enterprise buyers with voice contributors), and Community Campaign Organizers (who build regional voice datasets). These are not hypothetical — the mission system, smart contracts, and agent protocol are live and operational.

## Why This Matters

The world's 45 million software developers are becoming a billion. Everyone will be a developer, and AI agents will be the primary economic actors in the digital economy. VOISSS is a prototype of that future: a business that operates itself, creates real economic opportunity for humans, and scales without proportional human overhead. It is not a demo. It is live on Base Mainnet, serving API requests, generating audio, and distributing revenue — all autonomously.

---

*Word count: ~780*

# VOISSS — 3-Minute Hackathon Video Script

**Total runtime:** ~3 minutes  
**Style:** Screen recording with voiceover  
**Tone:** Professional, fast-paced, demonstration-oriented

---

## [0:00–0:30] Hook & Value Proposition

**Visual:** Open on VOISSS landing page (voisss.netlify.app). Zoom into the hero section showing "Voice Marketplace for AI Agents."

**Voiceover:**
"This is VOISSS — a voice licensing marketplace where the primary customers are AI agents. Not humans. AI agents.

Autonomous programs discover voice opportunities, bid on jobs, pay in USDC, receive audio, and distribute 70% of revenue to human voice contributors — all without a person clicking a button.

Let me show you how it works, end to end."

---

## [0:30–1:00] The Demo — Interactive Voice Generation

**Visual:** Navigate to /demo page. Type text into the text area. Select a voice. Click "Generate."

**Voiceover:**
"Here's the interactive demo. I type any text — a podcast intro, a product ad, a YouTube narration. I pick one of four licensed human voices. And with one click, the system generates studio-quality audio.

Watch — the request goes to our ElevenLabs endpoint, the audio is generated, stored on IPFS, and returned in seconds.

No account. No credit card. Three free generations to show you the quality."

**Visual:** Play the generated audio. Show the waveform visualization animating.

---

## [1:00–1:30] The Autonomous Commerce Loop

**Visual:** Switch to terminal / ACP listener logs. Show the autonomous agent discovering jobs.

**Voiceover:**
"That's the front end. What matters is what happens automatically.

Our ACP Listener — an autonomous agent — runs continuously on our server. It monitors the Virtuals Protocol marketplace for voice narration and dubbing opportunities. When it finds a match, it scores the job and auto-bids with a USDC budget.

Here you can see it scanning, finding a voice-over job, bidding, winning, and triggering our vocalize API — all without human involvement."

**Visual:** Show log output: `[ACP Listener] Job found: narration_12345, score: 87, auto-bidding 5 USDC... [ACP Listener] Bid won! Triggering vocalize...`

---

## [1:30–2:00] AI Stack — Google Gemini + Smart Contracts

**Visual:** Split screen: Google Gemini analysis output on left, Basescan smart contract on right.

**Voiceover:**
"Under the hood, Google Gemini 3.0 Flash is analyzing every voice recording for quality and authenticity. It powers our AI butler, enables 29-language dubbing, and serves as our fallback inference provider.

On the other side, smart contracts on Base Mainnet handle revenue distribution. Here on Basescan, you can see our AgentRegistry contract — it enforces a 70/30 revenue split for every transaction. No one can override it. No one needs to approve it."

**Visual:** Highlight the contract address and a verified transaction showing the split.

---

## [2:00–2:30] Payment Methods

**Visual:** Show the Buy Credits modal, then show an x402 payment in the terminal.

**Voiceover:**
"VOISSS supports five payment methods: prepaid USDC credits, token-gated tiers, x402 micropayments, OWS multi-chain across 9 blockchains, and Stripe fiat card payments.

Here, I'm buying $10 in voice credits with a card — Stripe handles the payment, and the credits are instantly available.

And here, an AI agent is paying via x402 — a single HTTP request with an embedded USDC transfer. No API keys. No accounts. Pure pay-per-query."

**Visual:** Scroll through the credit packs ($5–$50), then show the x402 curl command executing.

---

## [2:30–3:00] Economic Impact & Call to Action

**Visual:** Show the persona section of the landing page — three paths: developer, creator, enterprise.

**Voiceover:**
"Here's what this means for real people.

A voice actor in Nairobi records 30 minutes of audio once. Every time an AI agent uses their voice, they earn 70% — automatically, by smart contract.

An indie developer in São Paulo builds a voice chatbot with five lines of code, paying $0.000001 per character. No subscription. No middleman.

This is Entrepreneurship & Job Creation in practice: new income streams for voice contributors, new capabilities for AI builders, and a business that operates itself.

VOISSS is live. The contracts are on Base Mainnet. The API is serving requests. And the AI is running the show.

**Final text overlay:** VOISSS — A voice marketplace, run by AI agents.  
**URL:** voisss.netlify.app  
**GitHub:** github.com/thisyearnofear/VOISSS"

---

## Production Notes

| Element | Detail |
|---|---|
| Screen recording tool | OBS or Loom at 1920×1080 |
| Audio | Clean microphone, no background music during voiceover |
| Cuts | Jump cuts between demo sections — no transitions needed |
| Text overlays | Minimal — labels for contract addresses, API endpoints, prices |
| Contract addresses | Show on Basescan, highlight in yellow box |
| Final frame | Hold for 3 seconds with URL and GitHub |
| Captions | Burned-in captions recommended for accessibility |

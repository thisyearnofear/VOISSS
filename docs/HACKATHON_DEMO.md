# OWS Hackathon Demo Script

**Project:** VOISSS - Voice-as-a-Service for AI Agents  
**Track:** Track 3 - Pay-Per-Call Services & API Monetization  
**Date:** April 3, 2026  
**Duration:** 5 minutes

---

## 🎯 Demo Overview

**Pitch:** "Voice-as-a-Service for AI Agents - No accounts, no API keys, just an OWS wallet and instant voice generation across 9 chains"

**Key Message:** We're not building a hackathon prototype. We're adding OWS to a production system that already solves a real problem for AI agents.

---

## 📋 Pre-Demo Checklist

- [ ] Development server running (`pnpm dev`)
- [ ] Dashboard open at `http://localhost:3000/dashboard/hackathon`
- [ ] Test agent script ready (`scripts/test-ows-agent.ts`)
- [ ] Terminal windows arranged (dashboard + test agent)
- [ ] Browser dev tools open (Network tab)
- [ ] Example wallet address ready
- [ ] Audio player ready for generated voice

---

## 🎬 Demo Script (5 Minutes)

### Minute 1: Problem Statement (30 seconds)

**Say:**
> "AI agents need voices to run businesses - customer service bots, AI companions, virtual assistants. But current APIs require accounts, API keys, and subscriptions. What if agents could just pay with their wallet?"

**Show:**
- Existing voice APIs (screenshot of typical API key setup)
- Complexity of traditional onboarding

**Transition:**
> "That's where VOISSS comes in."

---

### Minute 2: Solution Overview (45 seconds)

**Say:**
> "VOISSS is a pay-per-call voice API powered by OWS. No accounts, no keys - just a wallet and an HTTP request. Works across 9 chains."

**Show:**
- Architecture diagram (from docs)
- Supported chains list
- Simple API call example

**Key Points:**
- Multi-chain from day one (Base, Arbitrum, Optimism, Polygon, Solana, etc.)
- Chain-specific pricing (0.85x-1.1x based on gas costs)
- Production-ready (already live at voisss.netlify.app)

**Transition:**
> "Let me show you how it works."

---

### Minute 3: Live Demo - API Flow (90 seconds)

**Step 1: Show Dashboard (15 seconds)**

**Say:**
> "Here's our real-time dashboard showing multi-chain activity."

**Show:**
- Dashboard at `/dashboard/hackathon`
- Current metrics (agents, requests, revenue)
- Chain distribution
- Live activity feed

**Step 2: Make API Request (30 seconds)**

**Say:**
> "Let's simulate an AI agent making a voice generation request on Base."

**Do:**
```bash
# In terminal
export AGENT_PRIVATE_KEY=0x...
export OWS_CHAIN=eip155:8453
ts-node scripts/test-ows-agent.ts
```

**Show:**
- Terminal output showing OWS wallet detection
- 402 Payment Required response
- Payment requirements with chain-specific details

**Step 3: Explain Payment Flow (30 seconds)**

**Say:**
> "The agent receives payment requirements for Base. In production, it would sign with its OWS wallet and retry. The payment is verified on-chain, and the voice is generated."

**Show:**
- Payment requirements JSON
- Chain-specific pricing (Base 1.0x)
- x402 payment structure

**Step 4: Show Dashboard Update (15 seconds)**

**Say:**
> "Watch the dashboard update in real-time."

**Show:**
- Dashboard refreshing (5-second poll)
- New activity in live feed
- Chain stats updating
- Agent appearing in leaderboard

---

### Minute 4: Multi-Chain Magic (60 seconds)

**Step 1: Switch Chains (20 seconds)**

**Say:**
> "Now let's try the same request on Arbitrum, which has lower gas costs."

**Do:**
```bash
export OWS_CHAIN=eip155:42161
ts-node scripts/test-ows-agent.ts
```

**Show:**
- Different chain ID in request
- Adjusted pricing (0.95x multiplier)
- Same API, different chain

**Step 2: Compare Chains (20 seconds)**

**Say:**
> "Notice the pricing difference. Arbitrum is 5% cheaper due to lower gas costs. Agents can choose the most cost-effective chain."

**Show:**
- Dashboard showing both chains
- Revenue distribution
- Chain-specific pricing

**Step 3: Highlight Benefits (20 seconds)**

**Say:**
> "This is the power of OWS - one API, nine chains, automatic pricing optimization. Agents can pay from any chain they're already on."

**Show:**
- Chain distribution chart
- Multiple chains active
- Seamless multi-chain support

---

### Minute 5: Why This Matters (30 seconds)

**Say:**
> "This enables the autonomous agent economy. Agents can discover our API, pay with their wallet, and start generating voices - no human in the loop. And we're not a prototype - we're production-ready with real users."

**Key Points:**
1. **Production System**: Live at voisss.netlify.app
2. **Real Infrastructure**: x402 payments working, just added OWS
3. **Proven Use Case**: AI agents need voices, we provide them
4. **Multi-Chain Native**: OWS enables payment from any chain
5. **Zero Friction**: No accounts, no API keys, just wallet

**Show:**
- Final dashboard state
- Multiple chains active
- Real-time activity
- Professional UI

**Closing:**
> "VOISSS - Voice-as-a-Service for the autonomous agent economy. Built on OWS, ready today."

---

## 🎨 Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. Problem: Complex API onboarding                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. Solution: OWS wallet + HTTP request                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. Demo: Live API call with OWS wallet                 │
│     - Show 402 Payment Required                         │
│     - Show chain-specific pricing                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. Dashboard: Real-time multi-chain activity           │
│     - Chain distribution                                │
│     - Live activity feed                                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  5. Multi-Chain: Same API, different chains             │
│     - Base vs Arbitrum pricing                          │
│     - Automatic optimization                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  6. Impact: Enables autonomous agent economy            │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Key Talking Points

### What Makes This Special

1. **Production-Ready**: Not a hackathon prototype
   - Live at voisss.netlify.app
   - Real users, real payments
   - 80% already built, 20% added for OWS

2. **Real Problem**: AI agents need voices
   - Customer service bots
   - AI companions
   - Virtual assistants
   - Gaming NPCs

3. **Multi-Chain Native**: OWS enables true multi-chain
   - 9 chains supported
   - Chain-specific pricing
   - Automatic optimization

4. **Zero Friction**: No accounts, no API keys
   - Just wallet + HTTP request
   - Instant onboarding
   - Pay-per-use

5. **Scalable**: Built for production
   - Rate limiting
   - Security layers
   - Event tracking
   - Analytics

### Competitive Advantages

- ✅ Production system (not prototype)
- ✅ Real x402 integration
- ✅ Multi-chain from day one
- ✅ Backward compatible
- ✅ Comprehensive docs
- ✅ Professional dashboard
- ✅ Real-time analytics

---

## 🎤 Q&A Preparation

### Expected Questions

**Q: How do you handle payment verification across different chains?**

A: For EVM chains, we use the existing x402 infrastructure with EIP-712 signatures. For non-EVM chains like Solana, we've built the structure and will verify transactions via RPC. The beauty of OWS is it provides a unified wallet interface, so we can add chain-specific verification without changing the API.

**Q: What's the pricing model?**

A: Base pricing is $0.000001 per character (1 USDC wei). We apply chain-specific multipliers based on gas costs - Solana is 0.85x (cheapest), Ethereum is 1.1x (most expensive). Agents can choose the most cost-effective chain for their needs.

**Q: How does this compare to traditional voice APIs?**

A: Traditional APIs require account creation, API key management, and often subscriptions. With VOISSS + OWS, agents just need a wallet. They discover the API, make a request, pay with their wallet, and get the voice - no human in the loop.

**Q: Is this actually being used?**

A: Yes! VOISSS is live at voisss.netlify.app with real users. We added OWS support for this hackathon, but the core voice generation and x402 payments were already working. This is a production system, not a prototype.

**Q: What chains do you support?**

A: We support 9 chains via OWS: Ethereum, Base, Arbitrum, Optimism, Polygon (EVM), plus Solana, Cosmos, TON, and XRP Ledger (structure ready, verification in progress). EVM chains are fully functional today.

**Q: How do you prevent abuse?**

A: We have multiple security layers: agent verification (reverse CAPTCHA), rate limiting by tier, security scoring, and payment verification. Agents build reputation over time, which unlocks higher rate limits.

---

## 📊 Demo Metrics to Highlight

- **Multi-Chain Support**: 9 chains (5 EVM fully working)
- **Zero Friction**: No account creation, just wallet
- **Real Usage**: Production system with real traffic
- **Cost Efficiency**: $0.000001/char vs traditional API pricing
- **Speed**: Sub-second payment verification
- **Scalability**: Rate limiting, security, analytics built-in

---

## 🚨 Backup Plans

### If Live Demo Fails

1. **Show Pre-Recorded Video**: Have a backup video of the demo
2. **Walk Through Code**: Show the implementation instead
3. **Use Screenshots**: Pre-captured dashboard states
4. **Explain Architecture**: Focus on technical design

### If Dashboard Has No Data

1. **Run Test Agent**: Generate data on the fly
2. **Show Mock Data**: Explain what it would look like
3. **Focus on Code**: Show the implementation quality

### If Network Issues

1. **Use Localhost**: Demo on local development server
2. **Show Documentation**: Walk through integration guide
3. **Explain Flow**: Use diagrams instead of live demo

---

## 📸 Screenshots to Prepare

1. Dashboard with multi-chain activity
2. API request/response flow
3. Payment requirements JSON
4. Chain distribution chart
5. Agent leaderboard
6. Live activity feed
7. Code examples (Python, JavaScript)
8. Architecture diagram

---

## 🎯 Success Criteria

**Demo is successful if judges understand:**

1. ✅ VOISSS solves a real problem (agents need voices)
2. ✅ OWS enables multi-chain payments seamlessly
3. ✅ System is production-ready (not a prototype)
4. ✅ Zero friction for agents (no accounts/keys)
5. ✅ Multi-chain support is native (not bolted on)

**Bonus points if they see:**

- Professional dashboard with real-time updates
- Clean, well-documented code
- Comprehensive integration guide
- Backward compatibility with existing x402
- Scalable architecture

---

## 🏆 Closing Statement

> "VOISSS is more than a hackathon project - it's a production system that's already solving a real problem. By adding OWS, we've made it truly multi-chain and agent-native. No accounts, no API keys, just a wallet and instant voice generation across 9 chains. This is what the autonomous agent economy looks like. Thank you."

---

**Demo Preparation Time:** 30 minutes  
**Demo Duration:** 5 minutes  
**Q&A Buffer:** 5 minutes  

**Total Time:** 40 minutes to prepare, 10 minutes to present

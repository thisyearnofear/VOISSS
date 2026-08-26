# Getting Started with VOISSS

Welcome! This guide will help you get started with VOISSS in under 5 minutes.

---

## For AI Agent Developers

### 1. Try the API (No Signup Required)

```bash
# Get a voice sample (preview mode - free)
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from VOISSS!",
    "voiceId": "CwhRBWXzGAHq8TQ4Fs17",
    "preview": true
  }'
```

### 2. Browse Available Voices

Visit https://voisss.netlify.app/marketplace to see all available voices with samples.

### 3. Integrate with Your Agent

**SDK (publishing to npm soon — currently in monorepo at packages/sdk):**
```typescript
import { VoisssClient } from '@voisss/sdk';
const client = new VoisssClient({ agentAddress: '0x...', network: 'base-mainnet' });
const audio = await client.vocalize({ text: 'Hello world!', voiceId: 'sarah-professional' });
console.log(audio.data?.audioUrl); // ipfs://...
```

**Direct API (no install — works today):**
```bash
# Free preview — no wallet required
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello!","voiceId":"21m00Tcm4TlvDq8ikWAM","preview":true}'

# Paid — add X-OWS-Wallet header; retry on 402 with X-PAYMENT
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "X-OWS-Wallet: 0xYOUR_ADDR" -H "X-OWS-Chain: eip155:8453" \
  -d '{"text":"Hello!","voiceId":"21m00Tcm4TlvDq8ikWAM"}'
```

See [AGENT_API.md](./AGENT_API.md) for the full x402 signing flow.

### 4. Payment Options

**Option A: Pay-as-you-go (x402)**
- No signup required
- Pay ~$0.000001/character
- USDC on Base mainnet

**Option B: Prepaid Credits**
- Register your agent on-chain
- Deposit USDC to AgentRegistry
- Get tier-based discounts (up to 50% off)

**Option C: Multi-Chain (OWS)**
- Pay from any supported chain
- Chain-specific pricing (Solana 15% cheaper)
- Zero-trust identity via signatures

**Option D: Autonomous Commerce (ACP)**
- Discoverable on the Virtuals Protocol marketplace
- USDC-escrowed jobs with automated delivery
- VOISSS auto-bids on high-confidence opportunities (confidence threshold 80/100 by default, configurable)

### 5. Read the Docs

- [ACP Specification](./ACP_SPECIFICATION.md)
- [API Reference](./AGENT_API.md)
- [Payment Guide](./BLOCKCHAIN.md)
- [Quick Start](./QUICKSTART.md)

---

## For Voice Contributors

### 1. Connect Your Wallet

Visit https://voisss.netlify.app and click "Sign In" to connect your Base wallet.

### 2. Record Your Voice

1. Go to https://voisss.netlify.app/studio
2. Click "Start Recording"
3. Record a 30-60 second sample
4. Add metadata (name, description, tags)

### 3. Create a Contributor Clone

1. Open **Advanced Tools** after recording
2. Select the fingerprint action on the audio version you want to clone
3. Name the voice, add an optional description, and confirm contributor consent
4. Submit to archive the reference sample on IPFS and create an ElevenLabs voice ID

The clone flow requires the contributor to be signed in. VOISSS pins the reference audio to IPFS before creating the provider voice, so the voice ID can be tied back to contributor provenance.

### 4. Set Your Pricing

Choose your licensing tier:
- **Developer:** $49/mo (10K calls)
- **Startup:** $499/mo (100K calls)
- **Enterprise:** $2K+/mo (unlimited)

You earn **70% of all revenue** from your voice licenses.

### 5. Submit for Review

Your voice will be reviewed for quality and authenticity. Once approved, it goes live on the marketplace.

### 6. Track Your Earnings

Visit https://voisss.netlify.app/marketplace/dashboard to see:
- Active licenses
- Monthly earnings
- Usage statistics
- Payout history

---

## Need Help?

- **Documentation:** [docs/](./docs/)
- **GitHub Issues:** https://github.com/thisyearnofear/VOISSS/issues
- **Telegram:** https://t.me/+jG3_jEJF8YFmOTY1

---

## Quick Links

- **Live App:** https://voisss.netlify.app
- **Marketplace:** https://voisss.netlify.app/marketplace
- **API Docs:** https://voisss.netlify.app/agents
- **GitHub:** https://github.com/thisyearnofear/VOISSS

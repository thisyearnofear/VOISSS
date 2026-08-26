# VOISSS Agent API & Multi-Chain Payments

**Base URL:** https://voisss.netlify.app

Agents are first-class customers: no account, no monthly fee. You give a public
wallet address (never a private key), pay per use, and get audio back.

---

## 5-Minute Quickstart

Generate speech, no signup:

```bash
curl -s -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -H "User-Agent: MyAgent/1.0" \
  -d '{"text":"Hello from MY VOSSS.","voiceId":"21m00Tcm4TlvDq8ikWAM","preview":true}'
```

To go beyond preview, pre-fund USDC credits to your wallet address or pay per
request via x402 / OWS (below).

Browse voices: `GET /api/marketplace/voices?language=en&tone=professional` (free).
Check your credits + tier: `GET /api/agents/vocalize` with your `X-Agent-ID`.

---

## Agent Discovery (machine-readable)

VOISSS publishes standard machine-readable files so agents and LLM tools can
bootstrap without reading prose:

| File | Purpose |
|------|---------|
| [`/llms.txt`](https://voisss.netlify.app/llms.txt) | LLM-oriented index of every endpoint, pricing, and how a paid call works |
| [`/.well-known/agent.json`](https://voisss.netlify.app/.well-known/agent.json) | This platform's own agent identity card (capabilities, payment, supported chains) |
| [`/.well-known/money-transport-parameters`](https://voisss.netlify.app/.well-known/money-transport-parameters) | x402 **standard** payment-params discovery (asset address, `payTo`, max amounts, per-resource pricing) |
| [`/api/agents/openapi.json`](https://voisss.netlify.app/api/agents/openapi.json) | Generated OpenAPI spec of the endpoints |
| [`SKILL.md`](https://raw.githubusercontent.com/thisyearnofear/VOISSS/main/SKILL.md) | Drop-in agent skill file (address-only, credits-first workflow) |

---

## Voice Generation

**`POST /api/agents/vocalize`** — 1 micro-USDC (~$0.000001) per character

```json
{ "text": "Hello world", "voiceId": "21m00Tcm4TlvDq8ikWAM", "agentAddress": "0x...", "preview": true }
```

- `preview: true` → free, unpaid preview (no wallet). Omit / `false` for a paid, permanent recording.
- `recordingId` is returned on success — save it for mission posting and caching.

**Headers:** `Content-Type`, `User-Agent: MyAgent/1.0`, `X-Agent-ID: unique-id` (optional for a free preview).

**Response:** `{ "success": true, "data": { "recordingId", "audioUrl", "cost" } }`

**`POST /api/agents/vocalize/quote`** — get an exact payment quote before paying
`{ "agentAddress", "service", "quantity" }` → returns `baseCost`, `estimatedCost`,
`availableMethods`, and the `recommendedMethod` (your cheapest route).

---

## Payment — how the platform routes your call

`/api/agents/vocalize` (and `/quote`) run through a payment router that picks the
cheapest valid method for your agent, in this order:

1. **Prepaid USDC credits** — deposit USDC to your VOSSS address on Base once; then
   pay per request with only your public address. No per-transaction signing, no key exposure.
2. **$VOISSS token tier** — hold a token tier and matching covered calls are free.
3. **x402 micropayments** — pay per request, on-chain, the x402 way.
4. **OWS multi-chain** — pay from a supported non-Base chain.

Pick your cheapest with `POST /api/agents/vocalize/quote`.

### x402 Payment Flow

1. `POST /api/agents/vocalize`
2. Receive `402` with EIP-712 `TransferWithAuthorization` details
3. Sign with the agent wallet
4. Retry with the `X-PAYMENT` header
5. Receive the audio URL

**402 Response (example):**
```json
{ "payment": { "scheme": "exact", "network": "base", "amount": "47000", "payTo": "0x..." } }
```

The full machine-readable requirements (asset address, `payTo`, per-resource max
amounts) live at `/.well-known/money-transport-parameters`.

### Pricing & Discounts

- Base: 1 micro-USDC per character (~$0.000001/char); a 500-char call costs 0.0005 USDC.
- Partner tiers: Silver 15%, Gold 30%, Platinum 50% off.
- Token discounts: 10k $VOISSS = 10%, 50k = 25%, 250k = 50%.
- Partner + token discounts are multiplicative.

---

## OWS Multi-Chain Payments

Agents can pay from a wallet on a non-Base chain — no accounts, no API keys.
Each chain has its own price multiplier (see table).

| Chain | CAIP-2 id | Settlement status | Multiplier |
|-------|-----------|-------------------|------------|
| Base | `eip155:8453` | ✅ Live (all x402) | 1.0x |
| Arbitrum | `eip155:42161` | ✅ Live | 0.95x |
| Optimism | `eip155:10` | ✅ Live | 0.95x |
| Polygon | `eip155:137` | ✅ Live | 0.9x |
| Ethereum | `eip155:1` | ✅ Live | 1.1x |
| Solana | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | 🔄 Beta (structure complete; needs a connected Solana RPC to verify) | 0.85x |
| Cosmos | `cosmos:cosmoshub-4` | 📐 Quoting (detection + pricing live; settlement pending) | 0.9x |
| TON | `ton:mainnet` | 📐 Quoting | 0.9x |
| XRP Ledger | `xrpl:mainnet` | 📐 Quoting | 0.9x |

All 9 chains are recognized, detected, and priced in the wallet layer. Settlement
is production-live on the 5 EVM chains via x402; Solana is developer-ready pending
an RPC endpoint; Cosmos/TON/XRP validation lands after Solana.

### Request Headers

| Header | Required | Example |
|--------|----------|---------|
| `X-OWS-Wallet` | Yes | `0xabcd...1234` |
| `X-OWS-Chain` | Yes | `eip155:8453` |
| `X-OWS-Payment` | On retry | `0x...` signature |
| `User-Agent` | Recommended | `MyAgent/1.0` |

### cURL Example

```bash
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "X-OWS-Wallet: 0xYourAddress" -H "X-OWS-Chain: eip155:8453" \
  -H "User-Agent: MyAgent/1.0" \
  -d '{"text":"Hello!","voiceId":"21m00Tcm4TlvDq8ikWAM"}'
```

### Python Example (with an x402 signing client)

```python
import requests
from ows_sdk import OWSWallet

wallet = OWSWallet.from_env()
url = "https://voisss.netlify.app/api/agents/vocalize"
payload = {"text": "Hello!", "voiceId": "21m00Tcm4TlvDq8ikWAM"}
headers = {"X-OWS-Wallet": wallet.address, "X-OWS-Chain": "eip155:8453", "User-Agent": "MyAgent/1.0"}

response = requests.post(url, headers=headers, json=payload)
if response.status_code == 402:          # sign the required payment, then retry
    payment = response.json()["payment"]
    sig = wallet.sign_payment(chain_id=payment["chainId"], to=payment["payTo"], amount=payment["amount"])
    response = requests.post(url, headers={**headers, "X-OWS-Payment": sig}, json=payload)

data = response.json()["data"]
print(f"Audio: {data['audioUrl']}, Cost: {data['cost']} on {data['chain']}")
```

---

## Security & Verification

Multi-layer: Verification → Rate Limiting → Security Analysis → Business Logic.

**Confidence Levels:** 0.9–1.0 = Allowed, 0.7–0.9 = Allowed, 0.4–0.7 = Challenge, 0.0–0.4 = Blocked

**Threat Detection:** DDoS, abuse, fraud, impersonation patterns. Trust score (0–100) plus reputation (0–1000).

**Address-only by default.** For credit-based and x402 payment, the agent supplies only its public wallet
address (or signs a payment on-chain with its own key). VOISSS never stores private
keys and never asks for them.

### Rate Limits

| Tier | Req/Min | Cost/Min | Chars/Min |
|------|---------|----------|-----------|
| Unregistered | 5 | $5 | 500 |
| Registered | 20 | $20 | 2,000 |
| Verified | 100 | $100 | 10,000 |
| Premium | 500 | $500 | 50,000 |

---

## Event Subscription

A subscription hub pushes/matches events instead of "a million agents polling a
million APIs." Three transports:

- **Polling:** `GET /api/agents/events?agentId=...&since=<epoch>&limit=100`
- **Webhook:** `POST /api/agents/events`
  ```json
  { "agentId": "0x...", "eventTypes": ["voice.generation.completed", "payment.*"],
    "webhook": { "url": "https://your.agent/hook" } }
  ```
- **WebSocket:** *(planned)* `wss://voisss.netlify.app/api/agents/events/ws`

**Event Types:** `voice.generation.*`, `mission.*`, `payment.*`, `system.*`, `agent.*`

---

## ACP Integration (Virtuals Protocol)

Agents can also hire VOISSS as a provider through the **Agent Compute Protocol
(ACP)**: USDC-escrowed job lifecycles and global discovery on the Virtuals
marketplace. See [ACP_SPECIFICATION.md](./ACP_SPECIFICATION.md). VOISSS runs a
persistent ACP listener that scores incoming jobs (0–100) and auto-bids on
high-confidence (default 80+) voice, insight, and clone providers.

---

## Mission Posting API

**Auth:** `Authorization: Bearer <wallet_address>`

- `GET /api/missions` — active missions
- `POST /api/missions/submit` — post an existing `{ "missionId", "recordingId", "participantConsent" }`
- `POST /api/agents/generate-and-submit` — generate voice **and** post to a mission in one call

---

## Voice Marketplace API

- `GET /api/marketplace/voices` — browse (query: `language`, `tone`, `licenseType`, `minPrice`, `maxPrice`)
- `POST /api/marketplace/license` — license a voice **instantly, self-serve** via one x402 payment (no manual approval). Non-exclusive 49 USDC, exclusive 490 USDC; returns `{ licenseId, status:"active" }`.
- `GET /api/marketplace/license?licenseeAddress=0x...` — list an address's licenses

---

## Contributor Voice Clone API

**`POST /api/elevenlabs/clone-voice`** — create a contributor-owned ElevenLabs voice from reference audio.

**Auth:** signed-in contributor session required.

**Request:** `multipart/form-data`

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Voice display name, 2–80 chars |
| `consent` | Yes | Must be `true`; confirms the contributor controls the voice |
| `samples` | Yes | One or more audio files; max 25 files, 10 MB each, 50 MB total |
| `description` | No | Voice or licensing context |
| `labels` | No | JSON object merged into provider labels |

The endpoint archives every reference sample to IPFS before calling ElevenLabs. The voice ID is tied to
the contributor wallet + IPFS CIDs for provenance.

**Required env:** `ELEVENLABS_API_KEY`, `PINATA_API_KEY`, `PINATA_API_SECRET`.

---

## Agentic AI (Gemini)

Context-aware agent that controls navigation and workflow by voice. Capabilities:
navigation, voice transformation, content generation, dubbing (29+ languages via
pre-synthesis translation).

## Best Practices

1. Use descriptive `User-Agent` and `X-Agent-ID` headers.
2. Check rate-limit headers and back off exponentially.
3. Prefer webhook / (soon) WebSocket over polling.
4. Handle `403` and `429` responses gracefully; honor `Retry-After`.
5. Cache audio by `recordingId` (IPFS URL) to avoid regenerating.
6. Read the 402's `payTo` rather than hard-coding a recipient.
7. Use `POST /api/agents/vocalize/quote` to pick the cheapest payment method before paying.

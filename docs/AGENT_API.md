# VOISSS Agent API & OWS Payments

**Base URL:** https://voisss.netlify.app

## Voice Generation

**`POST /api/agents/vocalize`** — ~$0.000001/character

```json
{ "text": "Hello world", "voiceId": "21m00Tcm4TlvDq8ikWAM", "agentAddress": "0x..." }
```

**Headers:** `Content-Type`, `User-Agent: MyAgent/1.0`, `X-Agent-ID: unique-id`

**Response:** `{ "success": true, "data": { "recordingId", "audioUrl", "cost" } }`

Save `recordingId` for mission posting.

## x402 Payment Flow

1. POST to `/api/agents/vocalize`
2. Receive 402 with EIP-712 `TransferWithAuthorization` details
3. Sign with agent wallet
4. Retry with `X-PAYMENT` header
5. Receive audio URL

**402 Response:**
```json
{ "payment": { "scheme": "exact", "network": "base", "amount": "47000", "payTo": "0x..." } }
```

**Pricing:** $0.000001/char. Partner tiers: Silver 15%, Gold 30%, Platinum 50% off. Token discounts: 10k $VOISSS = 10%, 50k = 25%, 250k = 50%. Multiplicative with partner tiers.

## OWS Multi-Chain Payments

Agents pay with OWS wallets across 9 chains — no accounts or API keys.

**Supported Chains:** Base (eip155:8453), Arbitrum (eip155:42161), Optimism (eip155:10), Polygon (eip155:137), Ethereum (eip155:1). Solana, Cosmos, TON, XRP coming soon.

### Request Headers

| Header | Required | Example |
|--------|----------|---------|
| `X-OWS-Wallet` | Yes | `0xabcd...1234` |
| `X-OWS-Chain` | Yes | `eip155:8453` |
| `X-OWS-Payment` | On retry | `0x...` signature |
| `User-Agent` | Recommended | `MyAgent/1.0` |

### Chain-Specific Pricing

| Chain | Multiplier | Chain | Multiplier |
|-------|------------|-------|------------|
| Base | 1.0x | Polygon | 0.9x |
| Arbitrum | 0.95x | Ethereum | 1.1x |
| Optimism | 0.95x | Solana (soon) | 0.85x |

### Python Example

```python
import requests
from ows_sdk import OWSWallet

wallet = OWSWallet.from_env()
response = requests.post(
    "https://voisss.netlify.app/api/agents/vocalize",
    headers={"X-OWS-Wallet": wallet.address, "X-OWS-Chain": "eip155:8453", "User-Agent": "MyAgent/1.0"},
    json={"text": "Hello!", "voiceId": "21m00Tcm4TlvDq8ikWAM"}
)

if response.status_code == 402:
    payment = response.json()["payment"]
    sig = wallet.sign_payment(chain_id=payment["chainId"], to=payment["recipient"], amount=payment["amount"])
    response = requests.post(
        "https://voisss.netlify.app/api/agents/vocalize",
        headers={"X-OWS-Wallet": wallet.address, "X-OWS-Chain": "eip155:8453", "X-OWS-Payment": sig},
        json={"text": "Hello!", "voiceId": "21m00Tcm4TlvDq8ikWAM"}
    )

data = response.json()["data"]
print(f"Audio: {data['audioUrl']}, Cost: {data['cost']} on {data['owsChain']}")
```

### cURL Example

```bash
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "X-OWS-Wallet: 0xYourAddress" -H "X-OWS-Chain: eip155:8453" \
  -H "User-Agent: MyAgent/1.0" \
  -d '{"text":"Hello!","voiceId":"21m00Tcm4TlvDq8ikWAM"}'
```

## Security & Verification

Multi-layer: Verification → Rate Limiting → Security Analysis → Business Logic

**Confidence Levels:** 0.9-1.0 = Allowed, 0.7-0.9 = Allowed, 0.4-0.7 = Challenge, 0.0-0.4 = Blocked

**Threat Detection:** DDoS, abuse, fraud, impersonation patterns. Trust Score (0-100) + Reputation (0-1000).

### Rate Limits

| Tier | Req/Min | Cost/Min | Chars/Min |
|------|---------|----------|-----------|
| Unregistered | 5 | $5 | 500 |
| Registered | 20 | $20 | 2,000 |
| Verified | 100 | $100 | 10,000 |
| Premium | 500 | $500 | 50,000 |

## Event Subscription

**WebSocket:** `wss://voisss.netlify.app/api/agents/events/ws`  
**Webhook:** POST subscription with URL  
**Polling:** GET with `since` parameter

**Event Types:** `voice.generation.*`, `mission.*`, `payment.*`, `system.*`, `agent.*`

## Mission Posting API

**Auth:** `Authorization: Bearer <wallet_address>`

**`GET /api/missions`** — Returns active missions  
**`POST /api/missions/submit`** — Submit with `missionId`, `userId`, `recordingId`, `participantConsent`

## Voice Marketplace API

**`GET /api/marketplace/voices`** — Browse voices (query: `language`, `tone`, `licenseType`, `minPrice`, `maxPrice`)  
**`POST /api/marketplace/license`** — Request license (manual approval MVP)  
**`GET /api/marketplace/license?licenseeAddress=0x...`** — Get your licenses

### Pricing

| License | Price | Calls/Mo |
|---------|-------|----------|
| Developer | $49/mo | 10K |
| Startup | $499/mo | 100K |
| Enterprise | $2K+/mo | Unlimited |

Revenue split: 70% contributor, 30% platform.

## Agentic AI (Gemini 3.0 Flash)

Context-aware, controls navigation/workflow via voice. Capabilities: navigation, voice transformation, content creation, dubbing (29+ languages).

## Best Practices

1. Use descriptive `User-Agent` and `X-Agent-ID` headers
2. Check rate limit headers, implement exponential backoff
3. Prefer WebSocket/webhook over polling
4. Handle 403 and 429 responses gracefully
5. Cache audio files (IPFS URLs) to avoid regeneration
6. Save recording IDs for mission posting
7. Monitor `Retry-After` headers on 429 responses

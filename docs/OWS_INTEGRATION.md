# OWS Integration Guide - VOISSS Voice API

**Last Updated:** April 3, 2026  
**For:** OWS Hackathon Submission

Complete guide for AI agents to use VOISSS voice generation with OWS (Open Wallet Standard) multi-chain payments.

---

## 🎯 Overview

VOISSS now supports OWS wallets for multi-chain voice generation payments. Agents can pay with USDC on any supported chain using the x402 payment protocol.

**Supported Chains:**
- Base (eip155:8453) - Recommended
- Arbitrum (eip155:42161)
- Optimism (eip155:10)
- Polygon (eip155:137)
- Ethereum (eip155:1)
- Solana (coming soon)
- Cosmos (coming soon)
- TON (coming soon)
- XRP Ledger (coming soon)

---

## 🚀 Quick Start

### 1. Setup OWS Wallet

```bash
# Install MoonPay CLI (provides OWS wallet management)
npm install -g @moonpay/cli

# Create OWS wallet
mp wallet create

# Fund wallet with USDC on Base
mp fund --chain eip155:8453 --amount 10
```

### 2. Make Voice Generation Request

```bash
# Get your wallet address
WALLET_ADDRESS=$(mp wallet address)

# Request voice generation
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -H "X-OWS-Wallet: $WALLET_ADDRESS" \
  -H "X-OWS-Chain: eip155:8453" \
  -H "User-Agent: MyAgent/1.0" \
  -d '{
    "text": "Hello from an AI agent!",
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  }'
```

### 3. Handle 402 Payment Required

```bash
# Response will be 402 with payment details
# {
#   "payment": {
#     "chainId": "eip155:8453",
#     "amount": "100",
#     "recipient": "0x...",
#     "x402": { ... }
#   }
# }

# Sign and submit payment
mp sign-payment \
  --chain eip155:8453 \
  --to <recipient> \
  --amount <amount>

# Retry with payment proof
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "X-OWS-Wallet: $WALLET_ADDRESS" \
  -H "X-OWS-Chain: eip155:8453" \
  -H "X-OWS-Payment: <payment_signature>" \
  -d '{
    "text": "Hello from an AI agent!",
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  }'
```

---

## 📖 API Reference

### Request Headers

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `X-OWS-Wallet` | Yes | Wallet address | `0xabcd...1234` |
| `X-OWS-Chain` | Yes | CAIP-2 chain identifier | `eip155:8453` |
| `X-OWS-Account` | No | CAIP-10 account identifier | `eip155:8453:0xabcd...1234` |
| `X-OWS-Payment` | No | Payment signature (on retry) | `0x...` |
| `User-Agent` | Recommended | Agent identifier | `MyAgent/1.0` |

### Request Body

```typescript
{
  text: string;           // Text to convert to speech
  voiceId: string;        // ElevenLabs voice ID
  agentAddress?: string;  // Optional (uses X-OWS-Wallet if not provided)
}
```

### Response (402 Payment Required)

```typescript
{
  error: "Payment Required",
  message: string,        // Human-readable instructions
  payment: {
    chainId: string;      // CAIP-2 chain ID
    chainName: string;    // Human-readable chain name
    chainType: string;    // "evm", "solana", etc.
    amount: string;       // USDC wei
    currency: "USDC",
    recipient: string;    // Chain-specific recipient address
    description: string;  // Payment description
    x402?: {              // x402 requirements (EVM chains only)
      // Standard x402 payment structure
    }
  }
}
```

### Response (200 Success)

```typescript
{
  success: true,
  data: {
    audioUrl: string;           // IPFS URL to audio file
    contentHash: string;        // SHA-256 hash
    cost: string;               // Human-readable USDC
    costWei: string;            // USDC wei
    characterCount: number;
    paymentMethod: string;      // "ows-evm", "ows-solana", etc.
    recordingId: string;
    ipfsHash?: string;
    txHash?: string;            // Payment transaction hash
    owsChain?: string;          // Chain name
    owsChainId?: string;        // CAIP-2 chain ID
    owsChainType?: string;      // Chain type
  }
}
```

---

## 💰 Pricing

### Base Pricing
- **$0.000001 per character** (1 USDC wei per character)
- Example: 1000 characters = $0.001 USDC

### Chain-Specific Adjustments

| Chain | Multiplier | Reason |
|-------|------------|--------|
| Base | 1.0x | Base pricing |
| Arbitrum | 0.95x | Lower gas costs |
| Optimism | 0.95x | Lower gas costs |
| Polygon | 0.9x | Very low gas costs |
| Ethereum | 1.1x | Higher gas costs |
| Solana | 0.85x | Extremely low costs |

### Discounts

Tier-based discounts apply automatically:
- **Basic** (10k+ $VOISSS): 10% off
- **Pro** (50k+ $VOISSS): 25% off
- **Premium** (250k+ $VOISSS): 50% off

---

## 🔧 Code Examples

### Python

```python
import os
import requests
from ows_sdk import OWSWallet

# Load OWS wallet
wallet = OWSWallet.from_env()  # Reads from ~/.ows/
chain_id = "eip155:8453"  # Base

# Request voice generation
response = requests.post(
    "https://voisss.netlify.app/api/agents/vocalize",
    headers={
        "Content-Type": "application/json",
        "X-OWS-Wallet": wallet.address,
        "X-OWS-Chain": chain_id,
        "User-Agent": "MyPythonAgent/1.0",
    },
    json={
        "text": "Hello from Python!",
        "voiceId": "21m00Tcm4TlvDq8ikWAM",
    }
)

if response.status_code == 402:
    # Payment required
    payment_data = response.json()["payment"]
    
    # Sign payment with OWS wallet
    payment_sig = wallet.sign_payment(
        chain_id=payment_data["chainId"],
        to=payment_data["recipient"],
        amount=payment_data["amount"],
    )
    
    # Retry with payment
    response = requests.post(
        "https://voisss.netlify.app/api/agents/vocalize",
        headers={
            "X-OWS-Wallet": wallet.address,
            "X-OWS-Chain": chain_id,
            "X-OWS-Payment": payment_sig,
        },
        json={
            "text": "Hello from Python!",
            "voiceId": "21m00Tcm4TlvDq8ikWAM",
        }
    )

if response.status_code == 200:
    data = response.json()["data"]
    print(f"✅ Voice generated: {data['audioUrl']}")
    print(f"💰 Cost: {data['cost']} on {data['owsChain']}")
```

### JavaScript/TypeScript

```typescript
import { OWSWallet } from '@moonpay/ows-wallet';

const wallet = OWSWallet.fromEnv(); // Reads from ~/.ows/
const chainId = 'eip155:8453'; // Base

async function generateVoice(text: string) {
  // Initial request
  let response = await fetch('https://voisss.netlify.app/api/agents/vocalize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-OWS-Wallet': wallet.address,
      'X-OWS-Chain': chainId,
      'User-Agent': 'MyJSAgent/1.0',
    },
    body: JSON.stringify({
      text,
      voiceId: '21m00Tcm4TlvDq8ikWAM',
    }),
  });

  if (response.status === 402) {
    // Payment required
    const { payment } = await response.json();
    
    // Sign payment
    const paymentSig = await wallet.signPayment({
      chainId: payment.chainId,
      to: payment.recipient,
      amount: payment.amount,
    });
    
    // Retry with payment
    response = await fetch('https://voisss.netlify.app/api/agents/vocalize', {
      method: 'POST',
      headers: {
        'X-OWS-Wallet': wallet.address,
        'X-OWS-Chain': chainId,
        'X-OWS-Payment': paymentSig,
      },
      body: JSON.stringify({
        text,
        voiceId: '21m00Tcm4TlvDq8ikWAM',
      }),
    });
  }

  const { data } = await response.json();
  console.log(`✅ Voice generated: ${data.audioUrl}`);
  console.log(`💰 Cost: ${data.cost} on ${data.owsChain}`);
  
  return data.audioUrl;
}
```

### cURL

```bash
#!/bin/bash

WALLET_ADDRESS="0xYourWalletAddress"
CHAIN_ID="eip155:8453"
TEXT="Hello from cURL!"

# Step 1: Request voice generation
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -H "X-OWS-Wallet: $WALLET_ADDRESS" \
  -H "X-OWS-Chain: $CHAIN_ID" \
  -d "{\"text\":\"$TEXT\",\"voiceId\":\"21m00Tcm4TlvDq8ikWAM\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "402" ]; then
  echo "💳 Payment required"
  
  # Extract payment details
  AMOUNT=$(echo "$BODY" | jq -r '.payment.amount')
  RECIPIENT=$(echo "$BODY" | jq -r '.payment.recipient')
  
  echo "   Amount: $AMOUNT USDC wei"
  echo "   Recipient: $RECIPIENT"
  
  # Sign payment (using MoonPay CLI)
  PAYMENT_SIG=$(mp sign-payment --chain $CHAIN_ID --to $RECIPIENT --amount $AMOUNT)
  
  # Step 2: Retry with payment
  curl -X POST https://voisss.netlify.app/api/agents/vocalize \
    -H "X-OWS-Wallet: $WALLET_ADDRESS" \
    -H "X-OWS-Chain: $CHAIN_ID" \
    -H "X-OWS-Payment: $PAYMENT_SIG" \
    -d "{\"text\":\"$TEXT\",\"voiceId\":\"21m00Tcm4TlvDq8ikWAM\"}"
fi
```

---

## 🧪 Testing

### Local Testing

```bash
# Start local development server
cd apps/web
pnpm dev

# Run OWS test agent
AGENT_PRIVATE_KEY=0x... ts-node scripts/test-ows-agent.ts

# Test different chains
OWS_CHAIN=eip155:42161 ts-node scripts/test-ows-agent.ts  # Arbitrum
OWS_CHAIN=eip155:10 ts-node scripts/test-ows-agent.ts     # Optimism
OWS_CHAIN=eip155:137 ts-node scripts/test-ows-agent.ts    # Polygon
```

### Production Testing

```bash
# Test against production API
API_URL=https://voisss.netlify.app \
AGENT_PRIVATE_KEY=0x... \
ts-node scripts/test-ows-agent.ts
```

---

## 🔐 Security

### Wallet Security
- OWS wallets are stored locally in `~/.ows/`
- Private keys are encrypted with AES-256-GCM
- Keys never leave your machine
- No custodial access

### Payment Security
- All payments use x402 protocol
- EIP-712 signatures for EVM chains
- Chain-specific verification
- Transaction hashes recorded on-chain

### Rate Limiting
- Tier-based limits (unregistered, registered, verified, premium)
- Per-agent tracking
- Automatic throttling
- Retry-After headers

---

## 🐛 Troubleshooting

### "Unsupported chain"
- Check chain ID format: `eip155:8453` (not just `8453`)
- Verify chain is in supported list
- Use Base (eip155:8453) for best compatibility

### "Invalid payment header"
- Ensure X-OWS-Payment contains valid signature
- Check signature format matches chain type
- Verify payment amount matches requirement

### "Payment verification failed"
- Confirm wallet has sufficient USDC balance
- Check recipient address matches requirement
- Verify transaction was confirmed on-chain

### "Rate limit exceeded"
- Wait for Retry-After duration
- Upgrade to higher tier for more capacity
- Check rate limit headers in response

---

## 📊 Monitoring

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1680000000
X-Payment-Required: OWS
X-Supported-Chains: eip155:8453,eip155:42161,...
```

### Analytics

Track your usage:
```bash
curl https://voisss.netlify.app/api/agents/vocalize?agentAddress=0x...
```

Returns:
- Credit balance
- Current tier
- Cost per character
- Available payment methods

---

## 🎯 Best Practices

1. **Use Base for lowest costs** - Base has optimal gas fees
2. **Cache audio files** - Store IPFS URLs to avoid regeneration
3. **Implement retry logic** - Handle 402 and 429 responses
4. **Monitor rate limits** - Check headers and adjust request rate
5. **Secure private keys** - Use OWS wallet encryption
6. **Log transactions** - Keep txHash for audit trail

---

## 🔗 Resources

- **OWS Docs**: https://docs.openwallet.sh
- **MoonPay CLI**: https://support.moonpay.com/en/articles/586583
- **x402 Protocol**: https://x402moon.club
- **VOISSS Docs**: https://voisss.netlify.app/docs
- **Support**: https://t.me/+jG3_jEJF8YFmOTY1

---

## 📝 License

MIT License - see [LICENSE](../LICENSE)

---

**Built for the OWS Hackathon - April 3, 2026** 🚀

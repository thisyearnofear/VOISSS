# VOISSS Blockchain Guide

**Last Updated:** February 2026

Essential guide to VOISSS blockchain integration, contracts, tokens, and payments.

---

## 📋 Overview

| Platform | Blockchain | Purpose | Status |
|----------|-----------|---------|--------|
| **Web** | Base Mainnet | Storage, gasless txns, agent registry | ✅ Production |
| **Mobile** | Scroll Sepolia | VRF randomness, privacy | 🔄 Development |
| **Flutter** | None | Serverpod backend | ✅ Live |

---

## 🔗 Active Blockchains

### Base Network (Web)

| Property | Value |
|----------|-------|
| **Chain ID** | 8453 |
| **RPC URL** | https://mainnet.base.org |
| **Explorer** | https://basescan.org |

### Scroll Network (Mobile)

| Property | Value |
|----------|-------|
| **Chain ID** | 534351 |
| **RPC URL** | https://sepolia-rpc.scroll.io/ |
| **Explorer** | https://sepolia.scrollscan.com |

---

## 📜 Smart Contracts

### Base Mainnet (Production)

| Contract | Address | Purpose |
|----------|---------|---------|
| **AgentRegistry** (v2) | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` | Agent registration, USDC credits |
| **ReputationRegistry** | `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127` | Agent reputation tracking |
| **VoiceRecords** | `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D` | Recording storage |
| **$VOISSS Token** | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` | Access tiers |
| **$PAPAJAMS Token** | `0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c` | Creator rewards |
| **USDC** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Payment token (6 decimals) |

### Scroll Sepolia (Development)

| Contract | Address | Purpose |
|----------|---------|---------|
| **ScrollVRF** | `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208` | Fair randomness |
| **ScrollPrivacy** | `0x0abD2343311985Fd1e0159CE39792483b908C03a` | Private storage with zk-proofs |

---

## 💰 Token Systems

### $VOISSS Token

**Contract:** `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07`  
**Decimals:** 18

**Holding Tiers:**
| Tier | Balance | Features |
|------|---------|----------|
| Freemium | 0 | 1 free transform/session |
| Basic | 10k+ | Unlimited transforms, dubbing |
| Pro | 50k+ | Priority, advanced voices |
| Premium | 250k+ | VIP Lane, creator tools |

**Burn Actions:**
- Video Export: 5k $VOISSS
- NFT Mint: 2k $VOISSS
- White-Label: 10k $VOISSS

### $PAPAJAMS Token

**Contract:** `0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c`  
**Decimals:** 18

**Creator Requirements:**
- Minimum: 1M tokens to create missions
- Rewards: 70% $PAPAJAMS, 30% $VOISSS

**Mission Rewards:**
- 50% submission, 30% quality, 20% featured

---

## 🏦 Agent Registry (v2.0.0)

**Contract:** `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c`

### Key Features

- USDC-based credit system (6 decimals)
- Atomic lock/unlock/confirm operations
- Service tiers with discounts
- x402 fallback when credits exhausted
- Reputation tracking

### Service Tiers

| Tier | $VOISSS Required | Discount |
|------|-----------------|----------|
| None | 0 | 0% |
| Bronze | 10k+ | 10% OFF |
| Silver | 50k+ | 25% OFF |
| Gold | 250k+ | 50% OFF |

### Key Functions

- `registerAgent(metadataURI, name, categories, x402Enabled)` → agentId
- `depositUSDC(amount)` - Add credits
- `withdrawUSDC(amount)` - Withdraw unused
- `deductCredits(agent, amount, serviceName)` - Service deduction
- `lockCredits(agent, amount)` - Atomic lock
- `unlockCredits(agent, amount)` - Release on failure
- `confirmDeduction(agent, amount)` - Confirm on success

### USDC Configuration

- **Contract:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Decimals:** 6
- **Min Deposit/Withdrawal:** 1 USDC

### Whitelisting

Whitelisted addresses get 100% discount (platform owners, system agents, beta testers).

---

## 💳 x402 Payment System

**Protocol:** EIP-712 `TransferWithAuthorization`  
**Cost:** ~$0.000001/character

### Payment Flow

1. **Request:** POST `/api/agents/vocalize`
2. **402 Response:** Receive payment details
3. **Sign:** EIP-712 authorization with agent wallet
4. **Retry:** Include `X-PAYMENT` header
5. **Success:** Receive audio URL

### 402 Response Format

```http
HTTP/1.1 402 Payment Required
X-PAYMENT-REQUIRED: {
  "scheme": "exact",
  "network": "base",
  "amount": "47000",
  "payTo": "0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c"
}
```

### Environment Setup

```bash
CDP_API_KEY_ID=your_key_id
CDP_API_KEY_SECRET=your_secret
X402_PAY_TO_ADDRESS=0xYourWallet
```

**Get CDP Keys:** https://portal.cdp.coinbase.com/projects/api-keys

### Testing

```bash
pnpm x402:debug check-env    # Verify config
pnpm x402:debug test-cdp     # Test connection
export TEST_AGENT_PRIVATE_KEY=0xKey
pnpm x402:test               # End-to-end test
```

---

## 🎯 Mission System

**Requirements:** 1M $PAPAJAMS minimum balance

### Lifecycle

1. Create Mission (auto-published)
2. Accept Submissions
3. Review & Approve
4. Distribute Rewards
5. Auto-Expire

### Reward Distribution

| Milestone | Percentage | Token |
|-----------|------------|-------|
| Submission | 50% | $PAPAJAMS |
| Quality Approval | 30% | $PAPAJAMS |
| Featured | 20% | $VOISSS |

---

## ⛽ Gasless Transactions

**Platform:** Web (Base Account SDK)

**How It Works:**
```
User Action → Sub Account → Spender Wallet (pays gas) → Base Network
```

**Benefits:**
- No wallet popups after setup
- Seamless user experience
- Spender wallet covers gas fees

**Configuration:**
```bash
NEXT_PUBLIC_SPENDER_ADDRESS=0xspender
SPENDER_PRIVATE_KEY=0xprivate_key
```

**Security:** Monitor spender wallet balance regularly.

---

## 🔒 Scroll Contracts

### ScrollVRF

**Address:** `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208`

**Functions:**
- `requestRandomness()` → requestId
- `getRandomness(requestId)` → random number
- `verifyRandomness(requestId)` → validity

### ScrollPrivacy

**Address:** `0x0abD2343311985Fd1e0159CE39792483b908C03a`

**Functions:**
- `storePrivateContent(contentHash)` - Encrypted storage
- `grantAccess(user, tokenId)` - Grant permissions
- `revokeAccess(user, tokenId)` - Revoke permissions
- `createShareLink(tokenId, expiry)` - Time-limited sharing

---

## 📊 Environment Variables

### Web Platform (Base)

```bash
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS=0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07
NEXT_PUBLIC_PAPAJAMS_TOKEN_ADDRESS=0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c
NEXT_PUBLIC_X402_VERSION=2
```

### Mobile Platform (Scroll)

```bash
EXPO_PUBLIC_SCROLL_VRF_ADDRESS=0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208
EXPO_PUBLIC_SCROLL_PRIVACY_ADDRESS=0x0abD2343311985Fd1e0159CE39792483b908C03a
EXPO_PUBLIC_SCROLL_CHAIN_ID=534351
EXPO_PUBLIC_SCROLL_RPC=https://sepolia-rpc.scroll.io/
```

---

## 🏛️ Legacy (Archived)

**Starknet:** Original Cairo contracts for Starknet Sepolia remain in repository for reference only (not deployed).

---

## 📚 Resources

- **[DOCS_OVERVIEW.md](./DOCS_OVERVIEW.md)** - Platform summary
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Setup
- **[AGENT_INTEGRATION.md](./AGENT_INTEGRATION.md)** - Agent API
- **Base Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Scroll Faucet:** https://sepolia.scroll.io/faucet

---

MIT License - see [LICENSE](../LICENSE)

# VOISSS Blockchain & Marketplace

## Active Blockchains

| Platform | Network | Chain ID | Status |
|----------|---------|----------|--------|
| Web | Base Mainnet | 8453 | ✅ Production |
| Mobile | Scroll Sepolia | 534351 | 🔄 Development |

## Smart Contracts (Base Mainnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| AgentRegistry (v2) | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` | Agent registration, USDC credits |
| ReputationRegistry | `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127` | Agent reputation tracking |
| VoiceRecords | `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D` | Recording storage |
| $VOISSS Token | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` | Access tiers |
| $PAPAJAMS Token | `0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c` | Creator rewards |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Payment token (6 decimals) |

## Token Systems

### $VOISSS — Access Tiers

| Tier | Balance | Features |
|------|---------|----------|
| Freemium | 0 | 1 free transform/session |
| Basic | 10k+ | Unlimited transforms, dubbing |
| Pro | 50k+ | Priority, advanced voices |
| Premium | 250k+ | VIP lane, creator tools |

**Burn Actions:** Video Export (5k), NFT Mint (2k), White-Label (10k)

### $PAPAJAMS — Creator Rewards

- Minimum 1M tokens to create missions
- Mission rewards: 50% submission, 30% quality, 20% featured
- Creator payout: 70% $PAPAJAMS, 30% $VOISSS

## Agent Registry (v2)

**USDC credit system** with atomic lock/unlock/confirm, service tiers, x402 fallback.

**Key Functions:** `registerAgent()`, `depositUSDC()`, `withdrawUSDC()`, `deductCredits()`, `lockCredits()`, `unlockCredits()`, `confirmDeduction()`

**Service Tiers:** None (0%), Bronze 10k+ (10% off), Silver 50k+ (25% off), Gold 250k+ (50% off)

## x402 Payment System

**Protocol:** EIP-712 `TransferWithAuthorization` on Base USDC  
**Cost:** ~$0.000001/character

**Flow:** Request → 402 Response → Sign EIP-712 → Retry with `X-PAYMENT` → Audio URL

**Setup:** Get CDP API keys at https://portal.cdp.coinbase.com, set `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `X402_PAY_TO_ADDRESS`

**Test:**
```bash
pnpm x402:debug check-env    # Verify config
export TEST_AGENT_PRIVATE_KEY=0xKey
pnpm x402:test               # End-to-end
```

## Voice License Marketplace

**Contract:** VoiceLicenseMarket.sol (deploying to Base Mainnet)

**Features:** USDC-based licensing, 70/30 revenue split (contributor/platform), exclusive and non-exclusive licenses, usage tracking, automatic royalty distribution.

**Key Functions:**
- `listVoice(voiceId, price, isExclusive)` — List voice
- `purchaseLicense(voiceId)` → licenseId — Buy with USDC
- `hasActiveLicense(voiceId, user)` → bool — Check status

**License Types:**
| Type | Behavior | Use Case |
|------|----------|----------|
| Non-Exclusive | Multiple agents can license | Affordable, common |
| Exclusive | Only one agent, auto-delists | Premium, unique identity |

**Pricing:**
| License | Price | Calls/Mo |
|---------|-------|----------|
| Developer | $49/mo | 10K |
| Startup | $499/mo | 100K |
| Enterprise | $2K+/mo | Unlimited |

**Revenue Flow:** Agent pays $49 → $34.30 to contributor (70%) → $14.70 to platform (30%)

**Deploy:**
```bash
pnpm deploy:marketplace          # Base Mainnet
pnpm deploy:marketplace:sepolia  # Base Sepolia
```

## Mission System

**Requirement:** 1M $PAPAJAMS minimum to create missions

**Lifecycle:** Create → Accept Submissions → Review → Distribute Rewards → Auto-Expire

**Reward Distribution:** 50% submission ($PAPAJAMS), 30% quality ($PAPAJAMS), 20% featured ($VOISSS)

## Gasless Transactions

**Platform:** Web via Base Account SDK  
**Flow:** User Action → Sub Account → Spender Wallet (pays gas) → Base Network

**Config:** `NEXT_PUBLIC_SPENDER_ADDRESS`, `SPENDER_PRIVATE_KEY`

## Scroll Contracts (Mobile — Development)

| Contract | Address | Purpose |
|----------|---------|---------|
| ScrollVRF | `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208` | Fair randomness |
| ScrollPrivacy | `0x0abD2343311985Fd1e0159CE39792483b908C03a` | Private zk-proof storage |

**Functions:** `requestRandomness()`, `storePrivateContent()`, `grantAccess()`, `revokeAccess()`, `createShareLink()`

## Environment Variables

### Web (Base)
```bash
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS=0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07
NEXT_PUBLIC_PAPAJAMS_TOKEN_ADDRESS=0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c
```

### Mobile (Scroll)
```bash
EXPO_PUBLIC_SCROLL_VRF_ADDRESS=0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208
EXPO_PUBLIC_SCROLL_PRIVACY_ADDRESS=0x0abD2343311985Fd1e0159CE39792483b908C03a
EXPO_PUBLIC_SCROLL_CHAIN_ID=534351
```

## Faucets

- **Base Sepolia:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Scroll Sepolia:** https://sepolia.scroll.io/faucet

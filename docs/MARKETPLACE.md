# Voice Marketplace Implementation

## Overview

B2B voice licensing marketplace where AI agents purchase authentic human voices from contributors.

**Status:** MVP Phase 1 - Manual approval flow  
**Target:** Week 1-3 validation

## Architecture

### Core Principles Applied

- ✅ **ENHANCEMENT FIRST**: Extends existing VoiceRecords, doesn't replace
- ✅ **CONSOLIDATION**: Reuses existing auth, payment, IPFS infrastructure
- ✅ **PREVENT BLOAT**: Minimal MVP features only
- ✅ **DRY**: Shares types/services with existing agent API
- ✅ **CLEAN**: Clear separation via `/marketplace` routes
- ✅ **MODULAR**: Can be disabled without affecting core platform
- ✅ **PERFORMANT**: Leverages existing caching and rate limiting
- ✅ **ORGANIZED**: Domain-driven structure under `/marketplace`

### File Structure

```
apps/web/
├── contracts/
│   └── VoiceLicenseMarket.sol          # Smart contract
├── src/
│   ├── app/
│   │   ├── marketplace/
│   │   │   ├── page.tsx                # Browse voices
│   │   │   └── dashboard/
│   │   │       └── page.tsx            # Contributor dashboard
│   │   └── api/
│   │       └── marketplace/
│   │           ├── voices/route.ts     # GET browse
│   │           ├── license/route.ts    # POST purchase, GET licenses
│   │           └── synthesize/route.ts # POST metered synthesis
│   ├── components/
│   │   └── marketplace/
│   │       └── VoiceCard.tsx           # Voice listing card
│   ├── contracts/
│   │   └── VoiceLicenseMarketABI.ts    # Contract ABI
│   ├── hooks/
│   │   └── useVoiceMarketplace.ts      # Contract interactions
│   └── lib/
│       └── marketplace-db.ts           # IndexedDB for client state
└── scripts/
    └── deploy-marketplace.ts           # Deployment script
```

## Smart Contract

### VoiceLicenseMarket.sol

**Features:**
- USDC-based licensing (6 decimals)
- 70/30 revenue split (contributor/platform)
- Exclusive and non-exclusive licenses
- Usage tracking
- Automatic royalty distribution

**Key Functions:**
```solidity
// Contributors
listVoice(voiceId, price, isExclusive)
delistVoice(voiceId)

// Licensees
purchaseLicense(voiceId) → licenseId
hasActiveLicense(voiceId, user) → bool

// Platform
reportUsage(licenseId, usageCount)
```

### Deployment

```bash
# Deploy to Base Mainnet
pnpm deploy:marketplace

# Deploy to Base Sepolia (testnet)
pnpm deploy:marketplace:sepolia

# Verify on BaseScan
npx hardhat verify --network base <ADDRESS> "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" "<TREASURY>"
```

**Environment Variables:**
```bash
NEXT_PUBLIC_VOICE_LICENSE_MARKET_ADDRESS=0x...
PLATFORM_TREASURY_ADDRESS=0x...  # Or uses NEXT_PUBLIC_SPENDER_ADDRESS
```

## API Routes

### GET /api/marketplace/voices

Browse available voice listings.

**Query Parameters:**
- `language`: Filter by language (e.g., "en-US")
- `tone`: Filter by tone (e.g., "professional")
- `licenseType`: "exclusive" or "non-exclusive"
- `minPrice`, `maxPrice`: Price range in USDC wei

**Response:**
```json
{
  "success": true,
  "data": {
    "voices": [...],
    "total": 10
  }
}
```

### POST /api/marketplace/license

Purchase a voice license (MVP: manual approval).

**Request:**
```json
{
  "voiceId": "voice_001",
  "licenseeAddress": "0x...",
  "licenseType": "non-exclusive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "licenseRequestId": "lic_req_...",
    "status": "pending_approval",
    "estimatedApprovalTime": "24-48 hours"
  }
}
```

### GET /api/marketplace/license?licenseeAddress=0x...

Get licenses for an address.

### POST /api/marketplace/synthesize

Metered voice synthesis (not yet implemented - use `/api/agents/vocalize` for now).

## UI Components

### Marketplace Browse (`/marketplace`)

- Voice grid with filters
- Preview audio samples
- License purchase flow
- CTA for contributors

### Contributor Dashboard (`/marketplace/dashboard`)

- Earnings overview
- Voice listings management
- Performance metrics
- List new voice button

### VoiceCard Component

Reusable card showing:
- Voice profile (tone, language, accent)
- Tags
- Stats (views, purchases, usage)
- Price
- Preview/License buttons

## Hooks

### useVoiceMarketplace()

Contract write operations:
```typescript
const { listVoice, delistVoice, purchaseLicense } = useVoiceMarketplace();

// List voice
await listVoice(voiceId, "49", false); // $49, non-exclusive

// Purchase license
await purchaseLicense(voiceId);
```

### useVoiceListing(voiceId)

Read listing details from contract.

### useHasLicense(voiceId, userAddress)

Check if user has active license.

### useUserLicense(voiceId, userAddress)

Get user's license ID.

### useLicenseDetails(licenseId)

Get full license details.

## MVP Implementation Status

### ✅ Completed (Current Phase)

- [x] Smart contract (VoiceLicenseMarket.sol)
- [x] AI Model Migration: Gemini 3.1 Pro + Venice AI Fallback
- [x] Humanity Certificate: AI-powered forensic audio verification
- [x] Zero-Management Indexing: On-demand onchain fetching (No DB required)
- [x] Full Lifecycle Studio Loop: Auto-listing voices after IPFS save
- [x] x402 Micropayments: Real-time licensing verification
- [x] Visual Voice Fingerprinting: Deterministic SVG waveforms

### 🔄 In Progress (Week 2-3)

- [ ] Deploy contract to Base Mainnet
- [ ] Connect UI to real data (currently mock)
- [ ] Implement manual approval workflow
- [ ] Email notifications for license requests
- [ ] Admin approval interface
- [ ] USDC approval flow in UI
- [ ] Audio preview playback
- [ ] Contributor onboarding flow

### 📋 Backlog (Week 4+)

- [ ] Automated license purchase (remove manual approval)
- [ ] Metered synthesis endpoint
- [ ] Usage analytics dashboards
- [ ] Voice quality approval queue
- [ ] Subscription licensing
- [ ] Advanced filtering
- [ ] Voice matching algorithm
- [ ] API key management

## Testing

### Local Development

```bash
# Start dev server
pnpm dev

# Visit marketplace
open http://localhost:4445/marketplace

# Visit contributor dashboard
open http://localhost:4445/marketplace/dashboard
```

### Contract Testing

```bash
# Deploy to testnet
pnpm deploy:marketplace:sepolia

# Test listing
# (Use Hardhat console or write test script)
```

### API Testing

```bash
# Browse voices
curl http://localhost:4445/api/marketplace/voices

# Request license
curl -X POST http://localhost:4445/api/marketplace/license \
  -H "Content-Type: application/json" \
  -d '{"voiceId":"voice_001","licenseeAddress":"0x...","licenseType":"non-exclusive"}'
```

## Pricing Model

| License Type | Price | Calls/Month | Best For |
|--------------|-------|-------------|----------|
| Developer | $49/mo | 10K | Non-commercial, testing |
| Startup | $499/mo | 100K | Category-exclusive |
| Enterprise | $2K+/mo | Unlimited | Fully exclusive |

**Revenue Split:** 70% contributor, 30% platform

## Go-to-Market

### Week 1-2: Validation

1. Deploy contract
2. Recruit 10 high-quality voices from existing users
3. Reach out to 50 AI agent companies
4. Get 3 LOIs (letters of intent)

### Week 3-4: Beta Launch

1. Onboard 5 beta customers
2. Manual approval for first licenses
3. Collect feedback
4. Iterate on UX

### Week 5-6: Public Launch

1. Automate purchase flow
2. Launch on AI builder communities
3. Publish case studies
4. Scale to 50 voices

## Success Metrics

### Month 1
- 10 voices listed
- 1 paying customer
- $500 MRR

### Month 3
- 50 voices listed
- 10 paying customers
- $3K MRR

### Month 6
- 200 voices listed
- 30 paying customers
- $10K MRR

## Next Steps

1. **Deploy Contract**
   ```bash
   pnpm deploy:marketplace
   ```

2. **Update Environment**
   ```bash
   echo "NEXT_PUBLIC_VOICE_LICENSE_MARKET_ADDRESS=0x..." >> .env.local
   ```

3. **Test Locally**
   - Visit `/marketplace`
   - Connect wallet
   - Test browse/filter

4. **Recruit First Voices**
   - Email existing VOISSS users
   - Offer $100/mo guarantee for first 20

5. **Find First Customers**
   - Direct outreach to 50 agent companies
   - Offer beta credits

## Support

- **GitHub Issues**: Bug reports
- **Telegram**: https://t.me/+jG3_jEJF8YFmOTY1
- **Docs**: See `/docs` directory

---

**Last Updated:** February 2026  
**Status:** MVP Phase 1 - Ready for deployment

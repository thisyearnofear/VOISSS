# VOISSS × Arkiv Network Integration

VOISSS uses **Arkiv Braga Testnet** as a decentralized data layer for voice insights, humanity verification certificates, and agent memory. This enables permanent, user-owned storage for AI-generated voice analysis.

**Network:** Braga Testnet (Chain ID: `60138453102`)  
**Explorer:** https://explorer.braga.hoodi.arkiv.network  

---

## Entity Schema

### VoiceInsight

Stores AI-generated voice analysis including emotional analysis, sentiment scores, and transcription metadata.

| Attribute | Type | Purpose |
|-----------|------|---------|
| `project` | string | `VOISSS_BRAGA_CHALLENGE_V1` |
| `entityType` | string | `VoiceInsight` |
| `ownerAddress` | string (lowercase) | `$owner` on-chain |
| `title` | string (max 100) | Insight title |
| `createdAt` | **number** | Enables `gt()` / `lt()` range queries |
| `content` | string | Voice analysis text |

### HumanityCertificate

Stores verification attestations linked to voice insights, proving human authenticity.

| Attribute | Type | Purpose |
|-----------|------|---------|
| `project` | string | `VOISSS_BRAGA_CHALLENGE_V1` |
| `entityType` | string | `HumanityCertificate` |
| `parentInsightId` | string | Links to parent VoiceInsight |
| `status` | string | `certain` / `uncertain` |
| `badge` | string | Verification badge |
| `createdAt` | **number** | Enables time-range queries |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/arkiv/save-insight` | Create a VoiceInsight entity |
| POST | `/api/arkiv/save-certificate` | Create a HumanityCertificate entity |
| POST | `/api/arkiv/save-batch` | Create both insight + certificate atomically with ownership transfer |
| GET | `/api/arkiv/query` | Query entities with combinable filters |
| GET | `/api/health` | Service status and configured features |

---

## Key Features

### 1. User Ownership
Server wallet creates entities, then transfers `$owner` to the user's wallet atomically via `mutateEntities` ownershipChanges. This means users (not VOISSS) control their data.

### 2. Batch Operations
`POST /api/arkiv/save-batch` creates an insight + certificate + ownership transfer in a single transaction.

### 3. Numeric Time Attributes
`createdAt` is stored as `Date.now()` (number, not string), enabling `gt()` / `lt()` range queries for time-based filtering.

### 4. Differentiated Expiration
- Working drafts: 30 days
- Archive insights: 365 days
- Certificates: 730 days

### 5. Idempotent Writes
Include the `Idempotency-Key` header to prevent duplicate entity creation.

### 6. Advanced Querying
Combinable query filters: `ownerAddress`, `entityType`, `createdAfter`, `createdBefore`, `searchTerm`, with cursor-based pagination.

### 7. Explorer Verification
Every entity links to the Arkiv Explorer at:
`https://explorer.braga.hoodi.arkiv.network/entity/{entityKey}`

---

## Quick Demo

### 1. Create an entity
```bash
curl -X POST https://voisss.netlify.app/api/arkiv/save-insight \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo123" \
  -d '{
    "title": "Voice Analysis Test",
    "ownerAddress": "YOUR_WALLET_ADDRESS",
    "content": "This is a test voice insight",
    "entityType": "VoiceInsight"
  }'
```

### 2. Query entities
```bash
curl "https://voisss.netlify.app/api/arkiv/query?entityType=VoiceInsight&limit=5"
```

### 3. Verify on Arkiv Explorer
Every response includes an `explorerUrl` linking to the Arkiv Explorer.

### 4. Batch create with ownership
```bash
curl -X POST https://voisss.netlify.app/api/arkiv/save-batch \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: batch-demo-1" \
  -d '{
    "insightTitle": "Podcast Analysis",
    "ownerAddress": "0xYourWallet",
    "content": "Analysis of podcast recording",
    "status": "certain",
    "badge": "verified"
  }'
```

---

## Health Check

```bash
curl https://voisss.netlify.app/api/health
```

Returns Arkiv configuration, explorer URL, and available features.

---

## Environment Variables

```bash
ARKIV_PRIVATE_KEY=            # Private key for Arkiv entity writes (Braga Testnet)
```

## Related Docs

- [Blockchain & Marketplace](./BLOCKCHAIN.md) — Smart contracts, tokens, and payments
- [Agent API Reference](./AGENT_API.md) — Voice generation and agent integration

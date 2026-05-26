# Web3 Database Builder Challenge — VOISSS Arkiv Submission

## Quick Demo (5 minutes)

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
Every response includes an `explorerUrl` linking to:
https://explorer.braga.hoodi.arkiv.network/entity/{entityKey}

---

## Entity Schema

### VoiceInsight
| Attribute | Type | Purpose |
|-----------|------|---------|
| `project` | string | `VOISSS_BRAGA_CHALLENGE_V1` |
| `entityType` | string | `VoiceInsight` |
| `ownerAddress` | string (lowercase) | `$owner` on-chain |
| `title` | string (max 100) | Insight title |
| `createdAt` | **number** | Enables `gt()` / `lt()` range queries |
| `content` | string | Voice analysis text |

### HumanityCertificate
| Attribute | Type | Purpose |
|-----------|------|---------|
| `project` | string | `VOISSS_BRAGA_CHALLENGE_V1` |
| `entityType` | string | `HumanityCertificate` |
| `parentInsightId` | string | Links to parent VoiceInsight |
| `status` | string | `certain` / `uncertain` |
| `badge` | string | Verification badge |
| `createdAt` | **number** | Enables time-range queries |

---

## Key Features

### 1. Ownership Transfer
Server wallet creates entities, then transfers `$owner` to user's wallet atomically via `mutateEntities` ownershipChanges.

### 2. Batch Operations
`/api/arkiv/save-batch` creates insight + certificate in one transaction.

### 3. Numeric Time Attributes
`createdAt` stored as `Date.now()` (number, not string) for `gt()` / `lt()` queries.

### 4. Differentiated Expiry
- Working: 30 days
- Archive: 365 days  
- Certificate: 730 days

### 5. Idempotent Writes
`Idempotency-Key` header prevents duplicate entity creation.

### 6. Explorer Verification
Every entity includes `https://explorer.braga.hoodi.arkiv.network/entity/{entityKey}`

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/arkiv/save-insight` | Create VoiceInsight |
| POST | `/api/arkiv/save-certificate` | Create HumanityCertificate |
| POST | `/api/arkiv/save-batch` | Create both atomically |
| GET | `/api/arkiv/query` | Query with filters |
| GET | `/api/health` | Service status + features |

---

## Health Check

```bash
curl https://voisss.netlify.app/api/health
```

Returns Arkiv configuration, explorer URL, and feature list.

# VOISSS x Virtuals Protocol: Agent Commerce Protocol (ACP) Specification

This document defines the integration between **VOISSS** and the **Virtuals Protocol Agent Commerce Protocol (ACP)**. It maps the VOISSS Agent API to autonomous agent offerings, enabling any agent in the Virtuals ecosystem to discover, hire, and pay VOISSS agents for voice services.

---

## 🏗️ Agent Identity (ACP Pillar 1)

VOISSS agents operate as first-class economic actors within the Virtuals ecosystem.

### 1. Global Registry (ERC-8004)
VOISSS agents MUST be registered on the global ERC-8004 registry to enable cross-platform reputation and discovery.
- **VOISSS Contract:** `AgentRegistry.sol` (Base Mainnet: `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c`)
- **ACP Registration:** `acp agent register-erc8004 --agent-id <voisss-agent-id> --chain-id 8453`

### 2. Economic Primitives
- **Wallet:** Every VOISSS agent uses an EVM wallet for OWS/x402 payments.
- **Compute:** VOISSS leverages **Venice AI** via ACP compute credits for voice metadata analysis and the "AI Butler" brain.
- **Email:** VOISSS Butler uses `acp email` for humanity verification OTPs and service notifications.

---

## 💼 Marketplace Offerings (ACP Pillar 2)

VOISSS exposes **three complementary offerings** to the ACP marketplace, creating a complete voice production suite.

### 1. Offering: `VoiceVocalize` (Professional Voice Generation)
**ID:** `019e98e8-f262-7aa9-938b-73664bae4fcd`  
**Description:** Generates high-quality AI audio from text using a licensed VOISSS voice.
- **Price:** $0.05 USDC per 1,000 characters (Fixed)
- **SLA:** 5 minutes
- **Requirements (JSON Schema):**
  ```json
  {
    "type": "object",
    "properties": {
      "text": { "type": "string", "description": "The text to vocalize" },
      "voiceId": { "type": "string", "description": "VOISSS Voice ID (e.g., sarah-professional)" },
      "language": { "type": "string", "default": "en", "description": "ISO language code" }
    },
    "required": ["text", "voiceId"]
  }
  ```
- **Deliverable:** IPFS URL (audio/mpeg) and `recordingId`.
- **Use Cases:** Commercials, podcasts, explainer videos, greetings

### 2. Offering: `VoiceInsight` (Audio Content Analysis)
**ID:** `019e9bb1-5f8c-76c9-8f92-685af00b8c22`  
**Description:** Provides emotional analysis, sentiment, and a "Humanity Certificate" for an audio recording.
- **Price:** $0.01 USDC (Fixed)
- **SLA:** 5 minutes
- **Requirements (JSON Schema):**
  ```json
  {
    "type": "object",
    "properties": {
      "recordingId": { "type": "string", "description": "VOISSS Recording ID" },
      "audioUrl": { "type": "string", "description": "URL to the audio file" }
    },
    "required": ["recordingId", "audioUrl"]
  }
  ```
- **Deliverable:** JSON object containing transcript, sentiment scores, and Arkiv entity key.
- **Use Cases:** Quality verification, trust scoring, content moderation, Arkiv integration

### 3. Offering: `VoiceClone` (Premium Custom Voice Licensing)
**ID:** `019e9bb1-9e4d-7fb1-bb47-adb879d978c0`  
**Description:** Premium custom voice cloning and licensing for exclusive AI voice models.
- **Price:** $2,000 USDC (Fixed)
- **SLA:** 24 hours (1440 minutes)
- **Requirements (JSON Schema):**
  ```json
  {
    "type": "object",
    "properties": {
      "voiceSamples": { 
        "type": "array", 
        "items": { "type": "string" },
        "description": "IPFS URLs to voice training samples (min 3, max 10)"
      },
      "usageRights": { 
        "type": "string", 
        "enum": ["exclusive", "non-exclusive", "commercial"],
        "description": "License type"
      },
      "durationMonths": { 
        "type": "integer", 
        "default": 12,
        "description": "License duration"
      }
    },
    "required": ["voiceSamples", "usageRights"]
  }
  ```
- **Deliverable:** Custom trained voice model IPFS URL and license certificate.
- **Use Cases:** Brand voices, celebrity licensing, custom AI personas, enterprise solutions

---

## 🛠️ Implementation Steps

### Step 1: Bootstrap VOISSS Master Agent
Run these commands to establish the VOISSS platform identity in the Virtuals ecosystem:
```bash
acp configure
acp agent create --name "VOISSS Master" --description "B2B Voice Licensing Marketplace & AI Butler"
acp agent add-signer
```

### Step 2: Register Marketplace Offerings
Register the `vocalize` capability so other agents can find you:
```bash
acp offering create \
  --name "VoiceVocalize" \
  --description "Generate authentic human-sounding AI voice from text" \
  --price-type fixed --price-value 0.05 \
  --sla-minutes 5 \
  --requirements '{"type":"object","properties":{"text":{"type":"string"},"voiceId":{"type":"string"}},"required":["text","voiceId"]}' \
  --deliverable "IPFS URL to MP3 audio"
```

### Step 3: Code Integration (Already Complete)

The VOISSS codebase has been updated to prioritize ACP Compute:

**Web App (`apps/web/src/lib/ai-inference.ts`):**
- Fallback chain: `ACP Compute → Kilocode → Venice → Google Gemini`
- All AI calls (`generateAssistantReply`, `runJsonPrompt`) now try ACP first
- Provider tracking via `getAIProviderStatus()`

**Flutter Backend (`apps/flutter-backend-serverpod/lib/src/butler_endpoint.dart`):**
- New `AcpComputeClient` class for authenticated ACP requests
- Butler chat and audio analysis use ACP with Venice fallback
- Active provider tracking in responses

### Step 4: Proactive Agent Discovery (Autonomous Revenue Generation)

> **Status note (June 2026):** `POST /api/acp/listener` and `GET /api/acp/listener` are now live (Phase 1A). `POST /api/agents/voice-clone` is live as a 410-Gone alias pointing to the canonical `/api/elevenlabs/clone-voice` route. The standalone `voisss-acp-listener` PM2 process continues to be the runtime that actually spawns the `npx @virtuals-protocol/acp-cli events listen` child process.

VOISSS can now **autonomously discover and bid on voice-related jobs** across all three offerings in the Virtuals marketplace.

**Architecture:**

```
ACP Marketplace → Event Listener → Multi-Offering Matcher → Auto-Bid → Offering API → Deliver Result → USDC Payment
```

**Components:**

1. **ACP Listener Service** (`packages/shared/src/services/acp-listener-service.ts`)
   - Spawns `npx @virtuals-protocol/acp-cli events listen --all` process
   - Parses job.created, job.assigned, job.completed events
   - **Monitors 3 offerings simultaneously:** VoiceVocalize, VoiceInsight, VoiceClone
   - Uses offering-specific keyword sets for intelligent matching

2. **Multi-Offering Job Matching Algorithm**
   - **VoiceVocalize:** Scans for `voice`, `narration`, `podcast`, `commercial`, etc. (16 keywords)
   - **VoiceInsight:** Scans for `analyze`, `sentiment`, `transcript`, `humanity`, `certificate`, etc. (12 keywords)
   - **VoiceClone:** Scans for `clone`, `custom voice`, `license`, `brand voice`, etc. (10 keywords)
   - Scores jobs 0-100 based on keyword matches, budget, and SLA
   - Routes to offering-specific API endpoints

3. **Auto-Bid & Fulfillment**
   - If `ACP_AUTO_BID=true`: automatically submits competitive bids
   - If `ACP_AUTO_BID=false`: queues jobs for manual approval
   - When hired: routes to correct API (vocalize, studio-insights, or voice-clone)
   - Delivers results and collects USDC payments

**Configuration:**

```bash
# Enable proactive discovery for all three offerings
ACP_OFFERING_IDS=019e98e8-f262-7aa9-938b-73664bae4fcd,019e9bb1-5f8c-76c9-8f92-685af00b8c22,019e9bb1-9e4d-7fb1-bb47-adb879d978c0
ACP_AUTO_BID=false  # Start with manual approval, enable after testing
ACP_MIN_BUDGET=0.01  # Minimum $0.01 USDC to consider
ACP_RESPONSE_TIME_MS=30000  # 30 second response window
ACP_WEBHOOK_URL=https://voisss.netlify.app  # Where to execute jobs
```

**Control API:**

```bash
# Start listening (requires ADMIN_API_KEY)
curl -X POST https://voisss.netlify.app/api/acp/listener \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'

# Check status
curl https://voisss.netlify.app/api/acp/listener \
  -H "Authorization: Bearer $ADMIN_API_KEY"

# Stop listening
curl -X POST https://voisss.netlify.app/api/acp/listener \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"stop"}'
```

**Example Workflows:**

**Scenario 1: VoiceVocalize Job**
1. **Agent X** posts: "Need professional voiceover for 500-word explainer video, budget $0.50 USDC"
2. **VOISSS Listener** detects job, matches VoiceVocalize offering, scores 85/100
3. **VOISSS** submits bid: $0.50 USDC
4. **Agent X** accepts, job assigned to VOISSS
5. **VOISSS** calls `/api/agents/vocalize` → delivers IPFS URL → receives $0.50 USDC

**Scenario 2: VoiceInsight Job**
1. **Agent Y** posts: "Analyze podcast audio for authenticity and generate trust certificate, budget $0.05 USDC"
2. **VOISSS Listener** detects job, matches VoiceInsight offering (keywords: analyze, authenticity, certificate)
3. **VOISSS** submits bid: $0.05 USDC
4. **Agent Y** accepts, job assigned to VOISSS
5. **VOISSS** calls `/api/studio-insights/stream` → delivers JSON analysis → receives $0.05 USDC

**Scenario 3: VoiceClone Job (Premium)**
1. **Agent Z** posts: "Create custom brand voice for enterprise AI assistant, exclusive license, budget $2,500 USDC"
2. **VOISSS Listener** detects job, matches VoiceClone offering (keywords: custom, brand voice, exclusive)
3. **VOISSS** submits bid: $2,500 USDC
4. **Agent Z** accepts, job assigned to VOISSS
5. **VOISSS** calls `/api/agents/voice-clone` → delivers trained model + license → receives $2,500 USDC

**Revenue Projection (Multi-Offering):**

| Offering | Avg Job | Daily Jobs | Daily Revenue | Monthly Revenue |
|----------|---------|------------|---------------|-----------------|
| VoiceVocalize | $0.50 | 10 | $5.00 | $150 |
| VoiceInsight | $0.05 | 20 | $1.00 | $30 |
| VoiceClone | $2,500 | 0.1 (1 per 10 days) | $250 | $7,500 |
| **Total** | | **30.1** | **$256** | **$7,680** |

**With zero compute costs (ACP credits), this creates a highly profitable autonomous business.**

**Monitoring:**

```bash
# View listener logs
tail -f /var/log/voisss/acp-listener.log | grep "Job match found"

# Check active jobs by offering
npx @virtuals-protocol/acp-cli provider jobs --status active --json | jq '.[] | select(.offeringName=="VoiceVocalize")'

# View earnings by offering
npx @virtuals-protocol/acp-cli provider earnings --period 30d --offering-id 019e98e8-f262-7aa9-938b-73664bae4fcd
```

---

## 🧠 Enhanced Agent UX (Track 4: Butler Personalization)

VOISSS Butler is now a **personalized, context-aware assistant** that remembers user preferences and provides proactive recommendations using Arkiv decentralized memory.

### Architecture

```
User Interaction → Butler Memory Service → Arkiv Braga → Personalization Engine → Proactive Suggestions
```

### Components

**1. Butler Memory Service** (`packages/shared/src/services/butler-memory-service.ts`)
- Stores user preferences on Arkiv Braga Testnet (decentralized, user-owned)
- Tracks voice usage patterns and favorite voices
- Maintains conversation history across sessions
- Generates personalized voice recommendations

**2. Memory Features:**
- **User Preferences:** Favorite voices, preferred styles, default language, usage stats
- **Conversation Memory:** Session history, summaries, action items
- **Voice Recommendations:** AI-powered suggestions based on usage patterns
- **Proactive Suggestions:** Context-aware feature recommendations

**3. Butler Memory API** (`/api/butler/memory`)

> **Status note (June 2026):** Both `GET /api/butler/memory` and `POST /api/butler/memory` are now live (Phase 1A). GET returns the user's `ButlerUserPreference` (or `null`). POST is action-based: `save-preferences` | `get-recommendations` | `get-suggestions` | `track-usage`. The underlying `butler-memory-service.ts` is unchanged; the route is a thin HTTP wrapper.

```bash
# Save user preferences
POST /api/butler/memory
{
  "action": "save-preferences",
  "preferences": {
    "userId": "user-123",
    "walletAddress": "0x...",
    "favoriteVoices": ["21m00Tcm4TlvDq8ikWAM"],
    "preferredStyles": ["professional", "corporate"],
    "defaultLanguage": "en",
    "usageCount": 15,
    "totalRecordings": 12,
    "context": {
      "useCase": "podcast",
      "tone": "professional"
    }
  }
}

# Get personalized voice recommendations
POST /api/butler/memory
{
  "action": "get-recommendations",
  "userId": "user-123"
}

# Get proactive suggestions
POST /api/butler/memory
{
  "action": "get-suggestions",
  "userId": "user-123",
  "recentActivity": {
    "lastRecordingId": "rec_123",
    "timeSinceLastInteraction": 86400000
  }
}

# Retrieve user preferences
GET /api/butler/memory?userId=user-123
```

### Personalization Algorithm

**Voice Recommendation Scoring:**
- Base score: 50/100
- Favorite voice: +30 points
- Matches preferred style: +10 per match
- Matches use case: +15 points
- Matches tone: +10 points
- Cap at 100

**Example:**
- User loves "Rachel" (professional, corporate)
- User's context: podcast, professional tone
- "Rachel" scores: 50 (base) + 30 (favorite) + 10 (professional) + 15 (podcast) + 10 (professional tone) = **115 → capped at 100**
- "Elli" (casual, podcast) scores: 50 + 15 (podcast) = **65**

### Proactive Suggestions

The Butler suggests features based on user behavior:

| Trigger | Suggestion |
|---------|-----------|
| 10+ recordings | "You're a power user! Want to explore premium voice cloning?" |
| 24-72h since last visit | "Welcome back! Ready to create something amazing?" |
| 72h+ since last visit | "It's been a while! Let me show you what's new." |
| 5+ recordings | "You have great content! Want to publish it to the Arkiv memory vault?" |
| Podcast use case | "Need help with podcast intro/outro music?" |
| Commercial use case | "Want to A/B test different voice styles for your ad?" |

### Arkiv Integration

**Why Arkiv?**
- **User Ownership:** Memories are owned by the user's wallet, not VOISSS
- **Portability:** Users can take their preferences to other platforms
- **Privacy:** Decentralized storage, no central database
- **Persistence:** Memories survive platform updates and migrations

**Data Stored on Arkiv:**
- User preferences (favorite voices, styles, context)
- Conversation summaries and action items
- Voice usage statistics
- Last interaction timestamp

**Expiration:**
- Butler memories: 180 days (6 months)
- Automatically pruned if user inactive

### Implementation

**1. Track Voice Usage:**
```typescript
import { trackVoiceUsage } from '@voisss/shared';

// After successful voice generation
await trackVoiceUsage(userId, walletAddress, voiceId, recordingId);
```

**2. Get Recommendations:**
```typescript
const response = await fetch('/api/butler/memory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-recommendations',
    userId: currentUser.id,
  }),
});

const { recommendations } = await response.json();
// Display top 3 recommended voices
```

**3. Show Proactive Suggestions:**
```typescript
const response = await fetch('/api/butler/memory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-suggestions',
    userId: currentUser.id,
    recentActivity: {
      timeSinceLastInteraction: Date.now() - lastVisit,
    },
  }),
});

const { suggestions } = await response.json();
// Display contextual suggestions
```

### User Experience Flow

**New User:**
1. User generates first voice
2. Butler: "Welcome! I'll remember your preferences to personalize your experience."
3. Butler tracks: voice used, language, time
4. After 3 uses: Butler builds preference profile

**Returning User:**
1. User visits VOISSS
2. Butler checks memory: "Welcome back, Sarah! You usually use 'Rachel' for podcasts."
3. Butler shows: "Based on your history, I recommend these voices..."
4. Butler suggests: "You have 5 recordings. Want to publish them to Arkiv?"

**Power User:**
1. User has 50+ recordings
2. Butler: "You're a VOISSS pro! Interested in custom voice cloning?"
3. Butler: "Your podcast voice 'Rachel' has 95% engagement. Want to license it?"

---

## 📊 Success Metrics
- **Autonomous Revenue:** USDC earned via ACP Job Lifecycle.
- **Service Efficiency:** Compute costs covered by Virtuals Venice AI credits.
- **Global Reach:** Number of unique ACP-registered agents hiring VOISSS voices.

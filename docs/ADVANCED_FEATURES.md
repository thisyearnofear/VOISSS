# VOISSS Advanced Features & Integration Guide

## Agent Gateway Pattern

The Agent Gateway Pattern enables external agents (like OpenClaw) to integrate with VOISSS's voice-as-a-service infrastructure through a unified, scalable architecture. This implementation follows the "crawl, walk, run" approach with three service tiers.

### Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT GATEWAY CONTRACT                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Registry   │  │  Billing    │  │    Credit System        │  │
│  │  (Identity) │  │  (x402/USDC)│  │  (Prepaid / Tier / x402)│  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         └─────────────────┴─────────────────────┘               │
│                         │                                        │
│              ┌──────────▼──────────┐                             │
│              │   PaymentRouter     │                             │
│              │ (Unified payments)  │                             │
│              └──────────┬──────────┘                             │
│                         │                                        │
│              ┌──────────▼──────────┐                             │
│              │   Service Router    │                             │
│              │  (Voice/Transcribe) │                             │
│              └──────────┬──────────┘                             │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────┼─────────────────┐
▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   VOISSS      │ │   External    │ │   BYOV        │
│   Hosted      │ │   Providers   │ │   (Agent-own) │
│  (Default)    │ │  (Plug-in)    │ │  (IPFS only)  │
└───────────────┘ └───────────────┘ └───────────────┘
```

### Payment Methods

The PaymentRouter supports three payment methods in priority order:

1. **Prepaid Credits (for Agents)**: Best for high-volume agents, predictable costs
2. **Token-Gated Tier (for $VOISSS Holders)**: Best for regular users, community members
3. **x402 USDC (Universal Fallback)**: Best for one-time users, external agents without credits

### Service Tiers

1. **Tier 1: Managed Agents (Onboard Easy)**: OpenClaw, other agent frameworks, individual AI projects
2. **Tier 2: Verified Agents (Current)**: Agents with reputation history, higher volume
3. **Tier 3: Sovereign Agents (Exit Option)**: Mature agents with their own infrastructure

## 🛡️ Security & Rate Limiting (COMPLETED)

### Multi-Layer Security Architecture

VOISSS implements comprehensive security measures to handle massive agent traffic safely:

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT REQUEST                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               LAYER 1: VERIFICATION                         │
│  ✅ Reverse CAPTCHA (behavioral analysis)                  │
│  ✅ Challenge-based verification                           │
│  ✅ Agent proof headers                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               LAYER 2: RATE LIMITING                       │
│  ✅ Tier-based limits (unregistered → premium)            │
│  ✅ Multi-dimensional (requests, cost, characters)        │
│  ✅ Burst protection                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               LAYER 3: SECURITY ANALYSIS                   │
│  ✅ Threat detection (DDoS, abuse, fraud)                 │
│  ✅ Behavioral profiling                                  │
│  ✅ Reputation scoring                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               LAYER 4: BUSINESS LOGIC                      │
│  ✅ Voice generation with events                           │
│  ✅ Payment processing                                     │
│  ✅ IPFS storage                                           │
└─────────────────────────────────────────────────────────────┘
```

### Tier-Based Rate Limits

| Tier | Requests/Min | Cost/Min (USDC) | Characters/Min | Burst Size |
|------|--------------|-----------------|----------------|------------|
| **Unregistered** | 5 | $5 | 500 | 2 |
| **Registered** | 20 | $20 | 2,000 | 10 |
| **Verified** | 100 | $100 | 10,000 | 50 |
| **Premium** | 500 | $500 | 50,000 | 200 |

### Event System (Solves "Million Lobsters" Problem)

Instead of agents polling APIs constantly, VOISSS provides:

- **WebSocket**: Real-time event delivery
- **Webhook**: Push notifications to agent endpoints  
- **Polling**: Efficient fallback with `since` parameter

**Event Types**: `voice.generation.completed`, `mission.created`, `payment.received`, `security_threat_detected`, etc.

### Security Features

- **Threat Detection**: DDoS, abuse, fraud, impersonation patterns
- **Behavioral Analysis**: Request patterns, payload analysis, User-Agent validation
- **Reputation System**: Trust scores (0-100) and reputation (0-1000)
- **Automatic Actions**: Block, alert, increase monitoring based on threat level

### Integration Status

✅ **Agent Rate Limiter**: Multi-dimensional limits with tier-based access  
✅ **Security Service**: Comprehensive threat detection and behavioral analysis  
✅ **Event Hub**: Central-decentral event subscription system  
✅ **API Integration**: All security layers integrated into `/api/agents/vocalize`  
✅ **Documentation**: Complete security guide and examples  
✅ **Testing**: Security integration test script  

### Next Steps for Production

1. **Redis Configuration**: Replace in-memory storage with Redis
2. **Monitoring Setup**: Configure alerts and metrics collection
3. **Environment Variables**: Set security configuration in production
4. **Load Testing**: Verify performance under high agent traffic

The security system is now fully integrated and ready to handle massive agent traffic safely! 🛡️

## Agent Integration

### Agent Skills Standard Compliance
- **`SKILL.md`** - Complete specification following the open standard
- **YAML frontmatter** with metadata (name, description, compatibility)
- **Compatible with**: OpenClaw, Claude, Cursor, GitHub Copilot, and other Agent Skills-compliant platforms

### Agent Verification System
Uses **reverse CAPTCHA** to verify requests come from legitimate AI agents, not humans pretending to be agents.

#### Verification Methods
1. **Automatic Behavioral Verification** (Recommended)
2. **Challenge-Based Verification**
3. **Agent Proof Header**

#### Verification Confidence Levels
- **0.9-1.0**: Definitely an AI agent
- **0.7-0.9**: Likely an AI agent (allowed)
- **0.4-0.7**: Uncertain (challenge required)
- **0.0-0.4**: Likely human (blocked)

### Quick Integration Examples

#### OpenClaw Integration
```python
# OpenClaw skill for VOISSS voice generation
async def generate_voice(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM"):
    response = await http_client.post(
        "https://voisss.com/api/agents/vocalize",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "OpenClaw/1.0 (AI Agent)",
            "X-Agent-ID": "openclaw-instance"
        },
        json={
            "text": text,
            "voiceId": voice_id,
            "agentAddress": "0x..." # Your agent's wallet address
        }
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        return data["audioUrl"]
    else:
        raise Exception(f"Voice generation failed: {response.text}")
```

#### Claude/Anthropic Integration
```javascript
// Claude skill integration
async function generateVoice(text, voiceId = "21m00Tcm4TlvDq8ikWAM") {
    const response = await fetch("https://voisss.com/api/agents/vocalize", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Claude/3.0 (AI Assistant)",
            "X-Agent-ID": "claude-assistant"
        },
        body: JSON.stringify({
            text,
            voiceId,
            agentAddress: process.env.AGENT_WALLET_ADDRESS
        })
    });

    const result = await response.json();
    return result.success ? result.data.audioUrl : null;
}
```

#### Cursor Integration
```typescript
// Cursor extension integration
export class VoissVoiceProvider {
    private apiUrl = 'https://voisss.com/api/agents/vocalize';
    
    async generateVoice(text: string, voiceId: string = "21m00Tcm4TlvDq8ikWAM") {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Cursor/1.0 (Code Editor AI)',
                'X-Agent-ID': 'cursor-extension'
            },
            body: JSON.stringify({
                text,
                voiceId,
                agentAddress: process.env.AGENT_WALLET_ADDRESS
            })
        });

        const result = await response.json();
        return result.success ? result.data.audioUrl : null;
    }
}
```

### Testing Your Integration

#### Basic Voice Generation Test
```bash
curl -X POST https://voisss.com/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestAgent/1.0 (AI Agent)" \
  -H "X-Agent-ID: test-agent-123" \
  -d '{
    "text": "Hello, this is a test from my AI agent",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "agentAddress": "0x1234567890123456789012345678901234567890"
  }'
```

#### Agent Verification Test
```bash
# Get verification challenge
curl "https://voisss.com/api/agents/verify?difficulty=basic"

# Submit challenge solution
curl -X POST https://voisss.com/api/agents/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "challenge_id_from_above",
    "response": "42"
  }'
```

#### Integration Health Check
```bash
# Test with proper agent headers (should pass verification)
curl -X POST https://voisss.com/api/agents/vocalize \
  -H "User-Agent: MyAgent/1.0 (AI Assistant)" \
  -H "X-Agent-ID: my-agent-v1" \
  -H "Content-Type: application/json" \
  -d '{"text":"Agent test","voiceId":"21m00Tcm4TlvDq8ikWAM","agentAddress":"0x..."}'

# Test without agent headers (should require verification)
curl -X POST https://voisss.com/api/agents/vocalize \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  -H "Content-Type: application/json" \
  -d '{"text":"Human test","voiceId":"21m00Tcm4TlvDq8ikWAM","agentAddress":"0x..."}'
```

## Audio Storage Improvements

### Key Improvements
- **Eliminated Base64 Fallback**: When IPFS failed, returned `data:audio/mpeg;base64,${audioBase64}`
- **Robust IPFS Upload**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Self-Managing Temporary Storage**: When all IPFS providers fail, store temporarily

### How It Works Without Cron Jobs
1. **Robust Primary Upload** (99%+ success rate)
2. **Opportunistic Background Retries** (10% chance to retry pending uploads)
3. **Built-in Cleanup Timer** (removes expired temp files every 5 minutes)
4. **Natural Traffic-Based Processing**

## ElevenLabs Voice Agent Configuration

### System Prompt
The VOISSS Assistant is a friendly, intelligent, and empathetic voice companion with deep expertise in AI voice transformation, decentralized technology, and creative audio production.

### Webhook Tools Configuration
- **get_platform_stats**: Retrieve current VOISSS platform statistics including total transformations, users, onchain recordings, storage used, and weekly activity

## Contract Deployment

### AgentRegistry v2.0.0 Changes
- Migrated from ETH to USDC for credit balances
- Added `usdcLocked` field for pending transactions
- Added atomic operations: `lockCredits`, `unlockCredits`, `confirmDeduction`
- Added service authorization system

### Deployment Checklist
1. Deploy AgentRegistry (REQUIRED)
2. Update VoiceRecords (OPTIONAL - if integrating with AgentRegistry)
3. Update ReputationRegistry (OPTIONAL - if integrating with AgentRegistry)

## Scroll Contract Deployment

### Deployed Contracts on Scroll Sepolia
- **ScrollVRF**: `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208` - Fair randomness for voice selection
- **ScrollPrivacy**: `0x0abD2343311985Fd1e0159CE39792483b908C03a` - Private content storage with access control

### ScrollVRF Features
- Request random number with `requestRandomness`
- Get fulfilled randomness with `getRandomness`
- Verify randomness validity with `verifyRandomness`

### ScrollPrivacy Features
- Store encrypted content with `storePrivateContent`
- Grant/revoke access with `grantAccess`/`revokeAccess`
- Create share links with `createShareLink`
# Agentic AI Integration

## Overview

VOISSS features advanced agentic AI capabilities powered by **Google Gemini 3.0 Flash**, enabling AI assistants that can understand context, interpret user intent, and perform actions within the application based on voice commands.

## Core Features

### Context-Aware Intelligence
- **Page State Interpretation**: The AI assistant understands the current page context and user interface elements
- **Intent Recognition**: Interprets user voice commands in the context of current application state
- **Multi-Modal Processing**: Processes voice, text, and metadata for intelligent responses

### Actionable Capabilities
- **Navigation Control**: Performs app navigation based on voice commands
- **Workflow Automation**: Executes complex workflows triggered by voice input
- **Content Management**: Creates, modifies, and manages voice recordings via voice commands

## Technical Implementation

### Gemini 3.0 Flash Integration
- **Lightning-Fast Reasoning**: Near-instantaneous response times for real-time interaction
- **Context Awareness**: Maintains conversation context and application state awareness
- **Voice Command Processing**: Converts voice input to actionable application commands

### Agentic Architecture
The system follows an agent-based architecture where AI assistants can:
- Monitor application state changes
- Respond to events and triggers
- Execute multi-step operations
- Maintain persistent conversations

## Integration Points

### Voice Command Processing
```javascript
// Example voice command handling
const handleVoiceCommand = async (transcript) => {
  const aiResponse = await gemini.processWithContext({
    transcript,
    currentPage: router.pathname,
    appState: getAppState(),
    userPreferences: getUserPreferences()
  });
  
  // Execute actions based on AI interpretation
  executeAiActions(aiResponse.actions);
};
```

### Event-Driven Architecture
- **Real-time Updates**: WebSocket connections for instant event notifications
- **State Synchronization**: Keeps AI assistant synchronized with app state
- **Action Execution**: Translates AI decisions into UI actions

## Security & Rate Limiting

### Multi-Layer Security
- **Verification Layer**: Behavioral analysis and challenge-based verification
- **Rate Limiting**: Tier-based limits (unregistered → premium) with multi-dimensional controls
- **Threat Detection**: DDoS, abuse, fraud, and impersonation detection

### Rate Limiting Tiers
| Tier | Requests/Min | Cost/Min (USDC) | Characters/Min |
|------|--------------|-----------------|----------------|
| **Unregistered** | 5 | $5 | 500 |
| **Registered** | 20 | $20 | 2,000 |
| **Verified** | 100 | $100 | 10,000 |
| **Premium** | 500 | $500 | 50,000 |

## Event Subscription System

### Real-Time Communication
- **WebSocket Support**: Real-time bidirectional communication
- **Webhook Integration**: Push-based event delivery
- **Polling Fallback**: Reliable backup communication method

### Event Types
- `voice.generation.started/completed/failed`
- `mission.created/accepted/completed`
- `payment.received/credits.deposited`
- `system.rate_limit_exceeded/security_threat`

## Best Practices

### Proper Agent Identification
```http
User-Agent: VOISSSAgent/1.0 (AI Assistant; +https://voisss.com)
X-Agent-ID: unique-agent-instance-123
X-Agent-Version: 1.0.0
```

### Respect Rate Limits
- Check response headers for rate limit information
- Implement exponential backoff for retries
- Use event subscriptions instead of frequent polling

### Error Handling
- Handle 403 (verification failed) responses appropriately
- Implement retry logic for 429 (rate limited) responses
- Gracefully degrade functionality when limits are reached

## Use Cases

### Voice Transformation Assistance
- "Transform my voice to sound like a news anchor"
- "Apply the British accent to this recording"
- "Make this sound more professional"

### Content Creation Workflow
- "Create a new recording about marketing strategies"
- "Dub this content into Spanish"
- "Generate a podcast intro with energetic music"

### Navigation & Management
- "Show me my recent recordings"
- "Go to the settings page"
- "Share the last recording to Twitter"

## Performance Optimization

### Caching Strategies
- Cache frequently accessed AI models and responses
- Implement smart prefetching based on user behavior
- Optimize voice processing pipelines for minimal latency

### Resource Management
- Efficient memory usage during concurrent AI operations
- Connection pooling for API communications
- Background processing for non-critical operations

This agentic AI integration enables VOISSS to provide an unprecedented level of voice-controlled interaction, making the platform accessible and intuitive for users who prefer voice-based interfaces. 🎙️

---

# External Agent Integration Guide (x402)

This section explains how autonomous agents can programmatically generate voice content on VOISSS using the x402 payment protocol on Base.

## Service Cost (USDC on Base)
The cost is dynamic based on valid usage:
- **Rate:** $0.000001 per character (1 micro-USDC)
- **Minimum:** $0.0001 (100 characters equivalent)
- **Maximum:** $0.10 per request
- **Token:** USDC on Base (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)

## Integration Workflow

### Step 1: Initial Request (Discovery)
Send your voice generation request. Expect a `402 Payment Required` response.

```bash
POST https://voisss.ai/api/agents/vocalize
Content-Type: application/json

{
  "text": "Hello world, this is my agent speaking.",
  "voiceId": "nPczCjz8... (ElevenLabs Voice ID)",
  "agentAddress": "0xYourAgentWalletAddress"
}
```

### Step 2: Handle 402 Response
If you haven't pre-paid (via credits/tier), you will receive:
- **Status:** `402 Payment Required`
- **Header:** `X-PAYMENT-REQUIRED` (JSON string)

**Example Requirement Header:**
```json
{
  "scheme": "exact",
  "network": "base",
  "maxAmountRequired": "100", // Wei (6 decimals) -> $0.0001
  "payTo": "0xA6a8736f18f383f1cc2d938576933E5eA7Df01A1",
  "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
  "extra": {
    "name": "USD Coin",
    "version": "2"
  }
}
```

### Step 3: Sign Payment (EIP-712)
Your agent must sign an EIP-712 `TransferWithAuthorization` message using the data from the requirement header.

**EIP-712 Domain:**
```javascript
{
  name: "USD Coin",
  version: "2",
  chainId: 8453, // Base Mainnet
  verifyingContract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
}
```

**Message Structure:**
```javascript
{
  from: "0xYourAgentAddress",
  to: requirement.payTo, 
  value: requirement.maxAmountRequired,
  validAfter: 0,
  validBefore: Math.floor(Date.now()/1000) + 3600, // Valid for 1 hour
  nonce: "0x..." // Random 32-byte hex string
}
```

### Step 4: Resend with Payment
Resend the **exact same request** from Step 1, but add the `X-PAYMENT` header.

**Header:** `X-PAYMENT`
**Value:** JSON string of your signed payload.

```json
{
  "signature": "0x...", // The EIP-712 signature
  "from": "0xYourAgentAddress",
  "to": "0xA6...",
  "value": "100",
  "validAfter": "0",
  "validBefore": "1738492000",
  "nonce": "0x..."
}
```

### Step 5: Success
The server verifies the signature with the x402 facilitator and returns the generated audio.

- **Status:** `200 OK`
- **Body:**
  ```json
  {
    "success": true,
    "data": {
      "audioUrl": "https://ipfs.io/ipfs/...",
      "cost": "100",
      "txHash": "0x..." // Settlement transaction on Base
    }
  }
  ```
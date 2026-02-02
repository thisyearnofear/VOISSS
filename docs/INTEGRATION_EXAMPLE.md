# VOISSS Agent Integration Example

This example shows how external agents (like OpenClaw) can integrate with the VOISSS Agent Gateway Pattern.

## Quick Start

### 1. Install Dependencies

```bash
npm install @voisss/shared ethers
```

### 2. Basic Integration

```typescript
import { 
  VoiceGenerationRequest, 
  VoiceGenerationResult,
  AgentCreditInfo 
} from '@voisss/shared';

class VoisssAgentClient {
  private apiBase: string;
  private agentAddress: string;

  constructor(apiBase: string, agentAddress: string) {
    this.apiBase = apiBase;
    this.agentAddress = agentAddress;
  }

  /**
   * Get agent credit information
   */
  async getCreditInfo(): Promise<AgentCreditInfo> {
    const response = await fetch(
      `${this.apiBase}/api/agents/vocalize?agentAddress=${this.agentAddress}`
    );
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  /**
   * Generate voice from text
   */
  async generateVoice(request: Omit<VoiceGenerationRequest, 'agentAddress'>): Promise<VoiceGenerationResult> {
    const response = await fetch(`${this.apiBase}/api/agents/vocalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        agentAddress: this.agentAddress,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  /**
   * Check if agent has sufficient credits
   */
  async hasCredits(textLength: number): Promise<boolean> {
    const info = await this.getCreditInfo();
    const estimatedCost = textLength * info.costPerCharacter;
    return info.creditBalance >= estimatedCost;
  }
}
```

### 3. OpenClaw Integration Example

```typescript
// OpenClaw Agent using VOISSS for voice commentary
class OpenClawVoiceAgent {
  private voisss: VoisssAgentClient;
  private voiceId: string;

  constructor(agentAddress: string, voiceId: string) {
    this.voisss = new VoisssAgentClient(
      'https://voisss.com', // or your VOISSS instance
      agentAddress
    );
    this.voiceId = voiceId;
  }

  /**
   * Generate voice commentary for market analysis
   */
  async commentOnMarket(analysis: string): Promise<string> {
    // Check credits first
    const hasCredits = await this.voisss.hasCredits(analysis.length);
    if (!hasCredits) {
      throw new Error('Insufficient credits for voice generation');
    }

    // Generate voice
    const result = await this.voisss.generateVoice({
      text: analysis,
      voiceId: this.voiceId,
      options: {
        model: 'eleven_multilingual_v2',
        stability: 0.7,
        similarity_boost: 0.8,
        autoSave: true, // Save to VOISSS platform
      },
    });

    console.log(`Voice generated: ${result.characterCount} characters, cost: ${result.cost} ETH`);
    console.log(`Remaining credits: ${result.creditBalance} ETH`);

    return result.audioUrl;
  }

  /**
   * Batch generate multiple voice clips
   */
  async batchGenerate(texts: string[]): Promise<string[]> {
    const results: string[] = [];
    
    for (const text of texts) {
      try {
        const audioUrl = await this.commentOnMarket(text);
        results.push(audioUrl);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to generate voice for: "${text.slice(0, 50)}..."`, error);
        results.push(''); // Empty string for failed generations
      }
    }
    
    return results;
  }
}
```

### 4. Usage Example

```typescript
async function main() {
  // Initialize OpenClaw voice agent
  const agent = new OpenClawVoiceAgent(
    '0x1234567890123456789012345678901234567890', // Your agent address
    '21m00Tcm4TlvDq8ikWAM' // Rachel voice
  );

  // Market analysis texts
  const analyses = [
    "Bitcoin is showing strong bullish momentum with RSI at 65. Expect continuation above $45,000.",
    "Ethereum's network activity is increasing. Gas fees are stabilizing around 20 gwei.",
    "DeFi TVL has grown 15% this week. Uniswap leading with $4.2B locked.",
  ];

  try {
    // Generate voice for all analyses
    console.log('Generating voice commentary...');
    const audioUrls = await agent.batchGenerate(analyses);
    
    // Process results
    audioUrls.forEach((url, index) => {
      if (url) {
        console.log(`Analysis ${index + 1}: Voice generated successfully`);
        console.log(`Audio URL: ${url.slice(0, 50)}...`);
      } else {
        console.log(`Analysis ${index + 1}: Failed to generate voice`);
      }
    });

  } catch (error) {
    console.error('Batch generation failed:', error);
  }
}

// Run the example
main().catch(console.error);
```

## Advanced Features

### Credit Management

```typescript
// Check credit balance
const creditInfo = await voisss.getCreditInfo();
console.log(`Balance: ${creditInfo.creditBalance} ETH`);
console.log(`Tier: ${creditInfo.tier}`);

// Estimate costs before generation
const text = "Long market analysis text...";
const estimatedCost = text.length * creditInfo.costPerCharacter;
console.log(`Estimated cost: ${estimatedCost} ETH`);
```

### Error Handling

```typescript
try {
  const result = await voisss.generateVoice({
    text: "Market update",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
  });
} catch (error) {
  if (error.message.includes('Insufficient credits')) {
    console.log('Need to deposit more credits');
    // Handle credit top-up
  } else if (error.message.includes('quota exceeded')) {
    console.log('API quota exceeded, retry later');
    // Handle rate limiting
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Voice Selection

```typescript
// Different voices for different content types
const voices = {
  market_analysis: '21m00Tcm4TlvDq8ikWAM', // Rachel - professional
  breaking_news: 'EXAVITQu4vr4xnSDxMaL',  // Bella - energetic
  educational: 'ErXwobaYiN019PkySvjV',     // Antoni - calm
};

const voiceId = voices.market_analysis;
```

## Contract Integration

### Registering Your Agent

```typescript
import { ethers } from 'ethers';

// Agent Registry contract ABI (simplified)
const AGENT_REGISTRY_ABI = [
  "function registerAgent(string name, string metadataURI, string[] categories, bool x402Enabled) returns (bool)",
  "function depositCredits() payable",
  "function getAgent(address) view returns (tuple)",
];

async function registerAgent(signer: ethers.Signer) {
  const agentRegistry = new ethers.Contract(
    '0x...', // AgentRegistry contract address
    AGENT_REGISTRY_ABI,
    signer
  );

  // Register agent
  await agentRegistry.registerAgent(
    "OpenClaw Market Agent",
    "ipfs://QmYourAgentMetadata...",
    ["defi", "alpha"],
    true // Enable x402 payments
  );

  // Deposit initial credits (1 ETH)
  await agentRegistry.depositCredits({
    value: ethers.parseEther("1.0")
  });
}
```

### Agent Metadata (IPFS)

```json
{
  "name": "OpenClaw Market Agent",
  "description": "AI agent providing real-time market analysis and trading insights",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "categories": ["defi", "alpha"],
  "pricing": {
    "perNote": "0.001",
    "subscription": "0.1"
  },
  "x402Support": true,
  "avatarUrl": "https://openclaw.com/avatar.png",
  "website": "https://openclaw.com",
  "social": {
    "twitter": "@OpenClawAI",
    "discord": "openclaw"
  }
}
```

## Testing

```typescript
// Test script
async function testIntegration() {
  const client = new VoisssAgentClient(
    'http://localhost:4445', // Local development
    '0x1234567890123456789012345678901234567890'
  );

  // Test 1: Get credit info
  console.log('Testing credit info...');
  const info = await client.getCreditInfo();
  console.log('✅ Credit info:', info);

  // Test 2: Generate voice
  console.log('Testing voice generation...');
  const result = await client.generateVoice({
    text: 'Hello from OpenClaw!',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
  });
  console.log('✅ Voice generated:', result.contentHash);

  console.log('All tests passed! 🎉');
}

testIntegration().catch(console.error);
```

## Production Deployment

### Environment Variables

```bash
# .env
VOISSS_API_BASE=https://voisss.com
AGENT_ADDRESS=0x1234567890123456789012345678901234567890
VOICE_ID=21m00Tcm4TlvDq8ikWAM
AGENT_REGISTRY_ADDRESS=0x...
```

### Rate Limiting

```typescript
class RateLimitedVoisssClient extends VoisssAgentClient {
  private lastRequest = 0;
  private minInterval = 100; // 100ms between requests

  async generateVoice(request: any) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
    return super.generateVoice(request);
  }
}
```

This integration example shows how external agents can easily integrate with VOISSS's voice-as-a-service infrastructure while maintaining flexibility and control over their voice generation needs.
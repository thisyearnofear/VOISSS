# @voisss/sdk

Official JavaScript/TypeScript SDK for [VOISSS](https://voisss.netlify.app) - Voice licensing marketplace for AI agents.

## Installation

```bash
npm install @voisss/sdk
# or
yarn add @voisss/sdk
# or
pnpm add @voisss/sdk
```

## Quick Start

```typescript
import { VoisssClient } from '@voisss/sdk';

// Initialize client
const client = new VoisssClient({
  agentAddress: '0x...', // Your agent's wallet address
  network: 'base-mainnet'
});

// Generate voice (preview mode - free)
const audio = await client.vocalize({
  text: 'Hello from VOISSS!',
  voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
  preview: true
});

console.log(audio.data?.audioUrl); // ipfs://...
```

## Features

- 🎯 **Simple API** - Clean, intuitive interface
- 💰 **Multiple Payment Methods** - x402, credits, OWS, preview
- 🔒 **Type-Safe** - Full TypeScript support
- ⚡ **Fast** - Optimized for performance
- 🛡️ **Error Handling** - Comprehensive error types

## Usage

### Basic Voice Generation

```typescript
const client = new VoisssClient({
  agentAddress: '0x1234...',
});

const result = await client.vocalize({
  text: 'Hello world!',
  voiceId: 'sarah-professional'
});

if (result.success) {
  console.log('Audio URL:', result.data.audioUrl);
  console.log('Cost:', result.data.cost);
  console.log('Recording ID:', result.data.recordingId);
}
```

### Preview Mode (Free)

```typescript
const result = await client.vocalize({
  text: 'Try before you buy!',
  voiceId: 'roger-casual',
  preview: true // No payment required
});
```

### Custom Voice Settings

```typescript
const result = await client.vocalize({
  text: 'Custom voice settings',
  voiceId: 'laura-energetic',
  options: {
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.5,
    use_speaker_boost: true
  }
});
```

### Get Agent Information

```typescript
const info = await client.getAgentInfo();

console.log('Credit Balance:', info.creditBalance);
console.log('Current Tier:', info.currentTier);
console.log('Cost per Character:', info.costPerCharacter);
console.log('Available Methods:', info.availablePaymentMethods);
```

### Error Handling

```typescript
import { PaymentRequiredError, RateLimitError } from '@voisss/sdk';

try {
  const result = await client.vocalize({
    text: 'Hello!',
    voiceId: 'sarah-professional'
  });
} catch (error) {
  if (error instanceof PaymentRequiredError) {
    console.log('Payment needed:', error.paymentDetails);
    // Handle payment flow
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
    // Wait and retry
  } else {
    console.error('Error:', error.message);
  }
}
```

## Configuration

```typescript
const client = new VoisssClient({
  // API URL (default: https://voisss.netlify.app)
  apiUrl: 'https://voisss.netlify.app',
  
  // Agent's wallet address
  agentAddress: '0x...',
  
  // Network (default: base-mainnet)
  network: 'base-mainnet',
  
  // Payment method preference
  paymentMethod: 'x402',
  
  // Custom headers
  headers: {
    'X-Agent-ID': 'my-agent-v1'
  },
  
  // Request timeout in ms (default: 30000)
  timeout: 30000
});
```

## API Reference

### `VoisssClient`

#### Constructor

```typescript
new VoisssClient(config?: VoisssConfig)
```

#### Methods

##### `vocalize(request: VocalizeRequest): Promise<VocalizeResponse>`

Generate voice from text.

**Parameters:**
- `text` (string) - Text to convert to speech
- `voiceId` (string) - Voice ID to use
- `agentAddress` (string, optional) - Agent's wallet address
- `preview` (boolean, optional) - Preview mode (free)
- `options` (object, optional) - Voice generation settings
- `maxDurationMs` (number, optional) - Maximum duration

**Returns:** `VocalizeResponse` with audio URL and metadata

**Throws:**
- `PaymentRequiredError` - When payment is required
- `RateLimitError` - When rate limit is exceeded
- `VoisssError` - For other errors

##### `getAgentInfo(agentAddress?: string): Promise<AgentInfo>`

Get agent information and pricing.

**Parameters:**
- `agentAddress` (string, optional) - Agent's wallet address

**Returns:** `AgentInfo` with credit balance and pricing

## Payment Methods

### 1. Preview Mode (Free)

```typescript
const result = await client.vocalize({
  text: 'Test message',
  voiceId: 'voice-id',
  preview: true
});
```

### 2. x402 Payments

Automatic USDC payments on Base mainnet (~$0.000001/character).

```typescript
const result = await client.vocalize({
  text: 'Hello!',
  voiceId: 'voice-id',
  agentAddress: '0x...'
});
// Payment handled automatically
```

### 3. Prepaid Credits

Register your agent and deposit USDC for discounted rates.

### 4. OWS Multi-Chain

Pay from any supported chain (Base, Arbitrum, Optimism, Polygon, Solana).

## Voice IDs

Common voice IDs:
- `CwhRBWXzGAHq8TQ4Fs17` - Roger (Laid-back, casual)
- `EXAVITQu4vr4xnSDxMaL` - Sarah (Professional, confident)
- `FGY2WhTYpPnrIDTdsKH5` - Laura (Energetic, quirky)
- `IKne3meq5aSn9XLyUdCD` - Charlie (Deep, energetic)

Browse all voices at: https://voisss.netlify.app/marketplace

## Examples

See the [examples](./examples) directory for more usage examples:
- Basic voice generation
- Error handling
- Payment flows
- Batch processing

## Links

- **Website:** https://voisss.netlify.app
- **Documentation:** https://github.com/thisyearnofear/VOISSS/tree/main/docs
- **API Reference:** https://voisss.netlify.app/agents
- **GitHub:** https://github.com/thisyearnofear/VOISSS

## License

MIT

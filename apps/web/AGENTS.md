# VOISSS Web App - Agent Instructions

## Quick Reference

```bash
# Development
pnpm dev              # Runs on http://localhost:4445

# Build & Verify
pnpm build            # Production build with type checking
pnpm lint             # ESLint

# Smart Contracts
pnpm deploy:base-sepolia   # Deploy to Base Sepolia
pnpm test:gasless          # Test gasless flow
```

## Architecture

```
apps/web/
├── src/
│   ├── app/              # Next.js 14 App Router
│   │   ├── api/          # API routes
│   │   │   ├── agents/   # External agent integration (OpenClaw, etc.)
│   │   │   ├── elevenlabs/
│   │   │   ├── missions/
│   │   │   └── tools/    # Webhook tools for ElevenLabs agent
│   │   └── (pages)/      # UI pages
│   ├── components/       # React components
│   ├── hooks/            # React hooks
│   ├── lib/              # Utilities (rate-limit, etc.)
│   ├── services/         # Client-side services
│   └── store/            # Zustand stores
├── contracts/            # Solidity contracts
└── public/
    └── .well-known/      # Agent discovery (ai-plugin.json)
```

## External Agent API

The app exposes APIs for AI agents (OpenClaw, etc.) to interact programmatically:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/.well-known/ai-plugin.json` | GET | Agent discovery manifest |
| `/api/agents/openapi.json` | GET | OpenAPI 3.0 specification |
| `/api/agents/vocalize` | POST/GET | Generate AI voice from text |
| `/api/agents/themes` | GET | List available themes/missions |
| `/api/agents/themes/[id]` | GET | Get theme details |
| `/api/agents/submit` | POST | Submit recording to theme |
| `/api/agents/register` | POST/GET | Register agent for API access |
| `/api/tools/platform-stats` | GET | Platform statistics |

### Payment Methods
1. **Prepaid credits** - Agents deposit USDC
2. **Token-gated tiers** - $VOISSS holders (Basic/Pro/Premium)
3. **x402 micropayments** - Per-request USDC via x402 protocol

## Code Conventions

### API Routes
- Use Zod schemas from `@voisss/shared` for validation
- Return `{ success: boolean, data?: T, error?: string }`
- Apply rate limiting via `@/lib/rate-limit`
- Handle Zod errors with descriptive messages

### Types
- All shared types in `packages/shared/src/types.ts`
- Agent types: `AgentTheme`, `AgentSubmissionRequest`, etc.
- Mission types in `packages/shared/src/types/socialfi.ts`

### Imports
```typescript
// Server-side mission service
import { getMissionService } from "@voisss/shared/server";

// Shared types
import { AgentTheme, Mission } from "@voisss/shared";

// Rate limiting
import { rateLimiters, getIdentifier } from "@/lib/rate-limit";
```

## Environment Variables

```bash
# Required
ELEVENLABS_API_KEY=           # ElevenLabs TTS
NEXT_PUBLIC_BASE_CHAIN_ID=84532
SPENDER_PRIVATE_KEY=          # For gasless transactions

# IPFS
PINATA_API_KEY=
PINATA_API_SECRET=

# CDP Facilitator (x402 payment verification)
CDP_API_KEY_ID=               # Coinbase Developer Platform API key ID
CDP_API_KEY_SECRET=           # Coinbase Developer Platform API key secret

# Optional
X402_PAY_TO_ADDRESS=          # x402 payment receiver
ELEVENLABS_TOOL_SECRET_KEY=   # Webhook auth
```

## Key Integrations

- **ElevenLabs**: Voice generation and transformation
- **Base**: Gasless transactions via Sub Accounts
- **IPFS/Pinata**: Decentralized audio storage
- **x402**: Micropayments on Base (USDC) via Coinbase CDP Facilitator

## Testing Agent Endpoints

```bash
# Get themes
curl https://voisss.netlify.app/api/agents/themes

# Generate voice (requires payment)
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","voiceId":"21m00Tcm4TlvDq8ikWAM","agentAddress":"0x..."}'

# Check agent info
curl "https://voisss.netlify.app/api/agents/vocalize?agentAddress=0x..."
```

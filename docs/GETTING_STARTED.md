# VOISSS Getting Started Guide

**Last Updated:** February 2026

Quick start guide for setting up and running VOISSS locally.

---

## 📋 Prerequisites

### Required Software
- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Git**: Latest version

### Platform-Specific Requirements

| Platform | Additional Requirements |
|----------|------------------------|
| **Web** | None (browser required) |
| **Mobile (React Native)** | Xcode (iOS), Android Studio (Android) |
| **Flutter** | Flutter SDK 3.27+, Dart SDK 3.6+ |

---

## 🚀 Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/thisyearnofear/VOISSS.git
cd VOISSS
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment Variables

#### Web Platform (Required for Production)

```bash
cd apps/web
cp .env.example .env.local
```

**Essential Variables:**

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_BASE_CHAIN_ID` | Blockchain network (8453 = Base Mainnet) | ✅ |
| `NEXT_PUBLIC_SPENDER_ADDRESS` | Gasless transaction wallet | ✅ |
| `SPENDER_PRIVATE_KEY` | Backend wallet private key | ✅ |
| `NEXT_PUBLIC_ELEVENLABS_API_KEY` | AI voice generation | ✅ |
| `NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS` | Access token contract | ✅ |
| `NEXT_PUBLIC_PAPAJAMS_TOKEN_ADDRESS` | Creator token contract | ✅ |
| `PINATA_API_KEY` | IPFS storage | ✅ |
| `PINATA_API_SECRET` | IPFS storage secret | ✅ |

#### x402 Payment Configuration (For Agent Voice Generation)

| Variable | Purpose |
|----------|---------|
| `CDP_API_KEY_ID` | Coinbase CDP API key ID |
| `CDP_API_KEY_SECRET` | Coinbase CDP API secret |
| `X402_PAY_TO_ADDRESS` | Payment recipient wallet address |

**Get CDP API Keys:**
1. Visit https://portal.cdp.coinbase.com/projects/api-keys
2. Create new API key
3. Copy Key ID and Secret to `.env.local`

### Step 4: Start Development Server

```bash
# Start all platforms
pnpm dev

# Start specific platforms
pnpm dev:web      # Web app (production ready)
pnpm dev:mobile   # React Native (in progress)
```

### Step 5: Access Applications

| Platform | URL / Command | Status |
|----------|--------------|--------|
| **Web** | http://localhost:4445 | ✅ Production Ready |
| **Mobile** | `pnpm android` / `pnpm ios` | 🔄 Development |
| **Flutter** | See mobile-flutter/README | ✅ AI Butler Live |

---

## 🏗️ Platform Setup Details

### Web Platform (Next.js)

**Port:** 4445  
**Status:** Production Ready

```bash
cd apps/web
pnpm dev              # Development server
pnpm build            # Production build
pnpm deploy:base-sepolia  # Deploy contracts to testnet
```

**Key Features:**
- Base Account SDK integration (gasless transactions)
- ElevenLabs voice transformation
- Mission system with token gating
- Agent API with x402 payments

### Mobile Platform (React Native + Expo)

**Status:** In Progress

```bash
cd apps/mobile
pnpm dev              # Start Expo dev server
pnpm android          # Build for Android
pnpm ios              # Build for iOS
```

**Key Features:**
- Native audio recording
- Scroll blockchain integration
- VRF randomness contract
- Privacy controls with zk-proofs

### Flutter Platform (Serverpod Backend)

**API:** https://butler.voisss.famile.xyz/  
**Status:** Live (AI Butler)

```bash
cd apps/mobile-flutter
flutter run           # Run on connected device
serverpod run         # Start backend server
```

**Key Features:**
- Serverpod Dart backend
- Venice AI integration (Llama 3.3 70B)
- PostgreSQL database
- Docker deployment on Hetzner Cloud

---

## 🧪 Testing

### Run Test Suite

```bash
# All tests
pnpm test

# Platform-specific tests
pnpm test:web
pnpm test:mobile
```

### x402 Payment Testing

```bash
# Verify environment configuration
pnpm x402:debug check-env

# Test CDP connection
pnpm x402:debug test-cdp

# Run end-to-end payment test
export TEST_AGENT_PRIVATE_KEY=0xYourPrivateKey
pnpm x402:test
```

**Expected Test Flow:**
1. Check x402 configuration (healthy)
2. Get payment quote (0.001 USDC)
3. Request voice generation (receive 402)
4. Sign EIP-712 payment authorization
5. Retry with X-PAYMENT header
6. Receive audio URL and recording ID

### Agent Integration Testing

```bash
# Test agent verification
curl "https://voisss.netlify.app/api/agents/verify?difficulty=basic"

# Test voice generation with agent headers
curl -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestAgent/1.0 (AI Agent)" \
  -H "X-Agent-ID: test-agent-123" \
  -d '{"text":"Hello","voiceId":"21m00Tcm4TlvDq8ikWAM","agentAddress":"0x..."}'
```

---

## 📦 Monorepo Structure

```
VOISSS/
├── apps/
│   ├── web/              # Next.js 15 + Base integration
│   ├── mobile/           # React Native + Expo + Scroll
│   └── mobile-flutter/   # Flutter + Serverpod backend
├── packages/
│   ├── shared/           # Common utilities, types, services
│   ├── contracts/        # Solidity smart contracts (Base/Scroll)
│   └── ui/               # Shared UI components
├── docs/                 # Documentation (4 consolidated files)
├── scripts/              # Utility and test scripts
└── .env.example          # Environment variable template
```

### Package Dependencies

| Package | Purpose | Key Dependencies |
|---------|---------|------------------|
| `@voisss/shared` | Common types, blockchain services | viem, wagmi |
| `@voisss/contracts` | Smart contract deployment | Hardhat, OpenZeppelin |
| `@voisss/ui` | Shared UI components | React, Tailwind CSS |

---

## 🔧 Common Issues & Solutions

### Issue: "CDP API keys not configured"
**Solution:** Verify `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` in `.env.local`, restart dev server.

### Issue: "Invalid x402PayTo address"
**Solution:** Ensure `X402_PAY_TO_ADDRESS` is valid Ethereum address (0x + 42 characters).

### Issue: "Payment verification failed"
**Solution:** 
- Verify CDP API keys are valid
- Ensure agent wallet has USDC balance on Base
- Try mock facilitator for local testing

### Issue: "Insufficient balance"
**Solution:** Agent needs USDC on Base mainnet. Get USDC via Uniswap or use mock facilitator.

### Issue: "Facilitator error (401)"
**Solution:** CDP API keys invalid or expired. Generate new keys at https://portal.cdp.coinbase.com

---

## 🌐 Network Configuration

### Base Network (Web Platform)

| Network | Chain ID | RPC URL | Block Explorer |
|---------|----------|---------|----------------|
| **Mainnet** | 8453 | https://mainnet.base.org | https://basescan.org |
| **Sepolia** | 84532 | https://sepolia.base.org | https://sepolia.basescan.org |

### Scroll Network (Mobile Platform)

| Network | Chain ID | RPC URL | Block Explorer |
|---------|----------|---------|----------------|
| **Mainnet** | 534352 | https://rpc.scroll.io | https://scrollscan.com |
| **Sepolia** | 534351 | https://sepolia-rpc.scroll.io | https://sepolia.scrollscan.com |

### Testnet Faucets

- **Base Sepolia**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Scroll Sepolia**: https://sepolia.scroll.io/faucet

---

## 📚 Next Steps

After setup, explore these resources:

1. **[DOCS_OVERVIEW.md](./DOCS_OVERVIEW.md)** - Platform summary and live links
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and technology decisions
3. **[AGENT_INTEGRATION.md](./AGENT_INTEGRATION.md)** - AI assistant and external agent API
4. **[BLOCKCHAIN_GUIDE.md](./BLOCKCHAIN_GUIDE.md)** - Smart contracts and token economics

---

## 🤝 Support & Community

- **GitHub Issues**: Report bugs and feature requests
- **Telegram**: https://t.me/+jG3_jEJF8YFmOTY1
- **Documentation**: See `/docs` directory for comprehensive guides

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

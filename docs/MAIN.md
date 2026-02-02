# VOISSS Documentation

Welcome to the VOISSS documentation. VOISSS is a decentralized AI-powered voice recording platform that transforms how we capture, organize, and share audio content.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Blockchain Integration](#blockchain-integration)
4. [Deployment Guide](#deployment-guide)
5. [Platform-Specific Guides](#platform-specific-guides)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Git**
- **Flutter SDK** (for mobile-flutter platform)
- **Dart SDK** (for Serverpod backend)

### Quick Start (5 minutes)

#### 1. Clone the Repository
```bash
git clone https://github.com/thisyearnofear/VOISSS.git
cd VOISSS
```

#### 2. Install Dependencies
```bash
pnpm install
```

#### 3. Configure Environment Variables

##### For Web Platform:
```bash
cd apps/web
cp .env.example .env.local
```

Add your keys to `.env.local`:
```env
# Required for deployment
SPENDER_PRIVATE_KEY=your_private_key_here

# Required for Base chain integration (Mainnet)
NEXT_PUBLIC_SPENDER_ADDRESS=your_spender_address
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# Required for IPFS (existing)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret

# Required for AI features (existing)
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id # Optional: For official conversational AI

# Contract addresses (Base Mainnet)
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS=0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07
NEXT_PUBLIC_PAPAJAMS_TOKEN_ADDRESS=0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c
NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c
NEXT_PUBLIC_CREATOR_MIN_BALANCE=1000000000000000000000000

# x402 Configuration
NEXT_PUBLIC_X402_VERSION=2
NEXT_PUBLIC_X402_CONTRACT_NAME=x402
```

#### 4. Start Development

##### Web Platform (Production Ready):
```bash
cd apps/web
pnpm dev
```
Open your browser to `http://localhost:4445`

##### Mobile Platform (Functional, needs completion):
```bash
cd apps/mobile
pnpm dev
```
Scan the QR code with Expo Go app

##### Flutter Platform (Serverpod Backend):
```bash
# Start Serverpod backend
cd apps/flutter-backend-serverpod
dart pub get
docker compose up -d voisss_butler_postgres
dart bin/main.dart --apply-migrations
dart bin/main.dart

# In another terminal, start Flutter app
cd apps/mobile-flutter
flutter pub get
flutter run -d chrome  # or ios, android, macos
```

## Architecture & Technology Stack

### Monorepo Structure
VOISSS is built as a **monorepo** using pnpm workspaces and Turbo for optimal development experience and code sharing across platforms.

```
voisss/
├── apps/
│   ├── web/                   # Next.js 14 + Base Account SDK
│   ├── mobile/                # React Native + Expo
│   └── mobile-flutter/        # Flutter + Serverpod
├── packages/
│   ├── shared/                # Common utilities
│   ├── contracts/             # Solidity smart contracts
│   └── ui/                    # Shared components
└── docs/                      # Documentation
```

### Technology Stack

#### Frontend Frameworks
- **Web**: Next.js 14 with App Router, TypeScript, Tailwind CSS - **PRODUCTION READY**
- **Mobile (RN)**: React Native with Expo Router, TypeScript - **FUNCTIONAL, NEEDS COMPLETION**
- **Mobile (Flutter)**: Flutter with Dart - **SERVERPOD BACKEND IMPLEMENTED**

#### Blockchain Integration
- **Base Chain**: Solidity smart contracts on Base Sepolia testnet
- **Scroll Chain**: Solidity smart contracts on Scroll Sepolia testnet
- **Web3 Libraries**: Base Account SDK (Web/RN), viem/wagmi for contract interactions
- **Wallets**: Base Account integration with Sub Accounts for gasless transactions

#### AI & Audio
- **Voice AI**: ElevenLabs API for voice transformation & Conversational AI (WebSocket)
- **Intelligence**: Google Gemini 3.0 Flash (via ElevenLabs Agent or direct API)
- **Audio Processing**: Web Audio API, React Native Audio
- **Storage**: IPFS for decentralized content storage

## Blockchain Integration

### Current Active Blockchains

#### 1. Base (Web Platform)
- **Network**: Base Sepolia (Testnet) / Base Mainnet
- **Chain ID**: 84532 (Sepolia) / 8453 (Mainnet)
- **RPC URL**: https://sepolia.base.org (Sepolia) / https://mainnet.base.org (Mainnet)
- **Block Explorer**: https://sepolia.basescan.org (Sepolia) / https://basescan.org (Mainnet)
- **Purpose**: Recording storage, ownership, gasless transactions via Base Account SDK

#### 2. Scroll (Mobile Platform)
- **Network**: Scroll Sepolia (Testnet) / Scroll Mainnet
- **Chain ID**: 534351 (Sepolia) / 534352 (Mainnet)
- **RPC URL**: https://sepolia-rpc.scroll.io/ (Sepolia) / https://rpc.scroll.io/ (Mainnet)
- **Block Explorer**: https://sepolia.scrollscan.com (Sepolia) / https://scrollscan.com (Mainnet)
- **Purpose**: VRF randomness, privacy controls, access management

### Deployed Smart Contracts

#### Base Contracts (Live on Base Mainnet)

| Contract | Address | Version | Purpose |
|----------|---------|---------|---------|
| AgentRegistry | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` | v2.0.0 | Agent registration, USDC credit management |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | - | Payment token for credits |
| $VOISSS Token | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` | - | Access tiers and premium features |
| $PAPAJAMS Token | `0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c` | - | Creator rewards and mission staking |

#### Scroll Contracts (Live on Scroll Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| ScrollVRF | `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208` | Fair randomness for voice style selection |
| ScrollPrivacy | `0x0abD2343311985Fd1e0159CE39792483b908C03a` | Private recording storage with zk proofs |

### Platform-to-Chain Mapping

| Platform | Location | Primary Chain | Status | Purpose |
|----------|----------|---------------|--------|---------|
| **Web dApp** | `apps/web` | Base Mainnet | Production Ready | Agent registry, USDC payments, voice generation |
| **Mobile RN** | `apps/mobile` | Scroll Sepolia | In Progress | VRF randomness, privacy controls, access management |
| **Flutter Butler** | `apps/mobile-flutter` | — | Live | AI assistant (no blockchain - Serverpod architecture) |

### Token Systems

#### $VOISSS Token (Base Chain)
- **Purpose**: Access tiers and premium feature unlocks
- **Contract Address**: `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07`
- **Decimals**: 18
- **Tiers**:
  - **Freemium**: 0 tokens (1 free transform/session)
  - **Basic**: 10k tokens (Unlimited transforms, dubbing)
  - **Pro**: 50k tokens (Priority processing, advanced voices)
  - **Premium**: 250k tokens (VIP Lane mode, creator tools)

#### $PAPAJAMS Token (Base Chain)
- **Purpose**: Creator requirements and mission rewards
- **Contract Address**: `0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c`
- **Decimals**: 18
- **Creator Minimum**: 1M tokens to create missions
- **Reward Distribution**: 70% $papajams, 30% $voisss

## Deployment Guide

### Pre-Deployment Checklist

#### 1. Generate Spender Wallet (Web Platform)

```bash
# Generate new wallet for production
node -e "
const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');
const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);
console.log('🔑 Private Key (KEEP SECRET!):', pk);
console.log('📍 Address:', account.address);
"
```

#### 2. Fund Spender Wallet

```bash
# Send ETH to spender address for gas fees
# Recommended: 0.5 - 1 ETH for production

# Check balance
cast balance 0xYOUR_SPENDER_ADDRESS --rpc-url https://mainnet.base.org
```

#### 3. Update Environment Variables

Refer to the environment variable sections in the Getting Started section above.

### Deployment Steps

#### 1. Build & Test Locally

```bash
# Install dependencies
pnpm install

# Build project
pnpm build

# Test locally
pnpm dev

# Verify:
# - Wallet connection works
# - Permission grant flow works
# - Gasless save works
# - No console errors
```

#### 2. Deploy Web Platform

##### Using Vercel:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to staging
vercel --env NODE_ENV=staging

# Deploy to production
vercel --prod --env NODE_ENV=production
```

#### 3. Deploy Mobile Platform

```bash
# Build for production
cd apps/mobile
pnpm build

# Deploy to Expo
pnpm expo publish

# Or build native binaries
pnpm expo run:android  # Generate APK/IPA
pnpm expo run:ios
```

#### 4. Deploy Serverpod Backend (Flutter)

```bash
# SSH into production server
ssh your-server

# Navigate to Serverpod directory
cd /path/to/voisss-butler-server

# Pull latest code
git pull origin main

# Install dependencies
dart pub get

# Run migrations
dart bin/main.dart --apply-migrations

# Restart services with Docker
docker compose down
docker compose up -d

# Check logs
docker logs -f voisss_butler_server
```

### Post-Deployment Monitoring

#### Monitor Spender Wallet (Web)
- Check balance regularly
- Set up alerts for low balance (< 0.1 ETH)

#### Setup Alerts
- Low balance notifications
- Failed transaction monitoring
- API performance metrics

## Platform-Specific Guides

### Web Platform (Base Integration) - ✅ PRODUCTION READY

#### Key Features
- **Gasless Transactions**: Base Account SDK enables gasless transactions via Sub Accounts
- **AI Voice Transformation**: Full ElevenLabs integration with 29+ languages
- **Multi-Language Dubbing**: 29+ languages with native accents
- **Mission System**: Token-based rewards and milestone distribution

#### Environment Variables
See the Web Platform section in Getting Started.

### Mobile Platform (Scroll Integration) - ⚠️ FUNCTIONAL BUT INCOMPLETE

#### Key Features
- **Native Audio Recording**: expo-audio integration for native recording
- **ScrollVRF Contract**: Verifiable randomness for fair voice style selection
- **ScrollPrivacy Contract**: Private recording storage with zk-proof access control

#### Environment Variables
```bash
# Scroll Chain Configuration
EXPO_PUBLIC_SCROLL_VRF_ADDRESS=0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208
EXPO_PUBLIC_SCROLL_PRIVACY_ADDRESS=0x0abD2343311985Fd1e0159CE39792483b908C03a
EXPO_PUBLIC_SCROLL_CHAIN_ID=534351
EXPO_PUBLIC_SCROLL_RPC=https://sepolia-rpc.scroll.io/

# AI Services
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_api_key
```

### Flutter Platform (Serverpod Backend) - ✅ LIVE

#### Key Features
- **AI-Powered Chat**: Natural language conversations with Venice AI (Llama 3.3 70B)
- **Voice Recording Management**: High-quality audio recording and organization
- **Serverpod Backend**: Full stack Dart development with type-safe API

#### Live API: `https://butler.voisss.famile.xyz/`

## Troubleshooting

### Common Issues:
- **Wallet Connection Issues**: Ensure Base wallet is installed and connected
- **AI Service Issues**: Verify ElevenLabs API key is correctly set
- **IPFS Upload Issues**: Verify Pinata credentials are correct
- **Smart Contract Issues**: Check contract addresses match deployed contracts

### Need Help?
- Check the architecture and environment setup
- Verify all prerequisites are met
- Review the deployment steps carefully
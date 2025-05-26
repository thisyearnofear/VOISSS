# VOISSS Web App 🌐

> Next.js-based decentralized web application for VOISSS voice recording platform

The web app provides a comprehensive interface for discovering, managing, and sharing voice recordings on Starknet. Built with Next.js 15, Starknet.js, and modern web technologies.

## ✅ **CURRENT STATUS: WORKING**

- ✅ **Development Server**: Running on http://localhost:3001
- ✅ **Build System**: Next.js building successfully
- ✅ **Starknet Integration**: StarknetConfig with providers setup
- ✅ **Shared Components**: Using @voisss/ui and @voisss/shared packages
- ✅ **Tailwind CSS**: Styling system working correctly
- ✅ **TypeScript**: Full type safety implemented
- ✅ **Hot Reload**: Development workflow optimized

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (installed from root)
- Starknet development tools (optional for contract development):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
  cargo install starkli
  ```

### Development Setup

1. **From the project root**, install all dependencies:

   ```bash
   pnpm install
   ```

2. **Set up environment variables**:

   ```bash
   cd apps/web
   cp env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   # Starknet Configuration
   NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
   NEXT_PUBLIC_STARKNET_NETWORK=sepolia
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id

   # Contract Addresses (Deployed on Starknet Sepolia)
   NEXT_PUBLIC_VOICE_STORAGE_ADDRESS=0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2
   NEXT_PUBLIC_USER_REGISTRY_ADDRESS=0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63
   NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5
   ```

3. **Start development server**:

   ```bash
   # From project root
   pnpm dev:web

   # Or from apps/web directory
   pnpm dev
   ```

   Open [http://localhost:3001](http://localhost:3001) in your browser.

## 🛠 Tech Stack

- **Framework**: Next.js 15.3.2 with TypeScript
- **Blockchain**: Starknet.js + Starknet React
- **Styling**: Tailwind CSS 4
- **Build Tool**: Turbopack for fast development
- **State Management**: React Context + Zustand
- **Shared Dependencies**: `@voisss/shared`, `@voisss/ui`

## 🔗 Starknet Integration

### Wallet Connection

- **Starknetkit** for wallet connection and management
- Support for ArgentX, Braavos, and other Starknet wallets
- Automatic network detection and switching

### Smart Contract Interaction ✅ **DEPLOYED & READY**

**Live Contracts on Starknet Sepolia:**

- **UserRegistry**: `0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63`
- **VoiceStorage**: `0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2`
- **AccessControl**: `0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5`

**Features:**

- Recording metadata storage on Starknet
- User profile and social features
- Privacy controls and access management
- Decentralized ownership verification

### Key Features

- **Wallet Integration**: Connect with popular Starknet wallets
- **Recording Discovery**: Browse and search public recordings
- **Creator Dashboard**: Manage your recordings and earnings
- **Cross-platform Sync**: Sync with mobile app via Starknet

## 🧪 Testing & Building

```bash
# Run tests
pnpm test

# Run contract tests (from project root)
cd ../../packages/contracts
scarb test

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Web-specific React components
│   ├── hooks/            # Web-specific React hooks
│   ├── lib/              # Utility functions and configurations
│   └── styles/           # Global styles and Tailwind config
├── public/               # Static assets
├── env.example           # Environment variables template
└── package.json          # Web app dependencies
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests

## 📚 Related Documentation

- [Main Project README](../../README.md) - Project overview and setup
- [Mobile App README](../mobile/README.md) - Mobile app documentation
- [Shared Package](../../packages/shared/README.md) - Shared utilities and types
- [Smart Contracts](../../packages/contracts/README.md) - Cairo contracts

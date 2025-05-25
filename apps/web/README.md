# VOISSS Web App

## Getting Started

### Prerequisites

1. Install Node.js 18+ and pnpm 8+
2. Install Starknet tools:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
   cargo install starkli
   npm install -g @starknet-devnet/cli
   ```

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cp env.example .env.local
   ```

   Then edit `.env.local` with your configuration.

3. Start the development server:
   ```bash
   pnpm dev
   ```

### Development

The app is built with:

- Next.js for the frontend framework
- Starknet.js for blockchain interaction
- Starknet React for React hooks
- TailwindCSS for styling

### Starknet Integration

The app comes with:

- Wallet connection using Starknetkit
- Basic contract interaction setup
- Type-safe contract bindings using Cainome

### Testing

```bash
# Run frontend tests
pnpm test

# Run contract tests (from root)
cd ../../packages/contracts
scarb test
```

### Building for Production

```bash
pnpm build
pnpm start
```

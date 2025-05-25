# VOISSS Web Application

## Overview

VOISSS's web application is built with modern web technologies and Starknet integration, providing a seamless and secure decentralized experience for voice NFT minting and trading.

## Technology Stack

### Frontend

- **Next.js** - React framework for production-grade applications
- **TypeScript** - For type-safe development
- **Starknet.js** - Core library for Starknet interaction
- **Starknet React** - React hooks for Starknet integration
- **Starknetkit** - Wallet connection kit by Argent
- **TailwindCSS** - For styling and UI components

### Smart Contract Integration

- **Cairo** - Smart contract programming language
- **Scarb** - Package manager and build toolchain for Cairo
- **Starknet Foundry** - Development and testing framework
- **Cainome** - For generating TypeScript bindings from Cairo ABI
- **Starknet Deploy** - Contract deployment and management

### Development Tools

- **Starknet Devnet** - Local development network
- **Walnut** - For transaction debugging and contract testing
- **Starkli** - CLI tool for Starknet interaction
- **RPC Request Builder** - For testing JSON RPC requests

## Architecture

### Core Components

1. **Wallet Integration**

   - Support for ArgentX, Braavos, and other Starknet wallets
   - Seamless connection using Starknetkit
   - Transaction signing and account management

2. **Smart Contract Interaction**

   - Generated TypeScript bindings using Cainome
   - Type-safe contract calls
   - Event listening and state management

3. **State Management**

   - React Context for global state
   - Starknet React hooks for blockchain state
   - Local storage for user preferences

4. **UI/UX**
   - Responsive design
   - Progressive loading
   - Transaction feedback and notifications

## Development Setup

### Prerequisites

```bash
# Install core dependencies
npm install

# Install Starknet tools
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
cargo install starkli
npm install -g @starknet-devnet/cli
```

### Environment Setup

```bash
# Copy example env file
cp .env.example .env.local

# Configure environment variables
# STARKNET_RPC_URL=
# STARKNET_NETWORK=
# WALLET_CONNECT_PROJECT_ID=
```

### Development Workflow

1. Start local devnet:

   ```bash
   starknet-devnet
   ```

2. Deploy contracts:

   ```bash
   scarb build
   starkli deploy ...
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Testing

```bash
# Run contract tests
snforge test

# Run frontend tests
npm test
```

## Best Practices

### Smart Contract Integration

- Use Cainome for type-safe contract bindings
- Implement proper error handling for contract calls
- Use Walnut for debugging transactions
- Follow the account abstraction pattern

### Frontend Development

- Implement progressive loading for better UX
- Use TypeScript for all components
- Follow React best practices and hooks pattern
- Implement proper error boundaries

### Security

- Never expose private keys or sensitive data
- Implement proper transaction confirmation flows
- Use appropriate rate limiting
- Follow Starknet security best practices

## Deployment

### Testnet Deployment

1. Deploy contracts to Sepolia testnet
2. Update contract addresses in configuration
3. Deploy frontend to staging environment

### Production Deployment

1. Security audit of smart contracts
2. Deploy contracts to Starknet mainnet
3. Update production configuration
4. Deploy frontend to production

## Documentation & Resources

### Key References

- [Starknet Documentation](https://docs.starknet.io)
- [Starknet By Example](https://starknet-by-example.voyager.online)
- [Cairo Book](https://book.cairo-lang.org)
- [Starknet React Documentation](https://react.starknet.io)

### Tools

- [Voyager Block Explorer](https://voyager.online)
- [Starknet RPC Request Builder](https://rpc-request-builder.voyager.online)
- [Walnut Debugger](https://walnut.dev)

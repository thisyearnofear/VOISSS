# VOISSS Smart Contracts

Starknet smart contracts for the VOISSS decentralized voice recording platform.

## Contracts

### VoiceStorage
- Stores voice recording metadata on-chain
- Manages IPFS hashes for decentralized storage
- Handles ownership and access control

### UserRegistry
- User registration and profile management
- Reputation system for content creators
- Social features and following system

## Development

```bash
# Build contracts
npm run build

# Run tests
npm run test

# Deploy to testnet
npm run deploy:testnet
```

## Architecture

The contracts are designed to be gas-efficient while providing:
- Decentralized storage references
- Ownership verification
- Content monetization (future)
- Community governance (future)

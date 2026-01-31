# VOISSS Blockchain Inventory

> Central reference for all blockchain integrations across the VOISSS ecosystem.

## Overview

VOISSS currently operates across three blockchain networks (Base, Scroll, Starknet) depending on the platform and feature set. This document serves as the single source of truth for chain usage, contract addresses, and architectural decisions.

---

## Platform-to-Chain Mapping

| Platform | Location | Primary Chain | Status | Purpose |
|----------|----------|---------------|--------|---------|
| **Web dApp** | `apps/web` | Base Sepolia | Production Ready | Recording storage, ownership, gasless transactions |
| **Mobile RN** | `apps/mobile` | Scroll Sepolia | In Progress | VRF randomness, privacy controls, access management |
| **Flutter Butler** | `apps/mobile-flutter` | — | Live | AI assistant (no blockchain - Serverpod architecture) |
| **Legacy Contracts** | `packages/contracts` | Starknet Sepolia | Archived | Cairo contracts (reference only) |

---

## Web Platform (Base)

### Network Details
- **Chain**: Base Sepolia (Testnet)
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org

### Smart Contracts
| Contract | Address | Purpose |
|----------|---------|---------|
| VoiceRecords | Variable | Recording metadata, ownership, permissions |

### Key Features
- Gasless transactions via Base Account SDK Sub Accounts
- Wagmi/Viem for wallet interactions
- On-chain recording provenance
- Gasless recording saves

### Environment Variables
```bash
NEXT_PUBLIC_BASE_CHAIN_ID=84532
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_VOISSS_CONTRACT_ADDRESS=<deployed_address>
```

---

## Mobile Platform (Scroll)

### Network Details
- **Chain**: Scroll Sepolia (Testnet)
- **Chain ID**: 534353
- **RPC URL**: https://sepolia-rpc.scroll.io/
- **Block Explorer**: https://sepolia.scrollscan.com

### Smart Contracts
| Contract | Address | Purpose |
|----------|---------|---------|
| ScrollVRF | `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208` | Fair randomness for voice style selection |
| ScrollPrivacy | `0x0abD2343311985Fd1e0159CE39792483b908C03a` | Private recording storage with zk proofs |

### Key Features
- **ScrollVRF**: Verifiable randomness for unbiased voice style selection
- **ScrollPrivacy**: Private recordings with zk-proof access control
- **Access Management**: Time-based permissions and share links
- **Gas Efficiency**: 60-80% cheaper than Ethereum mainnet

### Environment Variables
```bash
EXPO_PUBLIC_SCROLL_VRF_ADDRESS=0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208
EXPO_PUBLIC_SCROLL_PRIVACY_ADDRESS=0x0abD2343311985Fd1e0159CE39792483b908C03a
EXPO_PUBLIC_SCROLL_CHAIN_ID=534353
EXPO_PUBLIC_SCROLL_RPC=https://sepolia-rpc.scroll.io/
```

---

## Flutter Platform (No Blockchain)

### Architecture
- **Backend**: Serverpod (Dart) on Hetzner Cloud
- **AI**: Venice AI (Llama 3.3 70B)
- **Database**: PostgreSQL
- **API**: HTTPS + WebSocket

### Why No Blockchain?
The Flutter app ("VOISSS Butler") is architected as an AI assistant rather than a recording studio. It uses:
- Serverpod for real-time WebSocket updates
- Venice AI for conversational intelligence
- PostgreSQL for persistent state

Future blockchain integration would require architectural changes to the Serverpod backend.

---

## Legacy: Starknet Contracts

### Status: Archived (Reference Only)

The original VOISSS contracts were written in Cairo for Starknet Sepolia. These remain in the repository for reference but are not actively deployed or integrated.

### Contracts
| Contract | Address (Legacy) | Status |
|----------|------------------|--------|
| VoiceStorage | `0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2` | Archived |
| UserRegistry | `0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63` | Archived |
| AccessControl | `0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5` | Archived |

### Files
- `packages/contracts/src/voice_storage.cairo`
- `packages/contracts/src/user_registry.cairo`
- `packages/contracts/src/access_control.cairo`

---

## Cross-Platform Considerations

### Current State
- **Web** and **Mobile** use different chains (Base vs Scroll)
- **Flutter** has no blockchain layer
- No cross-chain bridging or synchronization currently implemented

### Implications
1. **Wallet Fragmentation**: Users need separate wallet configurations for web vs mobile
2. **Asset Isolation**: Recordings stored on Scroll (mobile) cannot be accessed from Base (web)
3. **Development Overhead**: Maintaining two contract ecosystems (Solidity + Cairo)

### Future Consolidation Options

#### Option 1: Unify on Base
- Migrate mobile to Base Sepolia
- Reuse web contracts across all platforms
- Single wallet experience for users
- Requires: Mobile contract migration, VRF/privacy alternatives

#### Option 2: Stay Multi-Chain
- Accept chain-specific use cases (Base for storage, Scroll for VRF)
- Build cross-chain indexing layer
- Requires: Significant engineering effort, bridge dependencies

#### Option 3: Platform-Specific Chains
- Web → Base (storage-focused)
- Mobile → Scroll (privacy/VRF-focused)
- Document clear separation
- Requires: User education, separate UX flows

---

## Contract Deployment Addresses

### Base Sepolia (Web)
```typescript
export const BASE_SEPOLIA_CONTRACTS = {
  VOICE_RECORDS: process.env.NEXT_PUBLIC_VOISSS_CONTRACT_ADDRESS,
  CHAIN_ID: 84532,
};
```

### Scroll Sepolia (Mobile)
```typescript
export const SCROLL_SEPOLIA_CONTRACTS = {
  VRF: "0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208",
  PRIVACY: "0x0abD2343311985Fd1e0159CE39792483b908C03a",
  CHAIN_ID: 534353,
};
```

---

## Faucets & Testnet Resources

### Base Sepolia
- Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Bridge: https://sepolia.base.org/

### Scroll Sepolia
- Faucet: https://sepolia.scroll.io/faucet
- Bridge: https://sepolia.scroll.io/bridge

---

## Contributing

When adding new blockchain features:
1. Update this inventory document
2. Add environment variables to `.env.example` files
3. Update platform-specific READMEs
4. Ensure cross-platform documentation consistency

---

## Questions?

- **Web/Base**: See `apps/web/README.md`
- **Mobile/Scroll**: See `apps/mobile/README.md`
- **Flutter**: See `apps/mobile-flutter/README.md`
- **Contracts**: See `packages/contracts/README.md`

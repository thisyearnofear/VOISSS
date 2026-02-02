# VOISSS Blockchain Integration

## Overview

VOISSS operates across multiple blockchain networks depending on the platform and feature set. This document serves as the single source of truth for chain usage, contract addresses, and architectural decisions.

## Active Blockchains

### Base (Web Platform)
- **Network**: Base Sepolia (Testnet) / Base Mainnet
- **Chain ID**: 84532 (Sepolia) / 8453 (Mainnet)
- **RPC URL**: https://sepolia.base.org (Sepolia) / https://mainnet.base.org (Mainnet)
- **Block Explorer**: https://sepolia.basescan.org (Sepolia) / https://basescan.org (Mainnet)
- **Purpose**: Recording storage, ownership, gasless transactions via Base Account SDK

### Scroll (Mobile Platform)
- **Network**: Scroll Sepolia (Testnet) / Scroll Mainnet
- **Chain ID**: 534351 (Sepolia) / 534352 (Mainnet)
- **RPC URL**: https://sepolia-rpc.scroll.io/ (Sepolia) / https://rpc.scroll.io/ (Mainnet)
- **Block Explorer**: https://sepolia.scrollscan.com (Sepolia) / https://scrollscan.com (Mainnet)
- **Purpose**: VRF randomness, privacy controls, access management

## Deployed Smart Contracts

### Scroll Contracts (Live on Scroll Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| ScrollVRF | `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208` | Fair randomness for voice style selection |
| ScrollPrivacy | `0x0abD2343311985Fd1e0159CE39792483b908C03a` | Private recording storage with zk proofs |

## Platform Integration

### Web Platform (Base Integration)
- **Gasless Transactions**: Base Account SDK enables gasless transactions via Sub Accounts
- **Spender Wallet**: Backend wallet pays gas fees for users
- **User Experience**: No wallet popups after initial setup
- **Contract Interactions**: Recording storage and retrieval

### Mobile Platform (Scroll Integration)
- **ScrollVRF Contract**: Verifiable randomness for fair voice style selection
- **ScrollPrivacy Contract**: Private recording storage with zk-proof access control
- **Gas Efficiency**: 60-80% cheaper than Ethereum mainnet
- **Access Control**: Time-based permissions and share links

## Token Systems

### $VOISSS Token (Base Chain)
- **Purpose**: Access tiers and premium feature unlocks
- **Contract Address**: `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07`
- **Decimals**: 18
- **Tiers**:
  - **Freemium**: 0 tokens (1 free transform/session)
  - **Basic**: 10k tokens (Unlimited transforms, dubbing)
  - **Pro**: 50k tokens (Priority processing, advanced voices)
  - **Premium**: 250k tokens (VIP Lane mode, creator tools)

### $PAPAJAMS Token (Base Chain)
- **Purpose**: Creator requirements and mission rewards
- **Contract Address**: `0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c`
- **Decimals**: 18
- **Creator Minimum**: 1M tokens to create missions
- **Reward Distribution**: 70% $papajams, 30% $voisss

## Token Access System

### Holding Tiers (No Transaction Signing)
| Tier | Balance | Features |
|------|---------|----------|
| **Freemium** | None | 1 free AI transform/session, basic recording |
| **Basic** | 10k+ $voisss | Unlimited transforms, dubbing, transcription |
| **Pro** | 50k+ $voisss | Priority processing, advanced voices, multi-language |
| **Premium** | 250k+ $voisss | VIP Lane mode, creator tools, mission creation |

### Burn Actions (Premium Outputs)
| Action | Cost | Purpose |
|--------|------|---------|
| Video Export | 5k $voisss | Shareable transcript video |
| NFT Mint | 2k $voisss | On-chain recording artifact |
| White-Label Export | 10k $voisss | Remove branding for commercial use |

## Mission System

### Creator Economy
- **Token Gating**: Mission creation requires minimum $papajams balance (1M tokens)
- **Milestone Rewards**: 50% for submission, 30% for quality approval, 20% for featuring
- **Auto-Publishing**: Missions published immediately after creation
- **Auto-Expiration**: Automatic cleanup of expired missions

## Environment Variables

### Web Platform (Base)
```bash
# Base Chain Configuration
NEXT_PUBLIC_BASE_CHAIN_ID=84532
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org

# Contract Addresses
NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS=0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07
NEXT_PUBLIC_PAPAJAMS_TOKEN_ADDRESS=0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c
NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c

# Spender Wallet
NEXT_PUBLIC_SPENDER_ADDRESS=0xspender_address
```

### Mobile Platform (Scroll)
```bash
# Scroll Chain Configuration
EXPO_PUBLIC_SCROLL_VRF_ADDRESS=0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208
EXPO_PUBLIC_SCROLL_PRIVACY_ADDRESS=0x0abD2343311985Fd1e0159CE39792483b908C03a
EXPO_PUBLIC_SCROLL_CHAIN_ID=534351
EXPO_PUBLIC_SCROLL_RPC=https://sepolia-rpc.scroll.io/
```

## Legacy Blockchain (Archived)

### Starknet (Previously Active)
The original VOISSS contracts were written in Cairo for Starknet Sepolia. These remain in the repository for reference but are not actively deployed or integrated.

## Cross-Platform Considerations

### Current State
- **Web** and **Mobile** use different chains (Base vs Scroll)
- **Flutter** has no blockchain layer
- No cross-chain bridging or synchronization currently implemented

## Faucets & Testnet Resources

### Base Sepolia
- Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Bridge: https://sepolia.base.org/

### Scroll Sepolia
- Faucet: https://sepolia.scroll.io/faucet
- Bridge: https://sepolia.scroll.io/bridge
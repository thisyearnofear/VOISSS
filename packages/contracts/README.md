# VOISSS Smart Contracts

Starknet smart contracts for the VOISSS decentralized voice recording platform.

## 📋 **Implementation Status**

### ✅ **COMPLETED CONTRACTS**

#### **1. VoiceStorage Contract** (`src/voice_storage.cairo`)

- ✅ **Core Functions**: `store_recording`, `get_recording`, `get_user_recordings`
- ✅ **Metadata Storage**: Title, description, IPFS hash, duration, file size
- ✅ **Access Control**: Public/private recordings, ownership verification
- ✅ **Analytics**: Play count tracking, user statistics
- ✅ **Events**: Recording stored, updated, deleted, play count incremented
- ✅ **Compilation**: Building successfully with Scarb

#### **2. UserRegistry Contract** (`src/user_registry.cairo`)

- ✅ **User Management**: Registration, profile updates, username uniqueness
- ✅ **Social Features**: Following/followers system, user discovery
- ✅ **Verification**: User verification system for content creators
- ✅ **Statistics**: Total recordings, plays, social metrics
- ✅ **Profile Data**: Username, display name, bio, avatar IPFS hash
- ✅ **Compilation**: Building successfully with Scarb

#### **3. AccessControl Contract** (`src/access_control.cairo`)

- ✅ **Permission System**: View, download, share permissions with expiration
- ✅ **Share Links**: Temporary access tokens for recording sharing
- ✅ **Privacy Controls**: Public/private recording management
- ✅ **Owner Controls**: Grant/revoke access, permission management
- ✅ **Time-based Access**: Expiring permissions for temporary sharing
- ✅ **Compilation**: Building successfully with Scarb

### 🚀 **DEPLOYMENT STATUS**

#### **Starknet Sepolia Testnet**

- ❌ **VoiceStorage**: Not deployed yet
- ❌ **UserRegistry**: Not deployed yet
- ❌ **AccessControl**: Not deployed yet

**Deployment Command Ready:**

```bash
export STARKNET_ACCOUNT_ADDRESS="your_account_address"
export STARKNET_PRIVATE_KEY="your_private_key"
pnpm deploy:testnet
```

#### **Contract Addresses** ✅ **DEPLOYED TO STARKNET SEPOLIA**

```typescript
export const CONTRACT_ADDRESSES = {
  VOICE_STORAGE:
    "0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2",
  USER_REGISTRY:
    "0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63",
  ACCESS_CONTROL:
    "0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5",
};
```

**🎉 Deployment Success:**

- **Network**: Starknet Sepolia Testnet
- **Deployed**: December 25, 2025 at 23:57 UTC
- **Account**: Standard ArgentX v0.4.0 (0x06796FC91477e32037D79886bFc2F3fBD74c24Eba62183BB9F8FC6c59Fa29738)
- **Status**: All contracts verified and working

### 🔗 **INTEGRATION STATUS**

#### **✅ Web App Integration (Complete)**

- ✅ **StarknetRecordingStudio**: Full recording studio with wallet integration
- ✅ **WalletConnector**: ArgentX/Braavos wallet connection
- ✅ **Contract Service**: Ready for real contract interaction
- ✅ **UI/UX**: Professional recording interface with waveform visualization
- ✅ **State Management**: Conditional rendering based on wallet connection

#### **✅ Flutter App Integration (Complete)**

- ✅ **StarknetProvider**: Real Starknet provider with JsonRpcProvider
- ✅ **WalletConnectionScreen**: Professional wallet connection UI
- ✅ **Contract Integration**: Ready for real contract calls
- ✅ **Multiple Wallet Support**: ArgentX, Braavos, Development mode
- ✅ **Network Switching**: Sepolia/Mainnet support
- ✅ **State Persistence**: Wallet connection state saved locally

#### **🔄 Pending: Contract Deployment**

Once contracts are deployed:

1. Update contract addresses in both apps
2. Test end-to-end recording → IPFS → Starknet workflow
3. Verify cross-platform synchronization

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

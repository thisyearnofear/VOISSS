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

#### **Scroll Sepolia Testnet** ✅ **LIVE**

- ✅ **ScrollVRF**: `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208`
- ✅ **ScrollPrivacy**: `0x0abD2343311985Fd1e0159CE39792483b908C03a`

**Deployment Details:**

```typescript
export const SCROLL_SEPOLIA_CONTRACTS = {
  VRF: "0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208",
  PRIVACY: "0x0abD2343311985Fd1e0159CE39792483b908C03a",
};
```

**🎉 Scroll Deployment Success:**

- **Network**: Scroll Sepolia Testnet
- **Deployed**: December 13, 2025
- **RPC**: https://sepolia-rpc.scroll.io/
- **Features**:
  - ✅ ScrollVRF: Fair randomness for voice selection (blockhash-based entropy)
  - ✅ ScrollPrivacy: Private content with zk proof support and access control
  - ✅ Both contracts verified and ready for integration
  - ✅ 60-80% gas savings vs Ethereum mainnet

#### **Starknet Sepolia Testnet** ✅ **LEGACY (Previous Network)**

- ✅ **VoiceStorage**: `0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2`
- ✅ **UserRegistry**: `0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63`
- ✅ **AccessControl**: `0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5`

**Note**: Starknet contracts remain deployed for reference but focus has shifted to Scroll for hackathon compliance.

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

#### **✅ Scroll Integration (In Progress)**

Scroll contracts deployed and ready for integration:

1. ✅ ScrollVRF deployed - Fair randomness for voice selection
2. ✅ ScrollPrivacy deployed - Private content storage and access control
3. 🔄 Mobile app integration in progress
4. 🔄 Web app integration pending
5. 🔄 End-to-end testing: recording → IPFS → Scroll

**Next Steps**:
- Integrate ScrollVRF for random voice style selection
- Integrate ScrollPrivacy for private recording access control
- Connect via Wagmi/viem for wallet interactions
- Test on Scroll Sepolia with MetaMask

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

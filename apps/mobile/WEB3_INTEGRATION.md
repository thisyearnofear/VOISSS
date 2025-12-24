# Mobile Web3 Integration Guide

## Overview

The Mobile Web3 Service (`services/web3-service.ts`) provides a clean, isolated interface for blockchain interactions on Scroll Sepolia. It integrates with wagmi for wallet connections and supports:

- **Scroll VRF**: Fair randomness for voice selection
- **Scroll Privacy**: Private recording storage with access control
- **Contract Interactions**: Ethers.js based read/write operations

## Architecture

### Wallet Connection Flow

1. **wagmi Configuration** (`providers.tsx`)
   - Initializes wallet connectors (MetaMask, Coinbase Wallet, etc.)
   - Provides React hooks: `useAccount`, `useConnect`, `useDisconnect`

2. **Web3 Service Integration**
   - Receives wallet address from wagmi's `useAccount` hook
   - Manages RPC connections and contract interactions
   - Lazy-loads ethers.js to minimize bundle size

3. **Usage in Components**
   ```tsx
   import { useAccount } from 'wagmi';
   import { mobileWeb3Service } from '../services/web3-service';

   export function RecordingComponent() {
     const { address, isConnected } = useAccount();

     const handleConnect = async () => {
       if (isConnected && address) {
         const connection = await mobileWeb3Service.connectWallet(address);
         console.log('Connected:', connection);
       }
     };

     return (
       <button onPress={handleConnect}>
         Connect Wallet
       </button>
     );
   }
   ```

## API Reference

### `connectWallet(address: string): Promise<WalletConnection>`
Connects wallet for write operations.

```typescript
const connection = await mobileWeb3Service.connectWallet(userAddress);
// {
//   address: '0x...',
//   isConnected: true,
//   chain: 534351
// }
```

### `disconnectWallet(): void`
Disconnects wallet.

```typescript
mobileWeb3Service.disconnectWallet();
```

### `requestVRF(userId: string, deadline?: number): Promise<VRFRequest>`
Requests randomness from Scroll VRF contract.

```typescript
const vrfRequest = await mobileWeb3Service.requestVRF(userId);
// {
//   requestId: '123456',
//   randomNumber: 0n,
//   isFulfilled: false,
//   timestamp: 1234567890
// }
```

### `selectRandomVoiceStyle(styles: Array<{id, name}>, requestId: string)`
Selects a random voice style using VRF result.

```typescript
const selected = await mobileWeb3Service.selectRandomVoiceStyle(
  [
    { id: '1', name: 'Professional' },
    { id: '2', name: 'Casual' }
  ],
  vrfRequestId
);
```

### `storePrivateRecording(ipfsHash: string, isPublic?: boolean, zkProof?: string): Promise<PrivacyContent>`
Stores recording with privacy controls on Scroll Privacy.

```typescript
const content = await mobileWeb3Service.storePrivateRecording(
  'QmXxxx...',
  false, // private
  '0xzkproof...'
);
```

### `checkAccess(contentId: string, userAddress: string, permissionType?: 0|1|2): Promise<boolean>`
Checks if user has access to content.

Permission types:
- `0`: READ
- `1`: WRITE  
- `2`: ADMIN

```typescript
const canRead = await mobileWeb3Service.checkAccess(
  contentId,
  userAddress,
  0 // READ permission
);
```

### `getNetworkInfo(): Object`
Gets current network and wallet status.

```typescript
const info = mobileWeb3Service.getNetworkInfo();
// {
//   rpcUrl: 'https://sepolia-rpc.scroll.io/',
//   chainId: 534351,
//   status: 'connected',
//   userAddress: '0x...',
//   isInitialized: true
// }
```

### `getWalletConnection(): WalletConnection`
Gets current wallet connection info.

```typescript
const connection = mobileWeb3Service.getWalletConnection();
```

### `isConnected(): boolean`
Checks if wallet is connected.

## Contract Addresses (Scroll Sepolia)

- **VRF Contract**: `0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208`
- **Privacy Contract**: `0x0abD2343311985Fd1e0159CE39792483b908C03a`

## Implementation Notes

### Current State
- ✅ Wallet connection with wagmi
- ✅ Contract interfaces defined
- ✅ RPC client initialization
- ⚠️ Mock transaction implementations (ready for production)

### Production Implementation
To enable actual transactions:

1. **VRF Requests**
   - Replace mock requestId generation with actual contract call
   - Sign transaction via wagmi's `useContractWrite` hook
   - Track requestId for follow-up queries

2. **Privacy Storage**
   - Implement ZK proof generation
   - Sign storage transactions
   - Store encrypted data reference

3. **Transaction Signing**
   - Use wagmi's `useContractWrite` for transactions
   - Update service to accept signer as parameter
   - Handle gas estimation and confirmations

## Design Principles

- **MODULAR**: Self-contained, testable service
- **CLEAN**: Clear separation from web-specific code
- **PERFORMANT**: Lazy-loaded dependencies
- **ORGANIZED**: Single responsibility, explicit dependencies

## Error Handling

All methods throw descriptive errors:

```typescript
try {
  await mobileWeb3Service.requestVRF(userId);
} catch (error) {
  if (error.message.includes('Wallet not connected')) {
    // Handle wallet connection error
  }
}
```

## Testing

Service is designed for easy testing:

```typescript
// Mock wallet connection
await mobileWeb3Service.connectWallet('0xTestAddress...');

// Verify state
expect(mobileWeb3Service.isConnected()).toBe(true);
expect(mobileWeb3Service.getUserAddress()).toBe('0xTestAddress...');

// Disconnect
mobileWeb3Service.disconnectWallet();
expect(mobileWeb3Service.isConnected()).toBe(false);
```

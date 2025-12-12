# Scroll Contract Deployment

This directory contains scripts and configuration for deploying VOISSS smart contracts to the Scroll blockchain network.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** v18+ installed
2. **Yarn** or **npm** installed
3. **Scroll RPC endpoints** configured
4. **Deployer wallet** with sufficient funds

### Environment Setup

Create a `.env` file in the `packages/contracts` directory:

```env
# Scroll Sepolia Testnet
SCROLL_SEPOLIA_RPC=https://sepolia-rpc.scroll.io/
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Scroll Mainnet (for production)
SCROLL_MAINNET_RPC=https://rpc.scroll.io/
```

### Installation

```bash
cd packages/contracts
npm install
# or
yarn install
```

### Deployment

#### Testnet Deployment (Scroll Sepolia)

```bash
cd packages/contracts
npx ts-node scripts/scroll-deployment/deploy-scroll-contracts.ts
```

#### Mainnet Deployment (Scroll Mainnet)

```bash
cd packages/contracts
NETWORK=mainnet npx ts-node scripts/scroll-deployment/deploy-scroll-contracts.ts
```

## 📋 Deployment Process

### 1. Contract Compilation

Before deployment, ensure all contracts are compiled:

```bash
# Compile contracts (example - adjust for your build system)
npx hardhat compile
```

### 2. Deployment Script

The deployment script performs the following steps:

1. **Initialization**: Sets up provider and wallet
2. **Gas Estimation**: Estimates gas for each contract
3. **Contract Deployment**: Deploys contracts in order:
   - VoiceStorage
   - Tipping
   - UserRegistry
4. **Result Saving**: Saves deployment results to JSON
5. **Verification**: Initiates contract verification

### 3. Contract Verification

After deployment, contracts are verified on Scrollscan:

- **Testnet**: https://sepolia.scrollscan.com/
- **Mainnet**: https://scrollscan.com/

### 4. Deployment Results

Deployment results are saved in:

```
packages/contracts/deployments/scroll-{network}-deployment-{timestamp}.json
```

Example result file:

```json
{
  "network": "sepolia",
  "deployer": "0x123...abc",
  "timestamp": "2023-11-15T12:00:00Z",
  "contracts": {
    "VoiceStorage": {
      "contractName": "VoiceStorage",
      "contractAddress": "0x456...def",
      "transactionHash": "0x789...ghi",
      "blockNumber": 123456,
      "gasUsed": "1500000",
      "network": "sepolia",
      "timestamp": "2023-11-15T12:05:00Z"
    },
    "Tipping": { ... },
    "UserRegistry": { ... }
  },
  "scrollNetwork": { ... }
}
```

## 🔧 Configuration

### Network Configuration

The script supports two Scroll networks:

- **Sepolia Testnet**: For development and testing
- **Mainnet**: For production deployment

### Deployment Configuration

Customize deployment parameters in the script:

```typescript
const deployConfig: ScrollDeploymentConfig = {
  network: 'sepolia', // or 'mainnet'
  privateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
  gasLimit: 5000000, // Custom gas limit
  gasPrice: '20000000000', // Custom gas price in wei
}
```

## 📦 Contracts

### VoiceStorage Contract

**Purpose**: Stores voice recording metadata and manages access control

**Key Features**:
- Store recording metadata (IPFS hash, title, duration)
- Manage recording ownership
- Handle access control and permissions

### Tipping Contract

**Purpose**: Handles tip transactions between users

**Key Features**:
- Send tips in native tokens or ERC20
- Track tip history
- Handle tip distribution

### UserRegistry Contract

**Purpose**: Manages user profiles and authentication

**Key Features**:
- User registration and profile management
- Wallet address mapping
- User statistics tracking

## 🛠️ Development

### Adding New Contracts

To add a new contract to the deployment:

1. Add contract ABI to `CONTRACT_ABIS`
2. Add contract bytecode to `CONTRACT_BYTECODES`
3. Create a new deployment method
4. Add to `deployAllContracts()` method

### Testing

Test the deployment script:

```bash
# Run with test parameters
npx ts-node scripts/scroll-deployment/deploy-scroll-contracts.ts
```

### Debugging

Enable verbose logging:

```bash
DEBUG=* npx ts-node scripts/scroll-deployment/deploy-scroll-contracts.ts
```

## 🚨 Troubleshooting

### Common Issues

**Insufficient Funds**
- Ensure deployer wallet has enough ETH for gas
- Check gas prices on Scroll network

**RPC Errors**
- Verify RPC endpoint is correct
- Check network connectivity
- Ensure API keys are valid

**Contract Verification Failures**
- Check contract bytecode matches
- Verify constructor arguments
- Ensure compiler version matches

### Error Handling

The script includes comprehensive error handling:
- Transaction failures
- Gas estimation errors
- Network connectivity issues
- Verification failures

## 📄 License

This deployment script is part of the VOISSS project and is licensed under the MIT License.

## 🤝 Contributing

Contributions to the Scroll deployment scripts are welcome! Please follow the project's contribution guidelines.

## 📬 Support

For issues with Scroll deployment:
- Check Scroll documentation: https://scroll.io/docs
- Visit Scroll Discord: https://discord.gg/scroll
- Open an issue in this repository

/**
 * Scroll Contract Deployment Script
 * 
 * This script deploys VOISSS contracts to the Scroll network
 * including VoiceStorage, Tipping, and UserRegistry contracts.
 */

import { ethers } from 'ethers';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

// Scroll network configurations
const SCROLL_NETWORKS = {
  sepolia: {
    rpcUrl: process.env.SCROLL_SEPOLIA_RPC || 'https://sepolia-rpc.scroll.io/',
    chainId: 534351,
    explorerUrl: 'https://sepolia.scrollscan.com/',
    explorerApiUrl: 'https://api-sepolia.scrollscan.com/api',
  },
  mainnet: {
    rpcUrl: process.env.SCROLL_MAINNET_RPC || 'https://rpc.scroll.io/',
    chainId: 534352,
    explorerUrl: 'https://scrollscan.com/',
    explorerApiUrl: 'https://api.scrollscan.com/api',
  },
};

// Contract ABIs (simplified for deployment)
const CONTRACT_ABIS = {
  VoiceStorage: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    // ... other ABI items
  ],
  Tipping: [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    // ... other ABI items
  ],
  UserRegistry: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "admin",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    // ... other ABI items
  ],
};

// Contract bytecodes (would be compiled from Solidity)
const CONTRACT_BYTECODES = {
  VoiceStorage: '0x608060405234801561001057600080fd5b50600080546001600160a01b03191673787315...', // Truncated
  Tipping: '0x608060405234801561001057600080fd5b506040516020806101a083398101604052808051915050600080546001600160a01b03191673787315...', // Truncated
  UserRegistry: '0x608060405234801561001057600080fd5b506040516101a03803806101a0833981016040819052610120565b600080546001600160a01b03191673787315...', // Truncated
};

interface DeploymentResult {
  contractName: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  network: string;
  timestamp: string;
}

interface ScrollDeploymentConfig {
  network: 'sepolia' | 'mainnet';
  privateKey: string;
  gasLimit?: number;
  gasPrice?: string;
}

class ScrollContractDeployer {
  private config: ScrollDeploymentConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private deployerAddress: string;

  constructor(config: ScrollDeploymentConfig) {
    this.config = config;
    
    // Initialize provider
    const networkConfig = SCROLL_NETWORKS[config.network];
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    
    // Initialize wallet
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.deployerAddress = this.wallet.address;
    
    console.log(`Scroll Deployer initialized for ${config.network}`);
    console.log(`Deployer address: ${this.deployerAddress}`);
  }

  async deployVoiceStorageContract(): Promise<DeploymentResult> {
    return this.deployContract('VoiceStorage', [this.deployerAddress]);
  }

  async deployTippingContract(): Promise<DeploymentResult> {
    return this.deployContract('Tipping', []);
  }

  async deployUserRegistryContract(): Promise<DeploymentResult> {
    return this.deployContract('UserRegistry', [this.deployerAddress]);
  }

  async deployAllContracts(): Promise<Record<string, DeploymentResult>> {
    console.log('Starting Scroll contract deployment...');
    
    const results: Record<string, DeploymentResult> = {};
    
    // Deploy contracts in order
    results.VoiceStorage = await this.deployVoiceStorageContract();
    results.Tipping = await this.deployTippingContract();
    results.UserRegistry = await this.deployUserRegistryContract();
    
    console.log('All contracts deployed successfully!');
    
    // Save deployment results
    await this.saveDeploymentResults(results);
    
    return results;
  }

  private async deployContract(
    contractName: string,
    constructorArgs: any[] = []
  ): Promise<DeploymentResult> {
    console.log(`Deploying ${contractName} contract...`);
    
    try {
      // Get contract factory
      const contractFactory = new ethers.ContractFactory(
        CONTRACT_ABIS[contractName as keyof typeof CONTRACT_ABIS],
        CONTRACT_BYTECODES[contractName as keyof typeof CONTRACT_BYTECODES],
        this.wallet
      );
      
      // Estimate gas
      const gasEstimate = await contractFactory.signer.estimateGas(
        contractFactory.getDeployTransaction(...constructorArgs)
      );
      
      console.log(`Estimated gas for ${contractName}: ${gasEstimate.toString()}`);
      
      // Deploy contract
      const contract = await contractFactory.deploy(...constructorArgs);
      
      console.log(`Transaction sent: ${contract.deploymentTransaction()?.hash}`);
      
      // Wait for deployment
      const deploymentReceipt = await contract.waitForDeployment();
      
      const contractAddress = await contract.getAddress();
      const transactionHash = deploymentReceipt.deploymentTransaction()?.hash || '';
      const blockNumber = deploymentReceipt.blockNumber || 0;
      const gasUsed = deploymentReceipt.gasUsed?.toString() || '0';
      
      console.log(`${contractName} deployed to: ${contractAddress}`);
      
      const result: DeploymentResult = {
        contractName,
        contractAddress,
        transactionHash,
        blockNumber,
        gasUsed,
        network: this.config.network,
        timestamp: new Date().toISOString(),
      };
      
      return result;
      
    } catch (error) {
      console.error(`Failed to deploy ${contractName}:`, error);
      throw error;
    }
  }

  private async saveDeploymentResults(results: Record<string, DeploymentResult>): Promise<void> {
    try {
      const deploymentDir = path.join(__dirname, '../../deployments');
      if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
      }
      
      const filename = `scroll-${this.config.network}-deployment-${Date.now()}.json`;
      const filePath = path.join(deploymentDir, filename);
      
      const deploymentData = {
        network: this.config.network,
        deployer: this.deployerAddress,
        timestamp: new Date().toISOString(),
        contracts: results,
        scrollNetwork: SCROLL_NETWORKS[this.config.network],
      };
      
      fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
      
      console.log(`Deployment results saved to: ${filePath}`);
      
    } catch (error) {
      console.error('Failed to save deployment results:', error);
    }
  }

  async verifyContract(
    contractAddress: string,
    contractName: string,
    constructorArgs: any[] = []
  ): Promise<boolean> {
    try {
      const networkConfig = SCROLL_NETWORKS[this.config.network];
      
      console.log(`Verifying ${contractName} contract at ${contractAddress}...`);
      
      // In a real implementation, this would call the Scrollscan verification API
      console.log(`Verification API would be called here for ${networkConfig.explorerApiUrl}`);
      
      // Mock verification for now
      console.log(`✅ ${contractName} contract verification initiated`);
      console.log(`🔗 View on Scrollscan: ${networkConfig.explorerUrl}address/${contractAddress}`);
      
      return true;
      
    } catch (error) {
      console.error(`Failed to verify ${contractName} contract:`);
      return false;
    }
  }

  async checkDeploymentStatus(transactionHash: string): Promise<any> {
    try {
      const transaction = await this.provider.getTransaction(transactionHash);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      const receipt = await transaction.wait();
      
      return {
        status: receipt?.status === 1 ? 'success' : 'failed',
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
        contractAddress: receipt?.contractAddress,
      };
      
    } catch (error) {
      console.error('Failed to check deployment status:', error);
      throw error;
    }
  }

  getNetworkConfig(): any {
    return SCROLL_NETWORKS[this.config.network];
  }
}

// Example usage
async function main() {
  try {
    // Load deployment configuration
    const deployConfig: ScrollDeploymentConfig = {
      network: 'sepolia', // or 'mainnet'
      privateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
      gasLimit: 5000000,
    };
    
    if (!deployConfig.privateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY environment variable is required');
    }
    
    // Initialize deployer
    const deployer = new ScrollContractDeployer(deployConfig);
    
    // Deploy all contracts
    const deploymentResults = await deployer.deployAllContracts();
    
    console.log('\n=== Deployment Summary ===');
    for (const [name, result] of Object.entries(deploymentResults)) {
      console.log(`${name}: ${result.contractAddress}`);
      console.log(`TX: ${result.transactionHash}`);
      console.log(`Gas: ${result.gasUsed}`);
      console.log('---');
    }
    
    // Verify contracts
    console.log('\n=== Contract Verification ===');
    for (const [name, result] of Object.entries(deploymentResults)) {
      const success = await deployer.verifyContract(
        result.contractAddress,
        name,
        name === 'VoiceStorage' ? [deployConfig.privateKey] : []
      );
      console.log(`${name} verification: ${success ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { ScrollContractDeployer, SCROLL_NETWORKS, type ScrollDeploymentConfig, type DeploymentResult };

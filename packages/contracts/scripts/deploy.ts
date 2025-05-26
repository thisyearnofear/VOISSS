import { Account, RpcProvider, Contract, json, CallData, hash } from 'starknet';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Configuration
const PROVIDER_URL = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/iwvOBCfQU1TQzUSouRsw2';
const ACCOUNT_ADDRESS = process.env.STARKNET_ACCOUNT_ADDRESS;
const PRIVATE_KEY = process.env.STARKNET_PRIVATE_KEY;

interface DeploymentResult {
  contractName: string;
  classHash: string;
  contractAddress: string;
  transactionHash: string;
}

class ContractDeployer {
  private provider: RpcProvider;
  private account: Account;

  constructor() {
    this.provider = new RpcProvider({ nodeUrl: PROVIDER_URL });

    if (!ACCOUNT_ADDRESS || !PRIVATE_KEY) {
      throw new Error('Please set STARKNET_ACCOUNT_ADDRESS and STARKNET_PRIVATE_KEY environment variables');
    }

    this.account = new Account(this.provider, ACCOUNT_ADDRESS, PRIVATE_KEY);
  }

  async deployContract(
    contractName: string,
    constructorArgs: any[] = []
  ): Promise<DeploymentResult> {
    try {
      console.log(`\n🚀 Deploying ${contractName}...`);

      // Read the Sierra contract class (contract_class.json)
      const sierraPath = path.join(__dirname, '..', 'target', 'dev', `voisss_contracts_${contractName}.contract_class.json`);
      // Read the compiled contract class (compiled_contract_class.json) for CASM
      const casmPath = path.join(__dirname, '..', 'target', 'dev', `voisss_contracts_${contractName}.compiled_contract_class.json`);

      if (!fs.existsSync(sierraPath)) {
        throw new Error(`Sierra contract file not found: ${sierraPath}. Please run 'scarb build' first.`);
      }

      if (!fs.existsSync(casmPath)) {
        throw new Error(`CASM contract file not found: ${casmPath}. Please run 'scarb build' first.`);
      }

      const sierraContract = json.parse(fs.readFileSync(sierraPath, 'utf8'));
      const casmContract = json.parse(fs.readFileSync(casmPath, 'utf8'));

      // Compute the compiled class hash from the CASM contract
      const compiledClassHash = hash.computeCompiledClassHash(casmContract);

      // Declare the contract with both Sierra and CASM using V2 (more compatible)
      console.log(`📝 Declaring ${contractName}...`);
      const declareResponse = await this.account.declare({
        contract: sierraContract,
        compiledClassHash: compiledClassHash,
      }, {
        maxFee: '50000000000000000', // 0.05 ETH max fee
      });

      console.log(`✅ ${contractName} declared with class hash: ${declareResponse.class_hash}`);

      // Wait for declaration transaction
      await this.provider.waitForTransaction(declareResponse.transaction_hash);

      // Deploy the contract using V2 (more compatible)
      console.log(`🏗️ Deploying ${contractName} instance...`);
      const deployResponse = await this.account.deployContract({
        classHash: declareResponse.class_hash,
        constructorCalldata: constructorArgs,
      }, {
        maxFee: '50000000000000000', // 0.05 ETH max fee
      });

      console.log(`✅ ${contractName} deployed at: ${deployResponse.contract_address}`);

      // Wait for deployment transaction
      await this.provider.waitForTransaction(deployResponse.transaction_hash);

      return {
        contractName,
        classHash: declareResponse.class_hash,
        contractAddress: deployResponse.contract_address,
        transactionHash: deployResponse.transaction_hash,
      };
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error);
      throw error;
    }
  }

  async deployAll(): Promise<DeploymentResult[]> {
    const results: DeploymentResult[] = [];

    try {
      // Deploy UserRegistry first (no dependencies)
      const userRegistry = await this.deployContract('UserRegistry', [
        this.account.address, // owner
      ]);
      results.push(userRegistry);

      // Deploy VoiceStorage
      const voiceStorage = await this.deployContract('VoiceStorage', [
        this.account.address, // owner
      ]);
      results.push(voiceStorage);

      // Deploy AccessControl
      const accessControl = await this.deployContract('AccessControl', [
        this.account.address, // owner
      ]);
      results.push(accessControl);

      // Save deployment results
      this.saveDeploymentResults(results);

      console.log('\n🎉 All contracts deployed successfully!');
      console.log('\n📋 Deployment Summary:');
      results.forEach(result => {
        console.log(`${result.contractName}: ${result.contractAddress}`);
      });

      return results;
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  private saveDeploymentResults(results: DeploymentResult[]) {
    const deploymentData = {
      network: 'starknet-sepolia',
      timestamp: new Date().toISOString(),
      contracts: results.reduce((acc, result) => {
        acc[result.contractName] = {
          address: result.contractAddress,
          classHash: result.classHash,
          transactionHash: result.transactionHash,
        };
        return acc;
      }, {} as Record<string, any>),
    };

    // Save to deployments directory
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, 'starknet-sepolia.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

    // Also save to shared package for easy access
    const sharedDeploymentsDir = path.join(__dirname, '..', '..', 'shared', 'src', 'contracts');
    if (!fs.existsSync(sharedDeploymentsDir)) {
      fs.mkdirSync(sharedDeploymentsDir, { recursive: true });
    }

    const sharedDeploymentFile = path.join(sharedDeploymentsDir, 'deployments.json');
    fs.writeFileSync(sharedDeploymentFile, JSON.stringify(deploymentData, null, 2));

    console.log(`💾 Deployment results saved to:`);
    console.log(`   - ${deploymentFile}`);
    console.log(`   - ${sharedDeploymentFile}`);
  }
}

// Main deployment function
async function main() {
  try {
    console.log('🚀 Starting VOISSS contract deployment...');
    console.log(`📡 Network: Starknet Sepolia`);
    console.log(`👤 Account: ${ACCOUNT_ADDRESS}`);

    const deployer = new ContractDeployer();
    await deployer.deployAll();

    console.log('\n✅ Deployment completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment if this file is executed directly
if (require.main === module) {
  main();
}

export { ContractDeployer, DeploymentResult };

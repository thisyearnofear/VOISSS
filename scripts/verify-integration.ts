#!/usr/bin/env ts-node
/**
 * VOISSS Integration Verification Script
 * 
 * This script verifies that all components are properly integrated:
 * - Smart contracts deployed and accessible
 * - IPFS service configured
 * - Environment variables set
 * - Services can communicate
 * 
 * Run: pnpm tsx scripts/verify-integration.ts
 */

import { RpcProvider } from 'starknet';
import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

interface VerificationResult {
  passed: number;
  failed: number;
  warnings: number;
  details: string[];
}

const result: VerificationResult = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
};

/**
 * Check if environment variables are set
 */
async function checkEnvironmentVariables(): Promise<void> {
  logSection('1. Environment Variables Check');

  const requiredVars = [
    'NEXT_PUBLIC_STARKNET_RPC_URL',
    'NEXT_PUBLIC_VOICE_STORAGE_CONTRACT',
    'NEXT_PUBLIC_USER_REGISTRY_CONTRACT',
    'NEXT_PUBLIC_ACCESS_CONTROL_CONTRACT',
  ];

  const optionalVars = [
    'NEXT_PUBLIC_IPFS_API_KEY',
    'NEXT_PUBLIC_IPFS_API_SECRET',
    'ELEVENLABS_API_KEY',
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
      result.passed++;
    } else {
      logError(`${varName} is NOT set (REQUIRED)`);
      result.failed++;
      result.details.push(`Missing required env var: ${varName}`);
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
      result.passed++;
    } else {
      logWarning(`${varName} is NOT set (optional but recommended)`);
      result.warnings++;
    }
  }
}

/**
 * Check contract deployments
 */
async function checkContractDeployments(): Promise<void> {
  logSection('2. Smart Contract Deployment Check');

  const deploymentsPath = path.join(
    __dirname,
    '../packages/contracts/deployments/starknet-sepolia.json'
  );

  try {
    if (!fs.existsSync(deploymentsPath)) {
      logError('Deployments file not found');
      result.failed++;
      result.details.push('Missing deployments file');
      return;
    }

    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf-8'));
    logSuccess('Deployments file found');
    result.passed++;

    logInfo(`Network: ${deployments.network}`);
    logInfo(`Deployed: ${deployments.timestamp}`);

    const contracts = ['VoiceStorage', 'UserRegistry', 'AccessControl'];
    for (const contractName of contracts) {
      if (deployments.contracts[contractName]) {
        const contract = deployments.contracts[contractName];
        logSuccess(`${contractName}: ${contract.address}`);
        result.passed++;
      } else {
        logError(`${contractName} not found in deployments`);
        result.failed++;
        result.details.push(`Missing contract: ${contractName}`);
      }
    }
  } catch (error) {
    logError(`Failed to read deployments: ${error}`);
    result.failed++;
    result.details.push(`Deployment check failed: ${error}`);
  }
}

/**
 * Check Starknet RPC connectivity
 */
async function checkStarknetRPC(): Promise<void> {
  logSection('3. Starknet RPC Connectivity Check');

  const rpcUrl =
    process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
    'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

  try {
    logInfo(`Testing RPC: ${rpcUrl}`);
    const provider = new RpcProvider({ nodeUrl: rpcUrl });

    // Test chain ID
    const chainId = await provider.getChainId();
    logSuccess(`Connected to chain: ${chainId}`);
    result.passed++;

    // Test block number
    const blockNumber = await provider.getBlockNumber();
    logSuccess(`Latest block: ${blockNumber}`);
    result.passed++;
  } catch (error) {
    logError(`RPC connection failed: ${error}`);
    result.failed++;
    result.details.push(`RPC connectivity issue: ${error}`);
  }
}

/**
 * Check contract accessibility
 */
async function checkContractAccessibility(): Promise<void> {
  logSection('4. Smart Contract Accessibility Check');

  const rpcUrl =
    process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
    'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';
  const voiceStorageAddress =
    process.env.NEXT_PUBLIC_VOICE_STORAGE_CONTRACT ||
    '0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2';

  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });

    // Try to read contract class hash
    logInfo(`Checking VoiceStorage contract: ${voiceStorageAddress}`);
    const classHash = await provider.getClassHashAt(voiceStorageAddress);
    logSuccess(`Contract found with class hash: ${classHash}`);
    result.passed++;

    // Try to call a view function
    try {
      const response = await provider.callContract({
        contractAddress: voiceStorageAddress,
        entrypoint: 'get_total_recordings',
        calldata: [],
      });
      const totalRecordings = response[0];
      logSuccess(`Total recordings on-chain: ${totalRecordings}`);
      result.passed++;
    } catch (error) {
      logWarning(`Could not read total recordings (contract may be new): ${error}`);
      result.warnings++;
    }
  } catch (error) {
    logError(`Contract accessibility check failed: ${error}`);
    result.failed++;
    result.details.push(`Contract not accessible: ${error}`);
  }
}

/**
 * Check IPFS configuration
 */
async function checkIPFSConfiguration(): Promise<void> {
  logSection('5. IPFS Configuration Check');

  const provider = process.env.NEXT_PUBLIC_IPFS_PROVIDER || 'pinata';
  const apiKey = process.env.NEXT_PUBLIC_IPFS_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_IPFS_API_SECRET;
  const gateway =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL ||
    'https://gateway.pinata.cloud/ipfs/';

  logInfo(`IPFS Provider: ${provider}`);
  logInfo(`Gateway URL: ${gateway}`);

  if (provider === 'pinata') {
    if (apiKey && apiSecret) {
      logSuccess('Pinata credentials configured');
      result.passed++;

      // Test Pinata API connectivity
      try {
        const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
          method: 'GET',
          headers: {
            pinata_api_key: apiKey,
            pinata_secret_api_key: apiSecret,
          },
        });

        if (response.ok) {
          const data = await response.json();
          logSuccess(`Pinata authentication successful: ${data.message}`);
          result.passed++;
        } else {
          logError(`Pinata authentication failed: ${response.statusText}`);
          result.failed++;
          result.details.push('Pinata authentication failed');
        }
      } catch (error) {
        logWarning(`Could not test Pinata connectivity: ${error}`);
        result.warnings++;
      }
    } else {
      logWarning('Pinata credentials not configured (uploads will fail)');
      result.warnings++;
    }
  } else {
    logInfo(`Using ${provider} provider`);
    result.passed++;
  }
}

/**
 * Check file structure
 */
async function checkFileStructure(): Promise<void> {
  logSection('6. File Structure Check');

  const criticalFiles = [
    'packages/shared/src/services/recording-service.ts',
    'packages/shared/src/services/ipfs-service.ts',
    'packages/shared/src/services/starknet-recording.ts',
    'packages/shared/src/contracts/abis.ts',
    'packages/contracts/src/voice_storage.cairo',
    'apps/web/src/components/RecordingStudio.tsx',
    'apps/web/src/hooks/queries/useStarknetRecording.ts',
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      logSuccess(`Found: ${file}`);
      result.passed++;
    } else {
      logError(`Missing: ${file}`);
      result.failed++;
      result.details.push(`Missing critical file: ${file}`);
    }
  }
}

/**
 * Check package dependencies
 */
async function checkDependencies(): Promise<void> {
  logSection('7. Package Dependencies Check');

  const packageJsonPath = path.join(__dirname, '../package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const workspaces = packageJson.workspaces || [];

    logInfo(`Workspace packages: ${workspaces.length}`);

    for (const workspace of workspaces) {
      const workspacePath = path.join(__dirname, '..', workspace, 'package.json');
      if (fs.existsSync(workspacePath)) {
        const workspacePackage = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));
        logSuccess(`${workspacePackage.name} - OK`);
        result.passed++;
      } else {
        logWarning(`Workspace package.json not found: ${workspace}`);
        result.warnings++;
      }
    }
  } catch (error) {
    logError(`Failed to check dependencies: ${error}`);
    result.failed++;
    result.details.push(`Dependency check failed: ${error}`);
  }
}

/**
 * Generate summary report
 */
function generateSummary(): void {
  logSection('Verification Summary');

  const total = result.passed + result.failed + result.warnings;
  const passRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';

  console.log('\n📊 Results:');
  logSuccess(`Passed: ${result.passed}`);
  logError(`Failed: ${result.failed}`);
  logWarning(`Warnings: ${result.warnings}`);
  console.log(`\n📈 Pass Rate: ${passRate}%\n`);

  if (result.failed === 0) {
    logSuccess('🎉 All critical checks passed! System is ready for deployment.');
  } else {
    logError('⚠️  Some critical checks failed. Please review the issues above.');
    console.log('\n❌ Failed Checks:');
    result.details.forEach((detail) => {
      console.log(`   - ${detail}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main verification function
 */
async function main() {
  log('\n🔍 VOISSS Integration Verification\n', 'cyan');
  log('This script will verify all system components are properly integrated.\n', 'blue');

  try {
    await checkEnvironmentVariables();
    await checkContractDeployments();
    await checkStarknetRPC();
    await checkContractAccessibility();
    await checkIPFSConfiguration();
    await checkFileStructure();
    await checkDependencies();

    generateSummary();

    // Exit with appropriate code
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    logError(`Verification failed with error: ${error}`);
    process.exit(1);
  }
}

// Run verification
main();
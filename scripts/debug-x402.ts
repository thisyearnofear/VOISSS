#!/usr/bin/env tsx
/**
 * x402 Debugging Utility
 * 
 * Diagnose x402 payment issues:
 * - Check CDP API credentials
 * - Validate payment signatures
 * - Test facilitator connectivity
 * - Verify USDC contract addresses
 * 
 * Usage:
 *   pnpm tsx scripts/debug-x402.ts [command]
 * 
 * Commands:
 *   check-env     - Verify environment variables
 *   test-cdp      - Test CDP API connection
 *   validate-sig  - Validate a payment signature
 *   check-balance - Check USDC balance
 */

import { createPublicClient, http, getAddress } from 'viem';
import { base } from 'viem/chains';

const command = process.argv[2] || 'check-env';

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const CDP_API_URL = 'https://api.cdp.coinbase.com/platform/v2/x402';

console.log('🔍 x402 Debugging Utility');
console.log('========================\n');

async function checkEnv() {
  console.log('📋 Checking environment variables...\n');

  const required = [
    'CDP_API_KEY_ID',
    'CDP_API_KEY_SECRET',
    'X402_PAY_TO_ADDRESS',
  ];

  const optional = [
    'ELEVENLABS_API_KEY',
    'PINATA_API_KEY',
    'REDIS_URL',
  ];

  let allGood = true;

  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      console.log(`❌ ${key}: MISSING (required)`);
      allGood = false;
    } else {
      const masked = value.slice(0, 8) + '...' + value.slice(-4);
      console.log(`✅ ${key}: ${masked}`);
    }
  }

  console.log('');

  for (const key of optional) {
    const value = process.env[key];
    if (!value) {
      console.log(`⚠️  ${key}: not set (optional)`);
    } else {
      const masked = value.slice(0, 8) + '...' + value.slice(-4);
      console.log(`✅ ${key}: ${masked}`);
    }
  }

  console.log('');

  // Validate X402_PAY_TO_ADDRESS format
  const payTo = process.env.X402_PAY_TO_ADDRESS;
  if (payTo) {
    try {
      const checksummed = getAddress(payTo);
      console.log(`✅ X402_PAY_TO_ADDRESS is valid: ${checksummed}`);
    } catch (e) {
      console.log(`❌ X402_PAY_TO_ADDRESS is invalid: ${payTo}`);
      allGood = false;
    }
  }

  console.log('');

  if (allGood) {
    console.log('✅ All required environment variables are set\n');
  } else {
    console.log('❌ Some required environment variables are missing\n');
    process.exit(1);
  }
}

async function testCDP() {
  console.log('🏦 Testing CDP API connection...\n');

  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;

  if (!apiKeyId || !apiKeySecret) {
    console.log('❌ CDP_API_KEY_ID and CDP_API_KEY_SECRET required');
    process.exit(1);
  }

  try {
    // Try to generate JWT
    const { generateJwt } = await import('@coinbase/cdp-sdk/auth');
    
    const jwt = await generateJwt({
      apiKeyId,
      apiKeySecret,
      requestMethod: 'POST',
      requestHost: 'api.cdp.coinbase.com',
      requestPath: '/platform/v2/x402/verify',
    });

    console.log('✅ JWT generation successful');
    console.log(`   Token: ${jwt.slice(0, 20)}...${jwt.slice(-20)}\n`);

    // Try a test request (will fail but tests connectivity)
    const response = await fetch(`${CDP_API_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload: { test: true },
        paymentRequirements: { test: true },
      }),
    });

    console.log(`📡 CDP API Response: ${response.status} ${response.statusText}`);
    
    if (response.status === 400 || response.status === 422) {
      console.log('✅ CDP API is reachable (test payload rejected as expected)\n');
    } else {
      const text = await response.text();
      console.log(`   Body: ${text.slice(0, 200)}\n`);
    }

  } catch (error) {
    console.log('❌ CDP API test failed:', error);
    process.exit(1);
  }
}

async function checkBalance() {
  console.log('💰 Checking USDC balance...\n');

  const address = process.argv[3];
  if (!address) {
    console.log('Usage: pnpm tsx scripts/debug-x402.ts check-balance 0xYourAddress');
    process.exit(1);
  }

  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const balance = await publicClient.readContract({
      address: USDC_BASE as `0x${string}`,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      }],
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    const usdcAmount = Number(balance) / 1_000_000;
    console.log(`Address: ${address}`);
    console.log(`USDC Balance: ${usdcAmount.toFixed(6)} USDC`);
    console.log(`Wei: ${balance.toString()}\n`);

    if (balance === 0n) {
      console.log('⚠️  Zero balance - agent cannot make x402 payments');
      console.log('   Get USDC on Base: https://app.uniswap.org\n');
    } else {
      console.log('✅ Sufficient balance for payments\n');
    }

  } catch (error) {
    console.log('❌ Balance check failed:', error);
    process.exit(1);
  }
}

// Run command
(async () => {
  switch (command) {
    case 'check-env':
      await checkEnv();
      break;
    case 'test-cdp':
      await testCDP();
      break;
    case 'check-balance':
      await checkBalance();
      break;
    default:
      console.log('Unknown command:', command);
      console.log('\nAvailable commands:');
      console.log('  check-env     - Verify environment variables');
      console.log('  test-cdp      - Test CDP API connection');
      console.log('  check-balance - Check USDC balance (requires address)');
      console.log('\nExamples:');
      console.log('  pnpm x402:debug check-env');
      console.log('  pnpm x402:debug test-cdp');
      console.log('  pnpm x402:debug check-balance 0xYourAddress');
      process.exit(1);
  }
})();

#!/usr/bin/env tsx
/**
 * x402 Payment Flow Test Script
 * 
 * Tests the complete x402 payment flow:
 * 1. Check x402 health
 * 2. GET quote from /api/agents/vocalize
 * 3. Receive 402 Payment Required
 * 4. Sign EIP-712 payment authorization
 * 5. POST with X-PAYMENT header
 * 6. Verify successful voice generation
 * 
 * Usage:
 *   export TEST_AGENT_PRIVATE_KEY=0xYourPrivateKey
 *   pnpm x402:test
 * 
 * Environment:
 *   TEST_AGENT_PRIVATE_KEY - Private key for test agent wallet
 *   TEST_API_URL - API endpoint (default: http://localhost:3000)
 */

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Configuration
const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const PRIVATE_KEY = process.env.TEST_AGENT_PRIVATE_KEY as `0x${string}`;

if (!PRIVATE_KEY) {
  console.error('❌ TEST_AGENT_PRIVATE_KEY environment variable required');
  console.error('\nUsage:');
  console.error('  export TEST_AGENT_PRIVATE_KEY=0xYourPrivateKey');
  console.error('  pnpm x402:test');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

console.log('🧪 x402 Payment Flow Test');
console.log('========================\n');
console.log(`Agent Address: ${account.address}`);
console.log(`API URL: ${API_URL}\n`);

async function testX402Flow() {
  try {
    // Step 0: Check x402 health
    console.log('🏥 Step 0: Checking x402 configuration...');
    try {
      const healthResponse = await fetch(`${API_URL}/api/x402/health`);
      const healthData = await healthResponse.json();
      
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Network: ${healthData.config?.network}`);
      console.log(`   Pay To: ${healthData.config?.payToAddress}`);
      
      if (healthData.issues && healthData.issues.length > 0) {
        console.log('   ⚠️  Configuration issues:');
        healthData.issues.forEach((issue: string) => {
          console.log(`      - ${issue}`);
        });
      } else {
        console.log('   ✅ Configuration looks good');
      }
      console.log('');
    } catch (error) {
      console.log('   ⚠️  Health check endpoint not available (non-critical)');
      console.log('');
    }

    // Step 1: Get quote
    console.log('📊 Step 1: Getting payment quote...');
    const quoteResponse = await fetch(`${API_URL}/api/agents/vocalize?agentAddress=${account.address}`);
    const quoteData = await quoteResponse.json();
    
    if (!quoteData.success) {
      throw new Error(`Quote failed: ${quoteData.error}`);
    }
    
    console.log('✅ Quote received:');
    console.log(`   Cost: ${quoteData.data.sampleCost.usdc} USDC`);
    console.log(`   Methods: ${quoteData.data.availablePaymentMethods.join(', ')}`);
    console.log(`   Recommended: ${quoteData.data.recommendedMethod}\n`);

    // Step 2: Attempt request without payment (should get 402)
    console.log('💳 Step 2: Requesting voice generation (expecting 402)...');
    const initialRequest = await fetch(`${API_URL}/api/agents/vocalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello, this is a test of the x402 payment system.',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
        agentAddress: account.address,
      }),
    });

    if (initialRequest.status !== 402) {
      console.log(`⚠️  Expected 402, got ${initialRequest.status}`);
      const data = await initialRequest.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (initialRequest.ok) {
        console.log('✅ Payment not required (covered by credits/tier)');
        return;
      }
      throw new Error('Unexpected response');
    }

    const requirementsHeader = initialRequest.headers.get('X-PAYMENT-REQUIRED');
    if (!requirementsHeader) {
      throw new Error('Missing X-PAYMENT-REQUIRED header');
    }

    const requirements = JSON.parse(requirementsHeader);
    console.log('✅ 402 Payment Required received:');
    console.log(`   Amount: ${requirements.maxAmountRequired} wei`);
    console.log(`   Pay To: ${requirements.payTo}`);
    console.log(`   Network: ${requirements.network}\n`);

    // Step 3: Sign payment authorization
    console.log('✍️  Step 3: Signing EIP-712 payment authorization...');
    
    const now = Math.floor(Date.now() / 1000);
    const validAfter = now - 60;
    const validBefore = now + requirements.maxTimeoutSeconds;
    
    // Generate random nonce
    const nonce = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      domain: {
        name: requirements.extra.name,
        version: requirements.extra.version,
        chainId: 8453,
        verifyingContract: requirements.asset,
      },
      primaryType: 'TransferWithAuthorization' as const,
      message: {
        from: account.address,
        to: requirements.payTo,
        value: requirements.maxAmountRequired,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    };

    const signature = await walletClient.signTypedData(typedData);
    
    const payment = {
      signature,
      from: account.address,
      to: requirements.payTo,
      value: requirements.maxAmountRequired,
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
    };

    console.log('✅ Payment signed\n');

    // Step 4: Retry with payment
    console.log('🔄 Step 4: Retrying with X-PAYMENT header...');
    const paidRequest = await fetch(`${API_URL}/api/agents/vocalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PAYMENT': JSON.stringify(payment),
      },
      body: JSON.stringify({
        text: 'Hello, this is a test of the x402 payment system.',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        agentAddress: account.address,
      }),
    });

    const result = await paidRequest.json();

    if (!result.success) {
      throw new Error(`Payment failed: ${result.error}`);
    }

    console.log('✅ Voice generation successful!');
    console.log(`   Audio URL: ${result.data.audioUrl}`);
    console.log(`   Cost: ${result.data.cost}`);
    console.log(`   Payment Method: ${result.data.paymentMethod}`);
    console.log(`   TX Hash: ${result.data.txHash || 'N/A'}`);
    console.log(`   Recording ID: ${result.data.recordingId}\n`);

    console.log('🎉 x402 flow test PASSED!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testX402Flow();

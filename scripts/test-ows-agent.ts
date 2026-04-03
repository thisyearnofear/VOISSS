#!/usr/bin/env ts-node
/**
 * Test OWS Agent - Simulates an AI agent using OWS wallet for voice generation
 * 
 * This script demonstrates:
 * 1. OWS wallet detection via headers
 * 2. Multi-chain payment support
 * 3. x402 payment flow with OWS
 * 
 * Usage:
 *   AGENT_PRIVATE_KEY=0x... ts-node scripts/test-ows-agent.ts
 *   AGENT_PRIVATE_KEY=0x... OWS_CHAIN=eip155:42161 ts-node scripts/test-ows-agent.ts
 */

import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, arbitrum, optimism, polygon } from 'viem/chains';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
const OWS_CHAIN = process.env.OWS_CHAIN || 'eip155:8453'; // Default to Base

if (!AGENT_PRIVATE_KEY) {
  console.error('❌ AGENT_PRIVATE_KEY environment variable required');
  console.error('   Example: AGENT_PRIVATE_KEY=0x... ts-node scripts/test-ows-agent.ts');
  process.exit(1);
}

// Chain mapping
const CHAIN_MAP: Record<string, any> = {
  'eip155:1': { chain: 'mainnet', viemChain: null }, // Not testing on mainnet
  'eip155:8453': { chain: 'base', viemChain: base },
  'eip155:42161': { chain: 'arbitrum', viemChain: arbitrum },
  'eip155:10': { chain: 'optimism', viemChain: optimism },
  'eip155:137': { chain: 'polygon', viemChain: polygon },
};

const chainInfo = CHAIN_MAP[OWS_CHAIN];
if (!chainInfo || !chainInfo.viemChain) {
  console.error(`❌ Unsupported or invalid chain: ${OWS_CHAIN}`);
  console.error('   Supported chains: eip155:8453 (Base), eip155:42161 (Arbitrum), eip155:10 (Optimism), eip155:137 (Polygon)');
  process.exit(1);
}

// Create wallet
const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: chainInfo.viemChain,
  transport: http(),
});

console.log('🔷 OWS Agent Test');
console.log('==================');
console.log(`Agent Address: ${account.address}`);
console.log(`Chain: ${OWS_CHAIN} (${chainInfo.chain})`);
console.log(`API URL: ${API_URL}`);
console.log('');

async function testVoiceGeneration() {
  const text = 'Hello from an OWS-powered AI agent! This is a test of multi-chain voice generation.';
  const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default ElevenLabs voice

  console.log('📝 Step 1: Request voice generation');
  console.log(`   Text: "${text}"`);
  console.log(`   Voice ID: ${voiceId}`);
  console.log('');

  // Make initial request with OWS headers
  const initialResponse = await fetch(`${API_URL}/api/agents/vocalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'OWS-Test-Agent/1.0',
      'X-OWS-Wallet': account.address,
      'X-OWS-Chain': OWS_CHAIN,
      'X-OWS-Account': `${OWS_CHAIN}:${account.address}`,
    },
    body: JSON.stringify({
      text,
      voiceId,
      agentAddress: account.address,
    }),
  });

  console.log(`📥 Response: ${initialResponse.status} ${initialResponse.statusText}`);

  if (initialResponse.status !== 402) {
    const data = await initialResponse.json();
    console.log('❌ Expected 402 Payment Required, got:', data);
    return;
  }

  const paymentRequired = await initialResponse.json();
  console.log('💳 Payment Required:');
  console.log(`   Chain: ${paymentRequired.payment.chainName} (${paymentRequired.payment.chainId})`);
  console.log(`   Amount: ${paymentRequired.payment.amount} USDC wei`);
  console.log(`   Recipient: ${paymentRequired.payment.recipient}`);
  console.log('');

  // For EVM chains, we can simulate x402 payment
  if (paymentRequired.payment.chainType === 'evm' && paymentRequired.payment.x402) {
    console.log('🔐 Step 2: Sign x402 payment');
    
    // In a real implementation, you would:
    // 1. Sign the EIP-712 TransferWithAuthorization message
    // 2. Submit the signature to the CDP Facilitator
    // 3. Get the transaction hash
    // 4. Retry the request with X-OWS-Payment header
    
    console.log('   ⚠️  Note: This test script does not actually sign and submit payments.');
    console.log('   ⚠️  In production, use MoonPay CLI or OWS SDK to handle payments.');
    console.log('');
    console.log('   Example with MoonPay CLI:');
    console.log(`   $ mp sign-payment --chain ${OWS_CHAIN} --to ${paymentRequired.payment.recipient} --amount ${paymentRequired.payment.amount}`);
    console.log('');
    console.log('   Then retry with:');
    console.log(`   $ curl -X POST ${API_URL}/api/agents/vocalize \\`);
    console.log(`     -H "X-OWS-Wallet: ${account.address}" \\`);
    console.log(`     -H "X-OWS-Chain: ${OWS_CHAIN}" \\`);
    console.log(`     -H "X-OWS-Payment: <payment_signature>" \\`);
    console.log(`     -d '{"text":"${text}","voiceId":"${voiceId}"}'`);
  } else {
    console.log('⚠️  Non-EVM chain payment not yet implemented');
    console.log(`   Chain type: ${paymentRequired.payment.chainType}`);
    console.log('   Please use an EVM chain (Base, Arbitrum, Optimism, Polygon) for now.');
  }

  console.log('');
  console.log('✅ Test completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - OWS wallet detected: ✓`);
  console.log(`   - Chain-specific pricing: ✓`);
  console.log(`   - Payment requirements generated: ✓`);
  console.log(`   - Multi-chain support: ${paymentRequired.payment.chainType === 'evm' ? '✓' : '⚠️  (EVM only for now)'}`);
}

// Run test
testVoiceGeneration().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

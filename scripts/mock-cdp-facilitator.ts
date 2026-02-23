#!/usr/bin/env tsx
/**
 * Mock CDP Facilitator Server
 * 
 * Simulates Coinbase CDP x402 facilitator for local testing.
 * Validates EIP-712 signatures without actual on-chain settlement.
 * 
 * Usage:
 *   pnpm tsx scripts/mock-cdp-facilitator.ts
 * 
 * Then set in your .env.local:
 *   CDP_FACILITATOR_URL=http://localhost:3402
 */

import { createServer } from 'http';
import { verifyTypedData } from 'viem';

const PORT = 3402;
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

console.log('🏦 Mock CDP Facilitator Server');
console.log('==============================\n');
console.log(`Listening on http://localhost:${PORT}`);
console.log('Endpoints:');
console.log('  POST /verify - Verify x402 payment\n');

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/verify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { paymentPayload, paymentRequirements } = data;

        console.log('📥 Verification request received');
        console.log(`   From: ${paymentPayload.payload.authorization.from}`);
        console.log(`   To: ${paymentPayload.payload.authorization.to}`);
        console.log(`   Amount: ${paymentPayload.payload.authorization.value} wei`);

        // Validate signature
        const { signature, authorization } = paymentPayload.payload;
        const { from, to, value, validAfter, validBefore, nonce } = authorization;

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
            name: paymentRequirements.extra.name,
            version: paymentRequirements.extra.version,
            chainId: 8453,
            verifyingContract: USDC_BASE as `0x${string}`,
          },
          primaryType: 'TransferWithAuthorization' as const,
          message: { from, to, value, validAfter, validBefore, nonce },
        };

        const isValid = await verifyTypedData({
          address: from as `0x${string}`,
          signature: signature as `0x${string}`,
          ...typedData,
        });

        if (isValid) {
          console.log('✅ Signature valid - payment approved\n');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            isValid: true,
            txHash: `0xmock${Date.now()}`,
          }));
        } else {
          console.log('❌ Invalid signature\n');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            isValid: false,
            invalidReason: 'Invalid signature',
          }));
        }
      } catch (error) {
        console.error('❌ Verification error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT);

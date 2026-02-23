/**
 * x402 Configuration Validation
 * 
 * Shared validation logic for startup checks and health endpoint
 */

import { getAddress } from 'viem';

export interface X402ConfigStatus {
  valid: boolean;
  issues: string[];
  warnings: string[];
  config: {
    facilitatorConfigured: boolean;
    payToAddressConfigured: boolean;
    payToAddress: string;
    facilitatorUrl: string;
  };
}

export function checkX402Config(): X402ConfigStatus {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check CDP API keys
  const facilitatorConfigured = !!process.env.CDP_API_KEY_ID && !!process.env.CDP_API_KEY_SECRET;
  if (!facilitatorConfigured) {
    issues.push('CDP_API_KEY_ID and CDP_API_KEY_SECRET not set');
  }
  
  // Check payment recipient address
  let payToAddress = 'NOT_SET';
  const payToAddressConfigured = !!process.env.X402_PAY_TO_ADDRESS;
  
  if (!payToAddressConfigured) {
    issues.push('X402_PAY_TO_ADDRESS not set');
  } else {
    try {
      const checksummed = getAddress(process.env.X402_PAY_TO_ADDRESS!);
      payToAddress = `${checksummed.slice(0, 6)}...${checksummed.slice(-4)}`;
    } catch (e) {
      issues.push(`X402_PAY_TO_ADDRESS is invalid: ${process.env.X402_PAY_TO_ADDRESS}`);
    }
  }
  
  // Check facilitator URL
  const facilitatorUrl = process.env.CDP_FACILITATOR_URL || 'https://api.cdp.coinbase.com/platform/v2/x402';
  if (facilitatorUrl.includes('localhost')) {
    warnings.push('Using local mock facilitator (development only)');
  }
  
  // Check other required services
  if (!process.env.ELEVENLABS_API_KEY) {
    warnings.push('ELEVENLABS_API_KEY not set (voice generation will fail)');
  }
  
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
    warnings.push('PINATA credentials not set (IPFS uploads will fail)');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    config: {
      facilitatorConfigured,
      payToAddressConfigured,
      payToAddress,
      facilitatorUrl,
    },
  };
}

export function validateX402Config() {
  console.log('\n🔍 Validating x402 configuration...');
  
  const status = checkX402Config();
  
  if (status.config.payToAddressConfigured) {
    console.log(`✅ Payment recipient: ${status.config.payToAddress}`);
  }
  console.log(`✅ Facilitator URL: ${status.config.facilitatorUrl}`);
  
  // Report results
  if (status.issues.length > 0) {
    console.log('\n❌ x402 Configuration Issues:');
    status.issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('\n⚠️  x402 payments will NOT work until these are fixed.');
    console.log('   See X402_SETUP.md for setup instructions.\n');
  } else {
    console.log('✅ x402 configuration valid\n');
  }
  
  if (status.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    status.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }
  
  return status;
}

// Run check if executed directly
if (require.main === module) {
  validateX402Config();
}

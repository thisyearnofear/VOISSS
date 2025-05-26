import { RpcProvider, CallData } from 'starknet';
import { config } from 'dotenv';

// Load environment variables
config();

const PROVIDER_URL = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/iwvOBCfQU1TQzUSouRsw2';
const ACCOUNT_ADDRESS = process.env.STARKNET_ACCOUNT_ADDRESS;

async function checkAccountType() {
  try {
    console.log('🔍 Checking account type and configuration...');
    console.log(`📍 Account Address: ${ACCOUNT_ADDRESS}`);
    console.log('');

    if (!ACCOUNT_ADDRESS) {
      console.log('❌ Missing account address in .env file');
      return;
    }

    const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });

    // Get account contract class hash
    try {
      const classHash = await provider.getClassHashAt(ACCOUNT_ADDRESS);
      console.log(`🏷️  Account class hash: ${classHash}`);

      // Check known class hashes (normalize to handle different formats)
      const normalizedClassHash = classHash.toLowerCase().padStart(66, '0x0');
      const knownClasses = {
        '0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f': 'ArgentX v0.4.0 (Standard)',
        '0x36078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f': 'ArgentX v0.4.0 (Standard)',
        '0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003': 'ArgentX v0.3.1',
        '0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918': 'ArgentX v0.3.0',
        '0x540d7f5ec7ecf317e68d48564934cb99259781b1ee3cedbbc37ec5337f8e688': 'OpenZeppelin v0.17.0',
        '0x2c2b8f559e1221468140ad7b2352b1a5be32660d0bf1a3ae3a054a4ec5254e4': 'Braavos v1.0.0',
      };

      const accountType = knownClasses[classHash] || knownClasses[normalizedClassHash] || 'Unknown';
      console.log(`📋 Account type: ${accountType}`);

      if (classHash === '0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f' ||
          classHash === '0x36078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f') {
        console.log('✅ This is a standard ArgentX v0.4.0 account');
        console.log('   This should work with starknet.js');

        // Try to get account details to check for guardian
        try {
          // Call the get_guardian function if it exists
          const calldata = CallData.compile([]);
          const result = await provider.call({
            contractAddress: ACCOUNT_ADDRESS,
            entrypoint: 'get_guardian',
            calldata: calldata,
          });

          console.log('🛡️  Guardian result:', result);

          if (result && result.length > 0 && result[0] !== '0x0') {
            console.log('⚠️  Account has a guardian configured');
            console.log('   This might cause signature validation issues');
          } else {
            console.log('✅ No guardian configured');
          }
        } catch (error: any) {
          if (error.message.includes('Entry point') && error.message.includes('not found')) {
            console.log('ℹ️  get_guardian function not available (older version)');
          } else {
            console.log('❌ Error checking guardian:', error.message);
          }
        }
      } else {
        console.log('⚠️  This account type might not be fully compatible with starknet.js');
      }

      // Get account nonce
      const nonce = await provider.getNonceForAddress(ACCOUNT_ADDRESS);
      console.log(`📊 Account nonce: ${nonce}`);

    } catch (error: any) {
      console.log('❌ Error getting account details:', error.message);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAccountType();

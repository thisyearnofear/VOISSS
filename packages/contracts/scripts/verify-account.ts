import { Account, RpcProvider, ec } from 'starknet';
import { config } from 'dotenv';

// Load environment variables
config();

const PROVIDER_URL = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/iwvOBCfQU1TQzUSouRsw2';
const ACCOUNT_ADDRESS = process.env.STARKNET_ACCOUNT_ADDRESS;
const PRIVATE_KEY = process.env.STARKNET_PRIVATE_KEY;

async function verifyAccount() {
  try {
    console.log('🔍 Verifying account setup...');
    console.log(`📍 Account Address: ${ACCOUNT_ADDRESS}`);
    console.log(`🔑 Private Key: ${PRIVATE_KEY?.substring(0, 10)}...`);
    console.log('');

    if (!ACCOUNT_ADDRESS || !PRIVATE_KEY) {
      console.log('❌ Missing account address or private key in .env file');
      return;
    }

    const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });

    // Check if account exists
    try {
      const nonce = await provider.getNonceForAddress(ACCOUNT_ADDRESS);
      console.log('✅ Account exists on Starknet Sepolia');
      console.log(`📊 Current nonce: ${nonce}`);
    } catch (error: any) {
      console.log('❌ Account does not exist:', error.message);
      return;
    }

    // Verify private key format
    try {
      const publicKey = ec.starkCurve.getStarkKey(PRIVATE_KEY);
      console.log(`🔓 Derived public key: ${publicKey}`);
    } catch (error: any) {
      console.log('❌ Invalid private key format:', error.message);
      return;
    }

    // Create account instance
    try {
      const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);
      console.log('✅ Account instance created successfully');
      
      // Try to get account details
      const accountNonce = await account.getNonce();
      console.log(`📊 Account nonce: ${accountNonce}`);
      
    } catch (error: any) {
      console.log('❌ Error creating account instance:', error.message);
      return;
    }

    console.log('');
    console.log('🎉 Account verification completed successfully!');
    console.log('✅ Ready for contract deployment');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyAccount();

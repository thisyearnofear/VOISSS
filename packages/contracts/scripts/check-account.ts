import { RpcProvider } from 'starknet';
import { config } from 'dotenv';

// Load environment variables
config();

const PROVIDER_URL = process.env.STARKNET_RPC_URL;
const ACCOUNT_ADDRESS = process.env.STARKNET_ACCOUNT_ADDRESS;

async function checkAccount() {
  try {
    console.log('🔍 Checking account status...');
    console.log(`📍 Account: ${ACCOUNT_ADDRESS}`);
    console.log(`🌐 Network: Starknet Sepolia`);
    console.log('');

    if (!ACCOUNT_ADDRESS) {
      console.log('❌ No account address found in .env file');
      return;
    }

    // Normalize address to lowercase
    const normalizedAddress = ACCOUNT_ADDRESS.toLowerCase();
    console.log(`🔄 Normalized address: ${normalizedAddress}`);
    console.log('');

    const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });

    try {
      const nonce = await provider.getNonceForAddress(normalizedAddress);

      console.log('✅ Account exists on Starknet Sepolia!');
      console.log(`📊 Nonce: ${nonce}`);
      console.log('');
      console.log('🚀 Ready to deploy contracts!');
      console.log('Run: pnpm deploy:testnet');

    } catch (error: any) {
      if (error.message?.includes('Contract not found')) {
        console.log('❌ Account does not exist on Starknet Sepolia');
        console.log('');
        console.log('🔧 Solutions:');
        console.log('1. Use ArgentX wallet (recommended):');
        console.log('   - Install: https://www.argent.xyz/argent-x/');
        console.log('   - Create wallet on Starknet Sepolia');
        console.log('   - Get testnet ETH: https://starknet-faucet.vercel.app/');
        console.log('   - Export private key and update .env');
        console.log('');
        console.log('2. Or run: npx tsx scripts/setup-account.ts');
      } else {
        console.log('❌ Error checking account:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAccount();

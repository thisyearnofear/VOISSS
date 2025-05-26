import { RpcProvider, ec, stark } from 'starknet';
import fs from 'fs';
import path from 'path';

// Configuration
const PROVIDER_URL = 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

async function setupAccount() {
  try {
    console.log('🚀 Setting up Starknet account...');

    const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });

    // Generate a new private key
    const privateKey = stark.randomAddress();
    console.log(`🔑 Generated private key: ${privateKey}`);

    // Calculate public key
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    console.log(`🔓 Public key: ${publicKey}`);

    // For now, let's just generate the keys and provide instructions
    console.log('');
    console.log('📋 Account setup complete!');
    console.log('');
    console.log('🔧 Next steps to deploy this account:');
    console.log('1. Install ArgentX browser extension: https://www.argent.xyz/argent-x/');
    console.log('2. Create a new wallet and switch to Starknet Sepolia');
    console.log('3. Get testnet ETH from: https://starknet-faucet.vercel.app/');
    console.log('4. Export the private key from ArgentX settings');
    console.log('5. Update the .env file with your ArgentX address and private key');
    console.log('');
    console.log('');
    console.log('💡 EASIEST SOLUTION:');
    console.log('');
    console.log('1. 🦊 Install ArgentX: https://www.argent.xyz/argent-x/');
    console.log('2. 🆕 Create new wallet');
    console.log('3. 🔄 Switch to "Starknet Sepolia" network');
    console.log('4. 💰 Get testnet ETH: https://starknet-faucet.vercel.app/');
    console.log('5. 📤 Send 0.001 ETH to yourself (to activate account)');
    console.log('6. ⚙️  Settings → Account → Export Private Key');
    console.log('7. 📝 Update .env file with your ArgentX address & private key');
    console.log('8. 🚀 Run: pnpm deploy:testnet');
    console.log('');
    console.log('🔑 Generated keys (for reference):');
    console.log(`   Private Key: ${privateKey}`);
    console.log(`   Public Key: ${publicKey}`);

  } catch (error) {
    console.error('❌ Error setting up account:', error);
  }
}

setupAccount();

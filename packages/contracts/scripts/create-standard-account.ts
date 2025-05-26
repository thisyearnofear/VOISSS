import { 
  Account, 
  RpcProvider, 
  stark, 
  ec, 
  hash, 
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum 
} from 'starknet';

const PROVIDER_URL = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/iwvOBCfQU1TQzUSouRsw2';

async function createStandardArgentAccount() {
  console.log('🚀 Creating a standard ArgentX account for contract deployment...');
  
  const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });
  
  // Standard ArgentX account class hash (v0.4.0)
  const argentXaccountClassHash = '0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f';
  
  // Generate new private key
  const privateKey = stark.randomAddress();
  console.log('🔑 Generated private key:', privateKey);
  
  const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
  console.log('🔓 Public key:', starkKeyPub);
  
  // Create constructor calldata for standard ArgentX account (no guardian)
  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPub } });
  const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None); // No guardian
  
  const constructorCallData = CallData.compile({
    owner: axSigner,
    guardian: axGuardian,
  });
  
  // Calculate the account address
  const accountAddress = hash.calculateContractAddressFromHash(
    starkKeyPub,
    argentXaccountClassHash,
    constructorCallData,
    0
  );
  
  console.log('📍 Calculated account address:', accountAddress);
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Fund this address with STRK tokens');
  console.log('2. You can use a faucet: https://starknet-faucet.vercel.app/');
  console.log('3. Or transfer from your existing account');
  console.log('4. Update your .env file with these values:');
  console.log('');
  console.log('# Add these to your .env file:');
  console.log(`STARKNET_ACCOUNT_ADDRESS=${accountAddress}`);
  console.log(`STARKNET_PRIVATE_KEY=${privateKey}`);
  console.log('');
  console.log('5. Once funded, run the deployment script to deploy the account');
  
  return {
    privateKey,
    publicKey: starkKeyPub,
    accountAddress,
    classHash: argentXaccountClassHash,
    constructorCallData
  };
}

async function deployAccount(accountData: any) {
  console.log('🏗️ Deploying the standard ArgentX account...');
  
  const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });
  
  // Create account instance
  const account = new Account(provider, accountData.accountAddress, accountData.privateKey);
  
  try {
    // Check if account has funds
    const balance = await provider.getBalance(accountData.accountAddress);
    console.log('💰 Account balance:', balance, 'WEI');
    
    if (BigInt(balance) < BigInt('1000000000000000000')) { // Less than 0.001 ETH
      console.log('❌ Insufficient funds. Please fund the account first.');
      return;
    }
    
    // Deploy the account
    const deployPayload = {
      classHash: accountData.classHash,
      constructorCalldata: accountData.constructorCallData,
      contractAddress: accountData.accountAddress,
      addressSalt: accountData.publicKey,
    };
    
    console.log('📝 Deploying account...');
    const { transaction_hash, contract_address } = await account.deployAccount(deployPayload);
    
    console.log('⏳ Waiting for transaction confirmation...');
    await provider.waitForTransaction(transaction_hash);
    
    console.log('✅ Standard ArgentX account deployed successfully!');
    console.log('📍 Final address:', contract_address);
    console.log('🔗 Transaction hash:', transaction_hash);
    console.log('');
    console.log('🎉 You can now use this account for contract deployment!');
    
  } catch (error: any) {
    console.log('❌ Deployment failed:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--deploy')) {
    // If you already have the account data, you can deploy it
    console.log('Please run without --deploy first to generate account details');
  } else {
    // Generate new account details
    await createStandardArgentAccount();
  }
}

main().catch(console.error);

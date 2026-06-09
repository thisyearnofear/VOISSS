import { Account, RpcProvider, typedData } from 'starknet';
import { config } from 'dotenv';

// Load environment variables
config();

const PROVIDER_URL = process.env.STARKNET_RPC_URL;
const ACCOUNT_ADDRESS = process.env.STARKNET_ACCOUNT_ADDRESS;
const PRIVATE_KEY = process.env.STARKNET_PRIVATE_KEY;

async function testSignature() {
  try {
    console.log('🔍 Testing signature format...');

    if (!ACCOUNT_ADDRESS || !PRIVATE_KEY) {
      console.log('❌ Missing account address or private key');
      return;
    }

    const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });
    const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);

    // Create a simple typed data message to sign
    const testTypedData = {
      types: {
        StarkNetDomain: [
          { name: 'name', type: 'felt' },
          { name: 'version', type: 'felt' },
          { name: 'chainId', type: 'felt' },
        ],
        Message: [
          { name: 'content', type: 'felt' },
        ],
      },
      primaryType: 'Message',
      domain: {
        name: 'Test',
        version: '1',
        chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA
      },
      message: {
        content: 'Hello Starknet',
      },
    };

    console.log('📝 Signing test message...');

    try {
      const signature = await account.signMessage(testTypedData);
      console.log('✅ Signature created successfully');
      console.log('📊 Signature object:', signature);

      // Convert signature to array format
      const sigArray = Array.isArray(signature) ? signature : [signature.r, signature.s];
      console.log(`📊 Signature length: ${sigArray.length}`);
      console.log(`🔢 Signature: [${sigArray.join(', ')}]`);

      if (sigArray.length === 2) {
        console.log('📋 Standard signature format (r, s)');
      } else if (sigArray.length === 5) {
        console.log('📋 Standard account signature (no guardian)');
      } else if (sigArray.length === 9) {
        console.log('📋 Smart account signature (with guardian)');
        console.log('   - Number of signers:', sigArray[0]);
        console.log('   - Signer 1 type:', sigArray[1]);
        console.log('   - Signer 1 pubkey:', sigArray[2]);
        console.log('   - Signer 1 r:', sigArray[3]);
        console.log('   - Signer 1 s:', sigArray[4]);
        console.log('   - Signer 2 type:', sigArray[5]);
        console.log('   - Signer 2 pubkey:', sigArray[6]);
        console.log('   - Signer 2 r:', sigArray[7]);
        console.log('   - Signer 2 s:', sigArray[8]);
      } else {
        console.log(`📋 Unknown signature format (length: ${sigArray.length})`);
      }

      // Try to verify the signature
      console.log('');
      console.log('🔍 Verifying signature...');

      try {
        const isValid = await provider.verifyMessageInStarknet(
          testTypedData,
          sigArray,
          ACCOUNT_ADDRESS
        );
        console.log(`✅ Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);
      } catch (error: any) {
        console.log('❌ Signature verification failed:', error.message);
      }

    } catch (error: any) {
      console.log('❌ Failed to sign message:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSignature();

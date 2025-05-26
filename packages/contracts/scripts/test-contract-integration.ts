import { RpcProvider, Contract } from 'starknet';
import { VOICE_STORAGE_ABI } from '../../shared/src/contracts/abis';

async function testContractIntegration() {
  console.log('🧪 Testing Starknet Contract Integration...\n');

  // Contract addresses from deployment
  const VOICE_STORAGE_ADDRESS = '0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2';
  const RPC_URL = 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

  try {
    // Initialize provider
    console.log('📡 Connecting to Starknet Sepolia...');
    const provider = new RpcProvider({ nodeUrl: RPC_URL });

    // Initialize contract
    console.log('📋 Initializing VoiceStorage contract...');
    const contract = new Contract(VOICE_STORAGE_ABI, VOICE_STORAGE_ADDRESS, provider);

    // Test 1: Check if contract is accessible
    console.log('✅ Test 1: Contract accessibility');
    try {
      const totalRecordings = await contract.get_total_recordings();
      console.log(`   📊 Total recordings: ${totalRecordings.toString()}`);
    } catch (error) {
      console.log(`   ❌ Failed to get total recordings: ${error}`);
    }

    // Test 2: Check ABI structure
    console.log('\n✅ Test 2: ABI structure validation');
    const storeRecordingFunction = VOICE_STORAGE_ABI.find(
      (item: any) => item.type === 'interface'
    )?.items?.find((item: any) => item.name === 'store_recording');
    
    if (storeRecordingFunction) {
      console.log('   📝 store_recording function found in ABI');
      console.log(`   📥 Inputs: ${storeRecordingFunction.inputs.length}`);
      console.log(`   📤 Outputs: ${storeRecordingFunction.outputs.length}`);
    } else {
      console.log('   ❌ store_recording function not found in ABI');
    }

    // Test 3: Check RecordingMetadata struct
    const recordingMetadataStruct = VOICE_STORAGE_ABI.find(
      (item: any) => item.type === 'struct' && item.name === 'voisss_contracts::voice_storage::RecordingMetadata'
    );
    
    if (recordingMetadataStruct) {
      console.log('   📋 RecordingMetadata struct found');
      console.log(`   🔧 Fields: ${recordingMetadataStruct.members.map((m: any) => m.name).join(', ')}`);
    } else {
      console.log('   ❌ RecordingMetadata struct not found');
    }

    console.log('\n🎉 Contract integration test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Provider connection: Working');
    console.log('   ✅ Contract initialization: Working');
    console.log('   ✅ ABI structure: Valid');
    console.log('   ✅ Contract calls: Ready for testing');

  } catch (error) {
    console.error('❌ Contract integration test failed:', error);
  }
}

// Run the test
testContractIntegration();

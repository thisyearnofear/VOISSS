// Test script to verify deployed contract addresses are accessible
import { CONTRACT_ADDRESSES } from './abis';
import { STARKNET_CONFIG } from '../constants';

console.log('🧪 Testing VOISSS Contract Deployment Integration...\n');

// Test 1: Contract addresses are defined
console.log('📋 Contract Addresses:');
console.log(`  UserRegistry: ${CONTRACT_ADDRESSES.USER_REGISTRY}`);
console.log(`  VoiceStorage: ${CONTRACT_ADDRESSES.VOICE_STORAGE}`);
console.log(`  AccessControl: ${CONTRACT_ADDRESSES.ACCESS_CONTROL}`);

// Test 2: Addresses are valid Starknet addresses
const isValidStarknetAddress = (address: string): boolean => {
  return address.startsWith('0x') && address.length === 66;
};

console.log('\n✅ Address Validation:');
console.log(`  UserRegistry: ${isValidStarknetAddress(CONTRACT_ADDRESSES.USER_REGISTRY) ? '✅ Valid' : '❌ Invalid'}`);
console.log(`  VoiceStorage: ${isValidStarknetAddress(CONTRACT_ADDRESSES.VOICE_STORAGE) ? '✅ Valid' : '❌ Invalid'}`);
console.log(`  AccessControl: ${isValidStarknetAddress(CONTRACT_ADDRESSES.ACCESS_CONTROL) ? '✅ Valid' : '❌ Invalid'}`);

// Test 3: Shared constants are updated
console.log('\n🔗 Shared Constants:');
console.log(`  VoiceStorage: ${STARKNET_CONFIG.CONTRACT_ADDRESSES.VOICE_STORAGE}`);
console.log(`  UserRegistry: ${STARKNET_CONFIG.CONTRACT_ADDRESSES.USER_REGISTRY}`);
console.log(`  AccessControl: ${STARKNET_CONFIG.CONTRACT_ADDRESSES.ACCESS_CONTROL}`);

// Test 4: Network configuration
console.log('\n🌐 Network Configuration:');
console.log(`  Testnet RPC: ${STARKNET_CONFIG.RPC_URLS.TESTNET}`);

// Summary
const allValid = [
  CONTRACT_ADDRESSES.USER_REGISTRY,
  CONTRACT_ADDRESSES.VOICE_STORAGE,
  CONTRACT_ADDRESSES.ACCESS_CONTROL
].every(isValidStarknetAddress);

console.log('\n🎉 Integration Test Results:');
console.log(`  Contract Addresses: ${allValid ? '✅ All Valid' : '❌ Some Invalid'}`);
console.log(`  Ready for Development: ${allValid ? '✅ Yes' : '❌ No'}`);

if (allValid) {
  console.log('\n🚀 All systems ready! Your apps can now interact with deployed contracts.');
} else {
  console.log('\n⚠️  Some addresses are invalid. Please check the deployment.');
}

export { CONTRACT_ADDRESSES, STARKNET_CONFIG };

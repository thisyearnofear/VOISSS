const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Deploying VoiceRecords contract to Base...');

  // Get the contract factory
  const VoiceRecords = await ethers.getContractFactory('VoiceRecords');

  // Deploy the contract
  console.log('📦 Deploying contract...');
  const voiceRecords = await VoiceRecords.deploy();

  // Wait for deployment to complete
  await voiceRecords.waitForDeployment();

  const contractAddress = await voiceRecords.getAddress();
  console.log('✅ VoiceRecords deployed to:', contractAddress);

  // Verify deployment by calling a view function
  const totalRecordings = await voiceRecords.getTotalRecordings();
  console.log('📊 Initial total recordings:', totalRecordings.toString());

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: 'base',
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log('📋 Deployment Info:', deploymentInfo);

  // Test basic functionality
  console.log('🧪 Testing basic functionality...');
  
  const [deployer] = await ethers.getSigners();
  console.log('👤 Deployer address:', deployer.address);

  // Test saving a recording
  const testTx = await voiceRecords.saveRecording(
    'QmTestHash123456789', // Test IPFS hash
    'Test Recording',
    true // isPublic
  );

  console.log('📝 Test transaction hash:', testTx.hash);
  
  // Wait for transaction
  const receipt = await testTx.wait();
  console.log('✅ Test transaction confirmed in block:', receipt.blockNumber);

  // Verify the recording was saved
  const newTotal = await voiceRecords.getTotalRecordings();
  console.log('📊 Total recordings after test:', newTotal.toString());

  // Get the test recording
  const testRecording = await voiceRecords.getRecording(1);
  console.log('🎵 Test recording details:', {
    ipfsHash: testRecording.ipfsHash,
    owner: testRecording.owner,
    title: testRecording.title,
    isPublic: testRecording.isPublic,
  });

  // Save contract address to .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove any existing VOICE_RECORDS_CONTRACT line
  const envLines = envContent.split('\n').filter(line =>
    !line.startsWith('NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=')
  );

  // Add the new contract address
  envLines.push(`NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=${contractAddress}`);

  // Write back to .env.local
  fs.writeFileSync(envPath, envLines.join('\n') + '\n');

  console.log('\n✅ Contract address saved to .env.local');
  console.log(`NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=${contractAddress}`);

  console.log('\n🎉 Deployment and testing completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. ✅ Contract deployed and environment updated');
  console.log('2. Restart the Next.js dev server to pick up new env vars');
  console.log('3. Test gasless transactions with Sub Accounts');

  return {
    contractAddress,
    deploymentInfo,
  };
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
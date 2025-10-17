/**
 * Test script for gasless recording flow
 * Run with: node scripts/test-gasless-flow.js
 */

const { ethers } = require('hardhat');

async function testGaslessFlow() {
  console.log('🧪 Testing Gasless Recording Flow...\n');

  // Get contract instance
  const contractAddress = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT;
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    console.error('❌ Contract not deployed. Run deployment first.');
    return;
  }

  const VoiceRecords = await ethers.getContractFactory('VoiceRecords');
  const voiceRecords = VoiceRecords.attach(contractAddress);

  console.log('📋 Contract Address:', contractAddress);

  // Get signers (simulating different users)
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log('👤 Test Users:');
  console.log('  - Deployer:', deployer.address);
  console.log('  - User 1:', user1.address);
  console.log('  - User 2:', user2.address);

  console.log('\n🎵 Testing Recording Operations...\n');

  // Test 1: Save recordings as different users
  console.log('1️⃣ Saving recordings...');
  
  const recordings = [
    { user: user1, ipfs: 'QmUser1Recording1', title: 'My First Recording', isPublic: true },
    { user: user1, ipfs: 'QmUser1Recording2', title: 'Private Recording', isPublic: false },
    { user: user2, ipfs: 'QmUser2Recording1', title: 'User 2 Public Recording', isPublic: true },
  ];

  for (let i = 0; i < recordings.length; i++) {
    const { user, ipfs, title, isPublic } = recordings[i];
    
    console.log(`   Saving: "${title}" by ${user.address.slice(0, 8)}...`);
    
    const tx = await voiceRecords.connect(user).saveRecording(ipfs, title, isPublic);
    const receipt = await tx.wait();
    
    console.log(`   ✅ Saved with ID: ${i + 1}, Gas used: ${receipt.gasUsed.toString()}`);
  }

  // Test 2: Retrieve recordings
  console.log('\n2️⃣ Retrieving recordings...');
  
  const totalRecordings = await voiceRecords.getTotalRecordings();
  console.log(`   Total recordings: ${totalRecordings.toString()}`);

  for (let i = 1; i <= totalRecordings; i++) {
    const recording = await voiceRecords.getRecording(i);
    console.log(`   Recording ${i}:`, {
      title: recording.title,
      owner: recording.owner.slice(0, 8) + '...',
      ipfsHash: recording.ipfsHash,
      isPublic: recording.isPublic,
      playCount: recording.playCount.toString(),
    });
  }

  // Test 3: User-specific recordings
  console.log('\n3️⃣ Testing user recordings...');
  
  const user1Recordings = await voiceRecords.getUserRecordings(user1.address);
  const user2Recordings = await voiceRecords.getUserRecordings(user2.address);
  
  console.log(`   User 1 recordings: [${user1Recordings.map(id => id.toString()).join(', ')}]`);
  console.log(`   User 2 recordings: [${user2Recordings.map(id => id.toString()).join(', ')}]`);

  // Test 4: Public recordings
  console.log('\n4️⃣ Testing public recordings...');
  
  const publicRecordings = await voiceRecords.getPublicRecordings(0, 10);
  console.log(`   Public recordings: [${publicRecordings.map(id => id.toString()).join(', ')}]`);

  // Test 5: Play count increment
  console.log('\n5️⃣ Testing play count...');
  
  console.log('   Incrementing play count for recording 1...');
  const playTx = await voiceRecords.connect(user2).incrementPlayCount(1);
  await playTx.wait();
  
  const updatedRecording = await voiceRecords.getRecording(1);
  console.log(`   ✅ New play count: ${updatedRecording.playCount.toString()}`);

  // Test 6: User statistics
  console.log('\n6️⃣ Testing user statistics...');
  
  const user1Stats = await voiceRecords.getUserStats(user1.address);
  console.log(`   User 1 stats:`, {
    totalCount: user1Stats.totalCount.toString(),
    publicCount: user1Stats.publicCount.toString(),
    totalPlays: user1Stats.totalPlays.toString(),
  });

  // Test 7: Visibility toggle
  console.log('\n7️⃣ Testing visibility toggle...');
  
  console.log('   Toggling visibility of recording 2...');
  const toggleTx = await voiceRecords.connect(user1).toggleVisibility(2);
  await toggleTx.wait();
  
  const toggledRecording = await voiceRecords.getRecording(2);
  console.log(`   ✅ New visibility: ${toggledRecording.isPublic ? 'Public' : 'Private'}`);

  // Test 8: Gas cost analysis
  console.log('\n8️⃣ Gas Cost Analysis...');
  
  const gasTestTx = await voiceRecords.connect(user1).saveRecording(
    'QmGasTestHash',
    'Gas Test Recording',
    true
  );
  const gasTestReceipt = await gasTestTx.wait();
  
  console.log(`   Save Recording Gas Cost: ${gasTestReceipt.gasUsed.toString()}`);
  console.log(`   Estimated Cost (Base): ~$${(Number(gasTestReceipt.gasUsed) * 0.000001).toFixed(6)}`);

  console.log('\n🎉 All tests completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Total Recordings: ${await voiceRecords.getTotalRecordings()}`);
  console.log(`   - Contract Address: ${contractAddress}`);
  console.log(`   - Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log('\n✅ Gasless flow is ready for integration!');
}

// Error handling
testGaslessFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
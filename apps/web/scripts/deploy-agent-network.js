const hre = require("hardhat");

async function main() {
  console.log("Deploying VOISSS Agent Network contracts to Base Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy AgentRegistry
  console.log("\n1. Deploying AgentRegistry...");
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);

  // Deploy ReputationRegistry
  console.log("\n2. Deploying ReputationRegistry...");
  const ReputationRegistry = await hre.ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy();
  await reputationRegistry.waitForDeployment();
  const reputationRegistryAddress = await reputationRegistry.getAddress();
  console.log("✅ ReputationRegistry deployed to:", reputationRegistryAddress);

  // Get existing VoiceRecords contract (or deploy new one if needed)
  console.log("\n3. Checking VoiceRecords contract...");
  let voiceRecordsAddress = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT;
  
  if (!voiceRecordsAddress) {
    console.log("No existing VoiceRecords contract found. Deploying new version with agent support...");
    const VoiceRecords = await hre.ethers.getContractFactory("VoiceRecords");
    const voiceRecords = await VoiceRecords.deploy();
    await voiceRecords.waitForDeployment();
    voiceRecordsAddress = await voiceRecords.getAddress();
    console.log("✅ VoiceRecords deployed to:", voiceRecordsAddress);
  } else {
    console.log("Using existing VoiceRecords at:", voiceRecordsAddress);
    console.log("⚠️  Note: If the existing contract doesn't have agent fields, you need to redeploy it.");
  }

  console.log("\n📋 Deployment Summary:");
  console.log("======================");
  console.log("AgentRegistry:", agentRegistryAddress);
  console.log("ReputationRegistry:", reputationRegistryAddress);
  console.log("VoiceRecords:", voiceRecordsAddress);
  
  console.log("\n📝 Update your .env.local with:");
  console.log(`NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT=${agentRegistryAddress}`);
  console.log(`NEXT_PUBLIC_REPUTATION_REGISTRY_CONTRACT=${reputationRegistryAddress}`);
  console.log(`NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=${voiceRecordsAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentRegistry: agentRegistryAddress,
      ReputationRegistry: reputationRegistryAddress,
      VoiceRecords: voiceRecordsAddress,
    }
  };

  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `agent-network-${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Verification instructions
  console.log("\n🔍 To verify contracts on Basescan:");
  console.log(`npx hardhat verify --network baseSepolia ${agentRegistryAddress}`);
  console.log(`npx hardhat verify --network baseSepolia ${reputationRegistryAddress}`);
  if (voiceRecordsAddress && !process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT) {
    console.log(`npx hardhat verify --network baseSepolia ${voiceRecordsAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });

/**
 * Deploy VoiceLicenseMarket Contract to Base
 * 
 * Usage:
 * npx hardhat run scripts/deploy-marketplace.ts --network base
 */

import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying VoiceLicenseMarket to Base...\n");

  // USDC on Base Mainnet
  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  
  // Platform treasury (update with your address)
  const PLATFORM_TREASURY = process.env.PLATFORM_TREASURY_ADDRESS || process.env.NEXT_PUBLIC_SPENDER_ADDRESS;
  
  if (!PLATFORM_TREASURY) {
    throw new Error("PLATFORM_TREASURY_ADDRESS or NEXT_PUBLIC_SPENDER_ADDRESS must be set");
  }

  console.log("Configuration:");
  console.log("- USDC Address:", USDC_ADDRESS);
  console.log("- Platform Treasury:", PLATFORM_TREASURY);
  console.log("");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  const VoiceLicenseMarket = await hre.ethers.getContractFactory("VoiceLicenseMarket");
  const marketplace = await VoiceLicenseMarket.deploy(USDC_ADDRESS, PLATFORM_TREASURY);

  await marketplace.waitForDeployment();
  const address = await marketplace.getAddress();

  console.log("✅ VoiceLicenseMarket deployed to:", address);
  console.log("");

  // Verify configuration
  const platformFeeBps = await marketplace.platformFeeBps();
  const treasury = await marketplace.platformTreasury();
  const usdc = await marketplace.usdc();

  console.log("Contract Configuration:");
  console.log("- Platform Fee:", platformFeeBps.toString(), "bps (", Number(platformFeeBps) / 100, "%)");
  console.log("- Treasury:", treasury);
  console.log("- USDC:", usdc);
  console.log("");

  console.log("📝 Next steps:");
  console.log("1. Add to .env.local:");
  console.log(`   NEXT_PUBLIC_VOICE_LICENSE_MARKET_ADDRESS=${address}`);
  console.log("");
  console.log("2. Verify contract on BaseScan:");
  console.log(`   npx hardhat verify --network base ${address} "${USDC_ADDRESS}" "${PLATFORM_TREASURY}"`);
  console.log("");
  console.log("3. Update docs/BLOCKCHAIN_GUIDE.md with contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

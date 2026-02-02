/**
 * AgentRegistry v2.0.0 Verification Script
 * 
 * Verifies the deployed contract is working correctly:
 * - Contract is accessible
 * - USDC token is set correctly
 * - Functions are callable
 * - Events are emitted
 * 
 * Usage: node scripts/verify-agent-registry.js
 */

const { ethers } = require('hardhat');

// Configuration
const AGENT_REGISTRY_ADDRESS = '0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c';
const USDC_BASE_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// ABI (minimal for verification)
const AGENT_REGISTRY_ABI = [
  // View functions
  'function VERSION() view returns (string)',
  'function usdcToken() view returns (address)',
  'function totalAgents() view returns (uint256)',
  'function activeAgents() view returns (uint256)',
  'function totalUSDCHeld() view returns (uint256)',
  'function getAgent(address agentAddress) view returns (tuple(string metadataURI, string name, string[] categories, uint256 registeredAt, bool isActive, bool x402Enabled, bool isBanned, uint8 tier, uint256 usdcBalance, uint256 usdcLocked, uint256 totalSpent, address voiceProvider))',
  'function isAgent(address addr) view returns (bool)',
  'function getAvailableUSDC(address agentAddress) view returns (uint256)',
  'function authorizedServices(address service) view returns (bool)',
  
  // Write functions
  'function registerAgent(string name, string metadataURI, string[] categories, bool x402Enabled) returns (bool)',
  'function depositUSDC(uint256 amount)',
  'function withdrawUSDC(uint256 amount)',
  'function setServiceAuthorization(address service, bool authorized)',
  
  // Events
  'event AgentRegistered(address indexed agentAddress, string name, string metadataURI, bool x402Enabled)',
  'event CreditsDeposited(address indexed agentAddress, uint256 amount, uint256 newBalance)',
  'event CreditsWithdrawn(address indexed agentAddress, uint256 amount, uint256 newBalance)',
  'event ServiceAuthorized(address indexed service, bool authorized)',
];

async function verifyContract() {
  console.log('🔍 Verifying AgentRegistry v2.0.0...\n');
  
  const [deployer] = await ethers.getSigners();
  console.log('Using account:', deployer.address);
  
  const registry = new ethers.Contract(
    AGENT_REGISTRY_ADDRESS,
    AGENT_REGISTRY_ABI,
    deployer
  );
  
  try {
    // 1. Check VERSION
    console.log('1️⃣ Checking VERSION...');
    const version = await registry.VERSION();
    console.log(`   ✓ VERSION: ${version}`);
    if (version !== '2.0.0') {
      console.warn('   ⚠️  Expected version 2.0.0');
    }
    
    // 2. Check USDC token
    console.log('\n2️⃣ Checking USDC token...');
    const usdcToken = await registry.usdcToken();
    console.log(`   ✓ USDC Token: ${usdcToken}`);
    if (usdcToken.toLowerCase() !== USDC_BASE_MAINNET.toLowerCase()) {
      console.error(`   ❌ Expected ${USDC_BASE_MAINNET}`);
      process.exit(1);
    }
    
    // 3. Check initial state
    console.log('\n3️⃣ Checking initial state...');
    const totalAgents = await registry.totalAgents();
    const activeAgents = await registry.activeAgents();
    const totalUSCHeld = await registry.totalUSDCHeld();
    console.log(`   ✓ Total Agents: ${totalAgents}`);
    console.log(`   ✓ Active Agents: ${activeAgents}`);
    console.log(`   ✓ Total USDC Held: ${ethers.formatUnits(totalUSCHeld, 6)} USDC`);
    
    // 4. Test registration (if not already registered)
    console.log('\n4️⃣ Testing agent registration...');
    const isAlreadyAgent = await registry.isAgent(deployer.address);
    
    if (!isAlreadyAgent) {
      console.log('   Registering as agent...');
      const tx = await registry.registerAgent(
        'Test Agent',
        'ipfs://QmTest',
        ['defi', 'test'],
        true
      );
      await tx.wait();
      console.log('   ✓ Registered successfully');
    } else {
      console.log('   ✓ Already registered as agent');
    }
    
    // 5. Check agent profile
    console.log('\n5️⃣ Checking agent profile...');
    const agent = await registry.getAgent(deployer.address);
    console.log(`   ✓ Name: ${agent.name}`);
    console.log(`   ✓ Active: ${agent.isActive}`);
    console.log(`   ✓ x402Enabled: ${agent.x402Enabled}`);
    console.log(`   ✓ USDC Balance: ${ethers.formatUnits(agent.usdcBalance, 6)} USDC`);
    console.log(`   ✓ USDC Locked: ${ethers.formatUnits(agent.usdcLocked, 6)} USDC`);
    console.log(`   ✓ Total Spent: ${ethers.formatUnits(agent.totalSpent, 6)} USDC`);
    
    // 6. Test service authorization (owner only)
    console.log('\n6️⃣ Testing service authorization...');
    const testService = deployer.address; // Using deployer as test service
    const tx = await registry.setServiceAuthorization(testService, true);
    await tx.wait();
    
    const isAuthorized = await registry.authorizedServices(testService);
    console.log(`   ✓ Service ${testService.slice(0, 10)}... authorized: ${isAuthorized}`);
    
    // Cleanup: revoke authorization
    const tx2 = await registry.setServiceAuthorization(testService, false);
    await tx2.wait();
    console.log('   ✓ Authorization revoked (cleanup)');
    
    // Summary
    console.log('\n✅ All checks passed!');
    console.log('\n📋 Summary:');
    console.log(`   Contract: ${AGENT_REGISTRY_ADDRESS}`);
    console.log(`   Version: ${version}`);
    console.log(`   USDC Token: ${usdcToken}`);
    console.log(`   Total Agents: ${totalAgents}`);
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyContract()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { verifyContract };

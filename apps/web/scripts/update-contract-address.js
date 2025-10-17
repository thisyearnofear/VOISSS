/**
 * Helper script to update contract address in environment variables
 * Run after deployment: node scripts/update-contract-address.js <contract_address>
 */

const fs = require('fs');
const path = require('path');

function updateContractAddress(contractAddress) {
  if (!contractAddress) {
    console.error('Usage: node scripts/update-contract-address.js <contract_address>');
    process.exit(1);
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    console.error('Invalid contract address format. Expected: 0x...');
    process.exit(1);
  }

  const envPath = path.join(__dirname, '..', '.env.local');
  
  try {
    let envContent = '';
    
    // Read existing .env.local if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add the contract address
    const contractLine = `NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=${contractAddress}`;
    
    if (envContent.includes('NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=')) {
      // Replace existing line
      envContent = envContent.replace(
        /NEXT_PUBLIC_VOICE_RECORDS_CONTRACT=.*/,
        contractLine
      );
    } else {
      // Add new line
      envContent += envContent.endsWith('\n') ? '' : '\n';
      envContent += `${contractLine}\n`;
    }

    // Write back to file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Contract address updated successfully!');
    console.log(`📝 Updated .env.local with: ${contractLine}`);
    console.log('🔄 Restart your development server to apply changes.');
    
  } catch (error) {
    console.error('❌ Failed to update .env.local:', error.message);
    process.exit(1);
  }
}

// Get contract address from command line arguments
const contractAddress = process.argv[2];
updateContractAddress(contractAddress);
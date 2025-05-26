import fs from 'fs';
import path from 'path';

interface ContractClass {
  abi: any[];
  sierra_program: string[];
  contract_class_version: string;
  entry_points_by_type: any;
}

function extractABI(contractName: string): any[] {
  const contractPath = path.join(__dirname, '..', 'target', 'dev', `voisss_contracts_${contractName}.contract_class.json`);
  
  if (!fs.existsSync(contractPath)) {
    console.error(`Contract file not found: ${contractPath}`);
    return [];
  }

  try {
    const contractData: ContractClass = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    return contractData.abi || [];
  } catch (error) {
    console.error(`Error reading contract ${contractName}:`, error);
    return [];
  }
}

function generateABIFile() {
  const voiceStorageABI = extractABI('VoiceStorage');
  const userRegistryABI = extractABI('UserRegistry');
  const accessControlABI = extractABI('AccessControl');

  const abiContent = `// Auto-generated ABIs from compiled contracts
// Generated on ${new Date().toISOString()}

export const VOICE_STORAGE_ABI = ${JSON.stringify(voiceStorageABI, null, 2)};

export const USER_REGISTRY_ABI = ${JSON.stringify(userRegistryABI, null, 2)};

export const ACCESS_CONTROL_ABI = ${JSON.stringify(accessControlABI, null, 2)};

// Legacy exports for backward compatibility
export const VoiceStorageABI = VOICE_STORAGE_ABI;
export const UserRegistryABI = USER_REGISTRY_ABI;
export const AccessControlABI = ACCESS_CONTROL_ABI;
`;

  const outputPath = path.join(__dirname, '..', '..', 'shared', 'src', 'contracts', 'abis.ts');
  fs.writeFileSync(outputPath, abiContent);
  
  console.log('✅ ABIs extracted successfully!');
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 VoiceStorage ABI: ${voiceStorageABI.length} entries`);
  console.log(`📊 UserRegistry ABI: ${userRegistryABI.length} entries`);
  console.log(`📊 AccessControl ABI: ${accessControlABI.length} entries`);
}

// Run the extraction
generateABIFile();

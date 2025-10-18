/**
 * Base Recording Service - Gasless Transaction Edition
 *
 * This service uses the backend spender wallet to execute gasless transactions.
 * Users only need to grant spend permission once, then all saves are popup-free!
 *
 * Architecture:
 * 1. User uploads to IPFS (frontend)
 * 2. Service calls backend API with IPFS hash + metadata
 * 3. Backend verifies spend permission and executes transaction
 * 4. User receives transaction hash (no wallet popup!)
 */

const VOICE_RECORDS_CONTRACT = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as `0x${string}`;

interface RecordingMetadata {
  title: string;
  description: string;
  isPublic: boolean;
  tags: string[];
}

interface SaveRecordingResponse {
  success: boolean;
  txHash: string;
  status: string;
  blockNumber: string;
}

export function createBaseRecordingService(userAddress: string | null) {
  if (!VOICE_RECORDS_CONTRACT) {
    throw new Error("VOICE_RECORDS_CONTRACT environment variable not set. Please deploy the VoiceRecords contract first.");
  }

  if (!userAddress) {
    throw new Error("User address is required. Please connect your wallet first.");
  }

  /**
   * Saves a recording's metadata to the Base blockchain in a gasless transaction.
   * No wallet popup required after initial permission grant!
   *
   * @param ipfsHash The IPFS hash of the audio file
   * @param metadata The recording's metadata
   * @returns Promise resolving with the transaction hash
   */
  const saveRecording = async (
    ipfsHash: string,
    metadata: RecordingMetadata
  ): Promise<string> => {
    try {
      // Get stored permission hash
      const permissionHash = localStorage.getItem('spendPermissionHash');
      
      if (!permissionHash) {
        throw new Error('No spend permission found. Please grant permission first.');
      }

      console.log('📤 Sending gasless save request to backend...');

      // Call backend API for gasless transaction
      const response = await fetch('/api/base/save-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          permissionHash,
          ipfsHash,
          title: metadata.title,
          isPublic: metadata.isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recording');
      }

      const data: SaveRecordingResponse = await response.json();

      console.log('✅ Recording saved successfully:', data.txHash);
      console.log('📊 Block number:', data.blockNumber);

      return data.txHash;

    } catch (error: any) {
      console.error("Failed to save recording to Base:", error);
      
      // Provide user-friendly error messages
      if (error.message?.includes('permission')) {
        throw new Error('Spend permission expired or invalid. Please grant permission again.');
      } else if (error.message?.includes('insufficient funds')) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(error.message || 'Failed to save recording to the blockchain.');
      }
    }
  };

  return {
    saveRecording,
  };
}
import { encodeFunctionData } from "viem";
import { VoiceRecordsABI } from "../contracts/VoiceRecordsABI";

// The address of the deployed VoiceRecords contract
const VOICE_RECORDS_CONTRACT = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as `0x${string}`;

interface RecordingMetadata {
  title: string;
  description: string;
  isPublic: boolean;
  tags: string[];
}

export function createBaseRecordingService(
  sendCalls: (calls: Array<{ to: string; data: string; value?: string }>) => Promise<string>
) {
  if (!VOICE_RECORDS_CONTRACT) {
    throw new Error("VOICE_RECORDS_CONTRACT environment variable not set. Please deploy the VoiceRecords contract first.");
  }

  /**
   * Saves a recording's metadata to the Base blockchain in a gasless transaction.
   * @param ipfsHash The IPFS hash of the audio file.
   * @param metadata The recording's metadata.
   * @returns A promise that resolves with the transaction ID.
   */
  const saveRecording = async (
    ipfsHash: string,
    metadata: RecordingMetadata
  ): Promise<string> => {
    if (!VOICE_RECORDS_CONTRACT) {
      throw new Error("VoiceRecords contract address is not configured.");
    }

    try {
      const callData = encodeFunctionData({
        abi: VoiceRecordsABI,
        functionName: "saveRecording",
        args: [ipfsHash, metadata.title, metadata.isPublic],
      });

      const txId = await sendCalls([
        {
          to: VOICE_RECORDS_CONTRACT,
          data: callData,
        },
      ]);

      return txId;
    } catch (error) {
      console.error("Failed to save recording to Base:", error);
      throw new Error("Failed to save recording to the blockchain.");
    }
  };

  return {
    saveRecording,
  };
}
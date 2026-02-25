/**
 * Hook for Voice Marketplace Contract Interactions
 * ENHANCEMENT FIRST: Integrates with existing wagmi/viem patterns
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VoiceLicenseMarketABI, VOICE_LICENSE_MARKET_ADDRESS } from '@/contracts/VoiceLicenseMarketABI';
import { parseUnits, formatUnits } from 'viem';

export function useVoiceMarketplace() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // List a voice for licensing
  const listVoice = async (
    voiceId: bigint,
    priceUSDC: string, // e.g., "49" for $49
    isExclusive: boolean
  ) => {
    if (!VOICE_LICENSE_MARKET_ADDRESS) {
      throw new Error('Marketplace contract not deployed');
    }

    const priceWei = parseUnits(priceUSDC, 6); // USDC has 6 decimals

    const hash = await writeContractAsync({
      address: VOICE_LICENSE_MARKET_ADDRESS,
      abi: VoiceLicenseMarketABI,
      functionName: 'listVoice',
      args: [voiceId, priceWei, isExclusive],
    });

    return hash;
  };

  // Delist a voice
  const delistVoice = async (voiceId: bigint) => {
    if (!VOICE_LICENSE_MARKET_ADDRESS) {
      throw new Error('Marketplace contract not deployed');
    }

    const hash = await writeContractAsync({
      address: VOICE_LICENSE_MARKET_ADDRESS,
      abi: VoiceLicenseMarketABI,
      functionName: 'delistVoice',
      args: [voiceId],
    });

    return hash;
  };

  // Purchase a license (requires USDC approval first)
  const purchaseLicense = async (voiceId: bigint) => {
    if (!VOICE_LICENSE_MARKET_ADDRESS) {
      throw new Error('Marketplace contract not deployed');
    }

    const hash = await writeContractAsync({
      address: VOICE_LICENSE_MARKET_ADDRESS,
      abi: VoiceLicenseMarketABI,
      functionName: 'purchaseLicense',
      args: [voiceId],
    });

    return hash;
  };

  return {
    listVoice,
    delistVoice,
    purchaseLicense,
  };
}

// Hook to read listing details
export function useVoiceListing(voiceId?: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VOICE_LICENSE_MARKET_ADDRESS,
    abi: VoiceLicenseMarketABI,
    functionName: 'getListing',
    args: voiceId ? [voiceId] : undefined,
    query: {
      enabled: !!voiceId && !!VOICE_LICENSE_MARKET_ADDRESS,
    },
  });

  return {
    listing: data,
    isLoading,
    error,
    refetch,
  };
}

// Hook to check if user has active license
export function useHasLicense(voiceId?: bigint, userAddress?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VOICE_LICENSE_MARKET_ADDRESS,
    abi: VoiceLicenseMarketABI,
    functionName: 'hasActiveLicense',
    args: voiceId && userAddress ? [voiceId, userAddress] : undefined,
    query: {
      enabled: !!voiceId && !!userAddress && !!VOICE_LICENSE_MARKET_ADDRESS,
    },
  });

  return {
    hasLicense: data,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get user's license ID
export function useUserLicense(voiceId?: bigint, userAddress?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VOICE_LICENSE_MARKET_ADDRESS,
    abi: VoiceLicenseMarketABI,
    functionName: 'getUserLicense',
    args: voiceId && userAddress ? [voiceId, userAddress] : undefined,
    query: {
      enabled: !!voiceId && !!userAddress && !!VOICE_LICENSE_MARKET_ADDRESS,
    },
  });

  return {
    licenseId: data,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get license details
export function useLicenseDetails(licenseId?: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VOICE_LICENSE_MARKET_ADDRESS,
    abi: VoiceLicenseMarketABI,
    functionName: 'getLicense',
    args: licenseId ? [licenseId] : undefined,
    query: {
      enabled: !!licenseId && !!VOICE_LICENSE_MARKET_ADDRESS,
    },
  });

  return {
    license: data,
    isLoading,
    error,
    refetch,
  };
}

// Helper to format USDC amounts
export function formatUSDC(wei: bigint): string {
  return formatUnits(wei, 6);
}

export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6);
}

import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Basenames Registry Contract Address
const BASENAMES_REGISTRY = '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5';

// Create a public client for Base
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * Hook to resolve Basenames for Base addresses
 * Uses direct contract calls to resolve human-readable names
 */
export function useBasename(address?: string) {
  const [basename, setBasename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBasename(null);
      setIsLoading(false);
      return;
    }

    const resolveBasename = async () => {
      setIsLoading(true);
      try {
        // Call the Basenames registry contract
        const resolvedName = await publicClient.readContract({
          address: BASENAMES_REGISTRY,
          abi: [
            {
              name: 'getName',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'addr', type: 'address' }],
              outputs: [{ name: '', type: 'string' }],
            },
          ],
          functionName: 'getName',
          args: [address],
        });

        // If we got a resolved name and it's not empty, use it
        if (resolvedName && typeof resolvedName === 'string' && resolvedName.length > 0) {
          setBasename(resolvedName);
        } else {
          setBasename(null);
        }
      } catch (error) {
        console.warn('Failed to resolve basename:', error);
        setBasename(null);
      } finally {
        setIsLoading(false);
      }
    };

    resolveBasename();
  }, [address]);

  return {
    basename,
    displayName: basename || address,
    isLoading,
    hasBasename: !!basename,
  };
}

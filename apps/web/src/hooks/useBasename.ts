import { useState, useEffect } from 'react';
import { resolveL2Name, BASENAME_RESOLVER_ADDRESS } from 'thirdweb/extensions/ens';
import { createThirdwebClient } from 'thirdweb';
import { base } from 'thirdweb/chains';

// Thirdweb client for basename resolution
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'cd2fc16a6b59aa67ccaa3c76eaa421f3',
});

/**
 * Hook to resolve Basenames for Base addresses
 * Uses direct contract calls to resolve human-readable names
 */
export function useBasename(address?: `0x${string}` | null) {
  const [basename, setBasename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBasename(null);
      setIsLoading(false);
      return;
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      console.error('Invalid address format:', address);
      setBasename(null);
      setIsLoading(false);
      return;
    }

    const resolveBasename = async () => {
      setIsLoading(true);
      try {
        // Use Thirdweb's L2 name resolution for Basenames
        const resolvedName = await resolveL2Name({
          client,
          address: address as `0x${string}`,
          resolverAddress: BASENAME_RESOLVER_ADDRESS,
          resolverChain: base,
        });

        // Set the resolved basename if found, otherwise null
        if (resolvedName && resolvedName.length > 0) {
          setBasename(resolvedName);
        } else {
          setBasename(null);
        }
      } catch (error) {
        // Silently fail if no basename is registered (expected for most addresses)
        console.error('Error resolving basename:', error);
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

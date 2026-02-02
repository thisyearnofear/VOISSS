import { useCallback, useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { AgentRegistryABI } from '../contracts/AgentRegistryABI';

const AGENT_REGISTRY_CONTRACT = process.env.NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT || '0x27793FB04A35142445dd08F908F3b884061Ea3FA';

export function useAgentVerification() {
  const { address, isConnected } = useAccount();
  const [isVerified, setIsVerified] = useState(false);

  const { data: agentData, refetch } = useReadContract({
    address: AGENT_REGISTRY_CONTRACT as `0x${string}`,
    abi: AgentRegistryABI,
    functionName: 'agents',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  useEffect(() => {
    if (agentData && Array.isArray(agentData)) {
      // agentData is [agentAddress, metadataURI, name, registeredAt, isActive, x402Enabled]
      const registeredAt = agentData[3] as bigint;
      const isActive = agentData[4] as boolean;
      setIsVerified(registeredAt > 0n && isActive);
    } else {
      setIsVerified(false);
    }
  }, [agentData]);

  const checkVerification = useCallback(async () => {
    if (!address || !isConnected) return false;
    const result = await refetch();
    if (result.data && Array.isArray(result.data)) {
      const registeredAt = result.data[3] as bigint;
      const isActive = result.data[4] as boolean;
      return registeredAt > 0n && isActive;
    }
    return false;
  }, [address, isConnected, refetch]);

  return {
    isVerifiedAgent: isVerified,
    isRegistered: isVerified,
    agentData: agentData as [string, string, string, bigint, boolean, boolean] | undefined,
    refetch,
    checkVerification,
    isConnected,
    address,
  };
}

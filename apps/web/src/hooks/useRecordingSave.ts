'use client';

/**
 * useRecordingSave
 *
 * All blockchain save logic for the Recording Studio.
 * CLEAN: isolates IPFS + contract interaction from UI rendering.
 * MODULAR: composable with different save strategies (gasless vs manual gas).
 */

import { useCallback, useState } from 'react';
import { createWalletClient, custom, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import { createIPFSService } from '@voisss/shared';
import { VoiceRecordsABI } from '@/contracts/VoiceRecordsABI';
import type { AgentCategory } from '@voisss/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecordingMetadata {
  title: string;
  description: string;
  isPublic: boolean;
  tags: string[];
  isAgentContent?: boolean;
  category?: AgentCategory | string;
  x402Price?: string;
}

export interface SaveResult {
  ipfsHash: string;
  txHash?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseRecordingSaveOptions {
  duration: number;
  subAccountAddress: string | undefined;
  hasSubAccount: boolean;
  isConnected: boolean;
  provider: any;
  isAgentMode: boolean;
  agentCategory: AgentCategory | string;
  x402Price: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function useRecordingSave({
  duration,
  subAccountAddress,
  hasSubAccount,
  isConnected,
  provider,
  isAgentMode,
  agentCategory,
  x402Price,
  onToast,
}: UseRecordingSaveOptions) {
  const [isDirectSaving, setIsDirectSaving] = useState(false);
  const contractAddress = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as `0x${string}`;
  const ipfsService = createIPFSService();

  // ── Gasless save via Sub Account ──────────────────────────────────────────

  const saveRecordingToBase = useCallback(
    async (audioBlob: Blob, metadata: RecordingMetadata): Promise<SaveResult> => {
      if (!subAccountAddress || !hasSubAccount) {
        throw new Error('Sub Account not available. Use saveRecordingWithGas instead.');
      }
      if (!isConnected) throw new Error('Base Account not connected.');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.mp3`;

      const ipfsResult = await ipfsService.uploadAudio(audioBlob, {
        filename,
        mimeType: audioBlob.type || 'audio/mpeg',
        duration,
      });

      const callData = encodeFunctionData({
        abi: VoiceRecordsABI,
        functionName: 'saveRecording',
        args: [
          ipfsResult.hash,
          metadata.title,
          JSON.stringify({ description: metadata.description, tags: metadata.tags }),
          metadata.isPublic,
          metadata.isAgentContent ?? false,
          metadata.category ?? '',
          metadata.x402Price
            ? BigInt(Math.floor(parseFloat(metadata.x402Price) * 1e6))
            : BigInt(0),
        ],
      });

      const txHash = await provider?.request({
        method: 'eth_sendTransaction',
        params: [{ from: subAccountAddress, to: contractAddress, data: callData }],
      });

      return { ipfsHash: ipfsResult.hash, txHash };
    },
    [subAccountAddress, hasSubAccount, isConnected, ipfsService, duration, contractAddress, provider]
  );

  // ── Manual-gas save via injected wallet ──────────────────────────────────

  const saveRecordingWithGas = useCallback(
    async (audioBlob: Blob, metadata: RecordingMetadata): Promise<SaveResult> => {
      if (!window.ethereum) throw new Error('No wallet detected. Please install MetaMask.');
      if (!contractAddress) throw new Error('Contract not deployed. Please contact support.');

      setIsDirectSaving(true);
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.mp3`;

        const ipfsResult = await ipfsService.uploadAudio(audioBlob, {
          filename,
          mimeType: audioBlob.type || 'audio/mpeg',
          duration,
        });

        const walletClient = createWalletClient({
          chain: base,
          transport: custom(window.ethereum as any),
        });

        const [account] = await walletClient.getAddresses();

        const data = encodeFunctionData({
          abi: VoiceRecordsABI,
          functionName: 'saveRecording',
          args: [
            ipfsResult.hash,
            metadata.title,
            JSON.stringify({ description: metadata.description, tags: metadata.tags }),
            metadata.isPublic,
            metadata.isAgentContent ?? false,
            metadata.category ?? '',
            metadata.x402Price
              ? BigInt(Math.floor(parseFloat(metadata.x402Price) * 1e6))
              : BigInt(0),
          ],
        });

        const txHash = await walletClient.sendTransaction({ account, to: contractAddress, data });

        onToast(`Recording saved! Tx: ${txHash.slice(0, 10)}...`, 'success');
        return { ipfsHash: ipfsResult.hash, txHash };
      } finally {
        setIsDirectSaving(false);
      }
    },
    [contractAddress, ipfsService, duration, onToast]
  );

  // ── Preferred save method (auto-selects gasless when available) ──────────

  const saveMethod = hasSubAccount ? saveRecordingToBase : saveRecordingWithGas;

  return {
    isDirectSaving,
    saveRecordingToBase,
    saveRecordingWithGas,
    saveMethod,
  };
}

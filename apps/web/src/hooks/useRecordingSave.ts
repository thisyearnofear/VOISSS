'use client';

/**
 * useRecordingSave
 *
 * All blockchain save logic for the Recording Studio.
 * CLEAN: isolates IPFS + contract interaction from UI rendering.
 * MODULAR: composable with different save strategies (gasless vs manual gas).
 */

import { useCallback, useState } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  encodeFunctionData,
  http,
} from 'viem';
import { base } from 'viem/chains';
import { createIPFSService } from '@voisss/shared';
import { VoiceRecordsABI } from '@/contracts/VoiceRecordsABI';
import { VoiceLicenseMarketABI, VOICE_LICENSE_MARKET_ADDRESS } from '@/contracts/VoiceLicenseMarketABI';
import type { AgentCategory } from '@voisss/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecordingMetadata {
  title: string;
  description: string;
  isPublic: boolean;
  tags: string[];
  analysis?: {
    provider?: string;
    model?: string;
    humanityCertificate?: {
      status: "verified-human" | "review-needed" | "uncertain";
      badge: string;
      confidence: number;
      verdict: string;
      humanSignals: string[];
      aiArtifacts: string[];
      provenanceNotes: string[];
    };
  };
  marketplace?: {
    enabled: boolean;
    priceUSDC: string;
    isExclusive: boolean;
  };
  isAgentContent?: boolean;
  category?: AgentCategory | string;
  x402Price?: string;
}

export interface SaveResult {
  ipfsHash: string;
  txHash?: string;
  recordingId?: bigint;
  marketplaceTxHash?: string;
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
  const rpcUrl =
    process.env.NEXT_PUBLIC_BASE_RPC_URL ||
    process.env.BASE_RPC_URL ||
    "https://mainnet.base.org";
  const ipfsService = createIPFSService();
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const decodeRecordingId = useCallback(
    async (txHash: `0x${string}`): Promise<bigint | undefined> => {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: VoiceRecordsABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'RecordingSaved') {
            const args = decoded.args as { recordingId?: bigint } | readonly unknown[] | undefined;
            if (args && !Array.isArray(args)) {
              const eventArgs = args as { recordingId?: bigint };
              const recordingId = eventArgs.recordingId;
              if (typeof recordingId === 'bigint') {
                return recordingId;
              }
            }
          }
        } catch {
          continue;
        }
      }

      return undefined;
    },
    [publicClient]
  );

  const maybeListOnMarketplace = useCallback(
    async (args: {
      recordingId?: bigint;
      signer: {
        sendTransaction: (params: { from?: string; to: `0x${string}`; data: `0x${string}` }) => Promise<`0x${string}` | string>;
      };
      from?: string;
      metadata: RecordingMetadata;
    }): Promise<string | undefined> => {
      if (!args.recordingId || !args.metadata.marketplace?.enabled || !VOICE_LICENSE_MARKET_ADDRESS) {
        return undefined;
      }

      const marketplaceData = encodeFunctionData({
        abi: VoiceLicenseMarketABI,
        functionName: 'listVoice',
        args: [
          args.recordingId,
          BigInt(Math.floor(parseFloat(args.metadata.marketplace.priceUSDC || '0') * 1e6)),
          args.metadata.marketplace.isExclusive,
        ],
      });

      const txHash = await args.signer.sendTransaction({
        from: args.from,
        to: VOICE_LICENSE_MARKET_ADDRESS,
        data: marketplaceData,
      });

      return txHash.toString();
    },
    []
  );

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

      // 1. Save provenance record
      const callData = encodeFunctionData({
        abi: VoiceRecordsABI,
        functionName: 'saveRecording',
        args: [
          ipfsResult.hash,
          metadata.title,
          JSON.stringify({
            description: metadata.description,
            tags: metadata.tags,
            analysis: metadata.analysis,
            humanityCertificate: metadata.analysis?.humanityCertificate,
          }),
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

      const recordingId = await decodeRecordingId(txHash);

      // 2. Optional marketplace listing using the real recordingId
      let marketplaceTxHash: string | undefined;
      if (metadata.marketplace?.enabled) {
        try {
          marketplaceTxHash = await maybeListOnMarketplace({
            recordingId,
            signer: {
              sendTransaction: async ({ from, to, data }) =>
                provider?.request({
                  method: 'eth_sendTransaction',
                  params: [{ from, to, data }],
                }),
            },
            from: subAccountAddress,
            metadata,
          });
          onToast('Voice listed on Marketplace with its trust certificate.', 'success');
        } catch (listErr) {
          console.error('Marketplace auto-listing failed:', listErr);
        }
      }

      return { ipfsHash: ipfsResult.hash, txHash, recordingId, marketplaceTxHash };
    },
    [
      subAccountAddress,
      hasSubAccount,
      isConnected,
      ipfsService,
      duration,
      contractAddress,
      provider,
      onToast,
      decodeRecordingId,
      maybeListOnMarketplace,
    ]
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

        // 1. Save provenance
        const data = encodeFunctionData({
          abi: VoiceRecordsABI,
          functionName: 'saveRecording',
          args: [
            ipfsResult.hash,
            metadata.title,
            JSON.stringify({
              description: metadata.description,
              tags: metadata.tags,
              analysis: metadata.analysis,
              humanityCertificate: metadata.analysis?.humanityCertificate,
            }),
            metadata.isPublic,
            metadata.isAgentContent ?? false,
            metadata.category ?? '',
            metadata.x402Price
              ? BigInt(Math.floor(parseFloat(metadata.x402Price) * 1e6))
              : BigInt(0),
          ],
        });

        const txHash = await walletClient.sendTransaction({ account, to: contractAddress, data });

        const recordingId = await decodeRecordingId(txHash);

        // 2. Optional marketplace listing using the real recordingId
        let marketplaceTxHash: string | undefined;
        if (metadata.marketplace?.enabled) {
          try {
            marketplaceTxHash = await maybeListOnMarketplace({
              recordingId,
              signer: {
                sendTransaction: async ({ to, data }) =>
                  walletClient.sendTransaction({ account, to, data }),
              },
              metadata,
            });
            onToast('Voice listed on Marketplace with its trust certificate.', 'success');
          } catch (err) {
            console.warn('Marketplace listing failed (provenance saved):', err);
          }
        }

        onToast(`Recording saved! Tx: ${txHash.slice(0, 10)}...`, 'success');
        return { ipfsHash: ipfsResult.hash, txHash, recordingId, marketplaceTxHash };
      } finally {
        setIsDirectSaving(false);
      }
    },
    [contractAddress, ipfsService, duration, onToast, decodeRecordingId, maybeListOnMarketplace]
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

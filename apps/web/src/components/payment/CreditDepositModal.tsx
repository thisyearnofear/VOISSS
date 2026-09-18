"use client";

import React, { useState, useCallback, useEffect } from "react";
import { X, Wallet, AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { useBaseAccount } from "@/hooks/useBaseAccount";
import { formatUSDC, parseUSDC, USDC_ADDRESS } from "@voisss/shared";
import { DynamicChip } from "./RuntimePaymentChips";

interface CreditDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentRegistryAddress: string;
  onSuccess?: (amount: bigint) => void;
}

type DepositStep = 'input' | 'approving' | 'depositing' | 'success' | 'error';

const PRESET_AMOUNTS = [
  { label: '$10', value: '10' },
  { label: '$50', value: '50' },
  { label: '$100', value: '100' },
  { label: '$500', value: '500' },
];

/**
 * Credit Deposit Modal
 * 
 * Allows agents to deposit USDC credits for voice generation.
 * 
 * Flow:
 * 1. User enters amount
 * 2. Approve USDC transfer (if needed)
 * 3. Deposit to AgentRegistry
 * 4. Show success
 */
export function CreditDepositModal({
  isOpen,
  onClose,
  agentRegistryAddress,
  onSuccess,
}: CreditDepositModalProps) {
  const { universalAddress: address, signTypedData } = useBaseAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<DepositStep>('input');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [liveBalance, setLiveBalance] = useState<string | null>(null);
  const [liveBalanceWei, setLiveBalanceWei] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchLiveBalance = useCallback(async () => {
    if (!address || !isOpen) return;
    setBalanceLoading(true);
    try {
      const r = await fetch(`/api/agents/credits?agentAddress=${address}`, { cache: "no-store" });
      const j = (await r.json()) as { success?: boolean; data?: { balanceFormatted?: string; balanceWei?: string; balance?: { usdcBalance?: string } } };
      if (r.ok && j.success && j.data) {
        setLiveBalance(j.data.balanceFormatted ?? null);
        setLiveBalanceWei(j.data.balanceWei ?? j.data.balance?.usdcBalance ?? null);
      }
    } catch {}
    setBalanceLoading(false);
  }, [address, isOpen]);

  useEffect(() => {
    if (isOpen && address) void fetchLiveBalance();
    if (!isOpen) {
      setLiveBalance(null);
      setLiveBalanceWei(null);
    }
  }, [isOpen, address, fetchLiveBalance]);

  const handleClose = useCallback(() => {
    setAmount('');
    setStep('input');
    setError(null);
    setTxHash(null);
    onClose();
  }, [onClose]);

  const handleDeposit = async () => {
    if (!address || !amount) return;

    setStep('approving');
    setError(null);

    try {
      const amountBigInt = parseUSDC(amount);

      // Step 1: Approve USDC transfer
      const approveData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        domain: {
          name: 'USD Coin',
          version: '2',
          chainId: 8453,
          verifyingContract: USDC_ADDRESS.base,
        },
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: agentRegistryAddress,
          value: amountBigInt.toString(),
          nonce: 0, // Would need to fetch actual nonce
          deadline: Math.floor(Date.now() / 1000) + 3600,
        },
      };

      // For now, use standard approval (permit requires off-chain signing)
      // In production, you'd use the USDC permit function
      
      setStep('depositing');

      // Step 2: Deposit to AgentRegistry
      // This would call the depositUSDC function on the contract
      // For now, we'll simulate the API call
      const response = await fetch('/api/agents/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentAddress: address,
          amount: amountBigInt.toString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Deposit failed');
      }

      const data = await response.json();
      setTxHash(data.txHash);
      setStep('success');
      onSuccess?.(amountBigInt);
      // refresh the balance shown in the header so the next open is accurate
      void fetchLiveBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <h2 className="text-lg font-semibold text-white">Deposit USDC Credits</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === 'input' && (
            <>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#0A0A0A]/60 px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-gray-500">Current balance</span>
                    <button type="button" onClick={() => void fetchLiveBalance()} className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] p-1 text-gray-500 hover:text-white transition-colors" aria-label="Refresh balance" title="Refresh">
                      <RefreshCw className={`h-3 w-3 ${balanceLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-white mt-0.5" title={liveBalanceWei ?? undefined}>
                    {balanceLoading ? <span className="inline-block h-4 w-20 rounded bg-[#1A1A1A] animate-pulse align-middle" /> : liveBalance ?? "—"}
                    <span className="ml-1.5 text-xs font-normal text-gray-500">USDC</span>
                  </p>
                </div>
                <span className="shrink-0 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-2 py-1 font-mono text-[11px] text-gray-500" title={agentRegistryAddress}>
                  → {agentRegistryAddress.slice(0, 6)}…{agentRegistryAddress.slice(-4)}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Deposit USDC on <span className="text-white font-medium">Base</span> to your agent. Credits are used automatically when you generate voice — no approval pop-up per request.
              </p>

              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setAmount(preset.value)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors border ${
                      amount === preset.value
                        ? 'bg-[#7C5DFA] border-[#7C5DFA] text-white shadow'
                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-300 hover:border-[#3A3A3A] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom amount input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  className="w-full pl-8 pr-12 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7C5DFA]/40 focus:ring-1 focus:ring-[#7C5DFA]/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold tracking-widest uppercase">USDC</span>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                <Wallet className="w-5 h-5 text-[#9C88FF] mt-0.5 shrink-0" />
                <div className="text-sm min-w-0">
                  <p className="text-white font-medium">USDC on Base</p>
                  <p className="text-gray-500 leading-relaxed">
                    You&apos;ll approve USDC once, then it&apos;s credited to your agent for instant voice calls.
                  </p>
                </div>
              </div>

              {/* Deposit button */}
              <button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full py-3.5 bg-[#7C5DFA] hover:bg-[#6D4AE8] disabled:bg-[#2A2A2A] disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-lg shadow-[#7C5DFA]/20 disabled:shadow-none"
              >
                Deposit {amount ? `$${amount} USDC` : 'USDC'}
              </button>

              {/* Product-native alternative: agent pays itself — progressive disclosure, not a banner */}
              <div className="pt-4 border-t border-[#2A2A2A]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-px flex-1 bg-[#2A2A2A]" />
                  <span className="text-[11px] font-bold tracking-widest uppercase text-gray-500">Or let your agent pay itself</span>
                  <span className="h-px flex-1 bg-[#2A2A2A]" />
                </div>
                <p className="text-xs leading-relaxed text-gray-500 mb-3">
                  No top-up. The agent <span className="text-gray-300">signs x402 on Base</span> and 70% settles to the voice owner. Great for autonomous briefs.
                </p>
                <DynamicChip agentAddress={address ?? undefined} />
              </div>
            </>
          )}

          {step === 'approving' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Approving USDC</h3>
              <p className="text-gray-400 text-sm">
                Please approve the USDC transfer in your wallet...
              </p>
            </div>
          )}

          {step === 'depositing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Depositing Credits</h3>
              <p className="text-gray-400 text-sm">
                Confirm the deposit transaction in your wallet...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Deposit Successful!</h3>
              <p className="text-gray-400 text-sm mb-4">
                ${amount} USDC has been added to your agent credits.
              </p>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  View on Basescan →
                </a>
              )}
              <button
                onClick={handleClose}
                className="w-full mt-6 py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Deposit Failed</h3>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => setStep('input')}
                className="w-full py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

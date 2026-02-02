"use client";

import React, { useState, useCallback } from "react";
import { X, Wallet, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useBaseAccount } from "@/hooks/useBaseAccount";
import { formatUSDC, parseUSDC, USDC_ADDRESS } from "@voisss/shared";

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
        <div className="p-6">
          {step === 'input' && (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Deposit USDC to your agent account for voice generation services.
                Credits are deducted automatically when you generate voice.
              </p>

              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setAmount(preset.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      amount === preset.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#1A1A1A] text-gray-300 hover:bg-[#2A2A2A]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom amount input */}
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USDC</span>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
                <Wallet className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium">USDC on Base Required</p>
                  <p className="text-blue-400/70">
                    You need USDC on Base network. Current balance: {/* Fetch balance */}
                  </p>
                </div>
              </div>

              {/* Deposit button */}
              <button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
              >
                Deposit {amount ? `$${amount} USDC` : 'USDC'}
              </button>
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

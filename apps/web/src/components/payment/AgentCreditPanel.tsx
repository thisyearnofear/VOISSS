"use client";

import React, { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Plus, History } from "lucide-react";
import { useBaseAccount } from "@/hooks/useBaseAccount";
import { formatUSDC } from "@voisss/shared";
import { CreditDepositModal } from "./CreditDepositModal";

interface CreditBalance {
  usdcBalance: string;
  usdcLocked: string;
  totalSpent: string;
  lastTopUp: string | null;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'usage';
  amount: string;
  timestamp: string;
  description?: string;
}

interface AgentCreditPanelProps {
  agentRegistryAddress: string;
}

/**
 * Agent Credit Panel
 * 
 * Displays agent's USDC credit balance and transaction history.
 * Includes deposit button and usage statistics.
 */
export function AgentCreditPanel({ agentRegistryAddress }: AgentCreditPanelProps) {
  const { universalAddress: address } = useBaseAccount();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const fetchBalance = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/credits?agentAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBalance(data.data.balance);
          setTransactions(data.data.transactions || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  const handleDepositSuccess = (amount: bigint) => {
    fetchBalance(); // Refresh balance after deposit
  };

  if (!address) {
    return (
      <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl p-6">
        <p className="text-gray-400 text-center">Connect wallet to view credits</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1A1A1A] rounded w-1/3"></div>
          <div className="h-16 bg-[#1A1A1A] rounded"></div>
        </div>
      </div>
    );
  }

  const availableBalance = balance 
    ? BigInt(balance.usdcBalance) - BigInt(balance.usdcLocked)
    : 0n;

  return (
    <>
      <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Agent Credits</h3>
              <p className="text-sm text-gray-400">USDC Balance</p>
            </div>
          </div>
          <button
            onClick={fetchBalance}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2A2A]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-indigo-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-white border-b-2 border-indigo-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'overview' && (
            <>
              {/* Balance display */}
              <div className="text-center py-6">
                <p className="text-4xl font-bold text-white mb-1">
                  {formatUSDC(availableBalance)}
                </p>
                <p className="text-sm text-gray-400">Available Balance</p>
                {balance && BigInt(balance.usdcLocked) > 0n && (
                  <p className="text-sm text-yellow-400 mt-1">
                    {formatUSDC(BigInt(balance.usdcLocked))} locked in pending transactions
                  </p>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#1A1A1A] rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Total Deposited</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {formatUSDC(BigInt(balance?.usdcBalance || 0) + BigInt(balance?.totalSpent || 0))}
                  </p>
                </div>
                <div className="bg-[#1A1A1A] rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>Total Spent</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {formatUSDC(BigInt(balance?.totalSpent || 0))}
                  </p>
                </div>
              </div>

              {/* Last top up */}
              {balance?.lastTopUp && (
                <p className="text-sm text-gray-400 text-center mb-4">
                  Last deposit: {new Date(balance.lastTopUp).toLocaleDateString()}
                </p>
              )}

              {/* Deposit button */}
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Deposit USDC
              </button>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === 'deposit'
                          ? 'bg-green-500/20'
                          : tx.type === 'withdrawal'
                          ? 'bg-red-500/20'
                          : 'bg-blue-500/20'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : tx.type === 'withdrawal' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <Wallet className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">
                          {tx.type}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-gray-400">{tx.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        tx.type === 'deposit' ? 'text-green-400' : 'text-white'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}
                        {formatUSDC(BigInt(tx.amount))}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <CreditDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        agentRegistryAddress={agentRegistryAddress}
        onSuccess={handleDepositSuccess}
      />
    </>
  );
}

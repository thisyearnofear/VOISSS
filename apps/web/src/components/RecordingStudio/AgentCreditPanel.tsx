"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Minus, Zap, Info, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { AgentCreditInfo, ServiceTier } from '@voisss/shared';

interface AgentCreditPanelProps {
    agentAddress?: string;
    onCreditUpdate?: (newBalance: string) => void;
    className?: string;
}

export default function AgentCreditPanel({
    agentAddress,
    onCreditUpdate,
    className = ""
}: AgentCreditPanelProps) {
    const { address } = useAccount();
    const [creditInfo, setCreditInfo] = useState<AgentCreditInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [depositAmount, setDepositAmount] = useState<string>('0.1');
    const [withdrawAmount, setWithdrawAmount] = useState<string>('0.05');
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    const targetAddress = agentAddress || address;

    // Fetch agent credit info
    useEffect(() => {
        if (!targetAddress) return;

        const fetchCreditInfo = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/agents/vocalize?agentAddress=${targetAddress}`);
                const result = await response.json();

                if (result.success) {
                    setCreditInfo(result.data);
                } else {
                    setError(result.error || 'Failed to fetch credit info');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchCreditInfo();
    }, [targetAddress]);

    const handleDeposit = async () => {
        if (!targetAddress || !depositAmount) return;

        setLoading(true);
        try {
            // TODO: Integrate with AgentRegistry contract
            // For now, simulate the deposit
            await new Promise(resolve => setTimeout(resolve, 1000));

            const currentBalance = parseFloat(creditInfo?.creditBalance || '0');
            const newBalance = currentBalance + parseFloat(depositAmount);
            setCreditInfo(prev => prev ? { ...prev, creditBalance: newBalance.toString() } : null);
            onCreditUpdate?.(newBalance.toString());
            setShowDepositModal(false);
            setDepositAmount('0.1');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Deposit failed');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!targetAddress || !withdrawAmount) return;

        const currentBalance = parseFloat(creditInfo?.creditBalance || '0');
        const amount = parseFloat(withdrawAmount);
        if (amount > currentBalance) {
            setError('Insufficient balance');
            return;
        }

        setLoading(true);
        try {
            // TODO: Integrate with AgentRegistry contract
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newBalance = currentBalance - amount;
            setCreditInfo(prev => prev ? { ...prev, creditBalance: newBalance.toString() } : null);
            onCreditUpdate?.(newBalance.toString());
            setShowWithdrawModal(false);
            setWithdrawAmount('0.05');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    const getTierColor = (tier: ServiceTier) => {
        switch (tier) {
            case 'Managed': return 'text-blue-400 bg-blue-400/10';
            case 'Verified': return 'text-green-400 bg-green-400/10';
            case 'Sovereign': return 'text-purple-400 bg-purple-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const getTierDescription = (tier: ServiceTier) => {
        switch (tier) {
            case 'Managed': return 'Uses VOISSS voice infrastructure with pay-per-use pricing';
            case 'Verified': return 'Established agent with reputation history and lower fees';
            case 'Sovereign': return 'Advanced agent with custom voice provider integration';
            default: return 'Unknown tier';
        }
    };

    if (!targetAddress) {
        return (
            <div className={`bg-gray-900/50 rounded-lg p-4 border border-gray-700 ${className}`}>
                <div className="flex items-center gap-2 text-gray-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Connect wallet to view agent credits</span>
                </div>
            </div>
        );
    }

    if (loading && !creditInfo) {
        return (
            <div className={`bg-gray-900/50 rounded-lg p-4 border border-gray-700 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-1/3"></div>
                </div>
            </div>
        );
    }

    if (error && !creditInfo) {
        return (
            <div className={`bg-red-900/20 rounded-lg p-4 border border-red-700 ${className}`}>
                <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-gray-900/50 rounded-lg p-4 border border-gray-700 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Agent Credits</h3>
                </div>

                {creditInfo && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(creditInfo.tier)}`}>
                        {creditInfo.tier}
                    </div>
                )}
            </div>

            {creditInfo && (
                <>
                    {/* Balance Display */}
                    <div className="mb-4">
                        <div className="text-2xl font-bold text-white mb-1">
                            {parseFloat(creditInfo.creditBalance).toFixed(4)} ETH
                        </div>
                        <div className="text-sm text-gray-400">
                            ≈ {Math.floor(parseFloat(creditInfo.creditBalance) / parseFloat(creditInfo.costPerCharacter)).toLocaleString()} characters
                        </div>
                    </div>

                    {/* Agent Info */}
                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-300 mb-1">{creditInfo.name}</div>
                        <div className="text-xs text-gray-500 font-mono">
                            {creditInfo.agentAddress.slice(0, 6)}...{creditInfo.agentAddress.slice(-4)}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            <Info className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                                {getTierDescription(creditInfo.tier)}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setShowDepositModal(true)}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Deposit
                        </button>

                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={loading || parseFloat(creditInfo.creditBalance) <= 0}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                            Withdraw
                        </button>
                    </div>

                    {/* Cost Info */}
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>{(parseFloat(creditInfo.costPerCharacter) * 1000).toFixed(4)} ETH per 1K characters</span>
                    </div>
                </>
            )}

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
                        <h3 className="text-lg font-semibold text-white mb-4">Deposit Credits</h3>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-300 mb-2">Amount (ETH)</label>
                            <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="0.1"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                ≈ {Math.floor(parseFloat(depositAmount || '0') / parseFloat(creditInfo?.costPerCharacter || '0.0001')).toLocaleString()} characters
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDepositModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                {loading ? 'Processing...' : 'Deposit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
                        <h3 className="text-lg font-semibold text-white mb-4">Withdraw Credits</h3>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-300 mb-2">Amount (ETH)</label>
                            <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                max={parseFloat(creditInfo?.creditBalance || '0')}
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="0.05"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                Available: {parseFloat(creditInfo?.creditBalance || '0').toFixed(4)} ETH
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                {loading ? 'Processing...' : 'Withdraw'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
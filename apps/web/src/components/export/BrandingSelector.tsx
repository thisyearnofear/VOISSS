'use client';

import React, { useState } from 'react';
import { Crown, Zap, Star, Check } from 'lucide-react';
import { type TokenTier, type TranscriptTemplate } from '@voisss/shared';
import { useTokenAccess } from '@voisss/shared/hooks/useTokenAccess';
import { useBurnAction } from '../../hooks/useBurnAction';

interface BrandingSelectorProps {
    userAddress?: string | null;
    fid?: number;
    username?: string;
    pfpUrl?: string;
    displayName?: string;
    selectedTemplateId?: string;
    onTemplateSelect: (templateId: string) => void;
    onBurnRequired?: (templateId: string, cost: bigint) => void;
}

const TIER_ICONS: Record<TokenTier, React.ReactElement | null> = {
    none: null,
    basic: <Zap className="w-4 h-4" />,
    pro: <Star className="w-4 h-4" />,
    premium: <Crown className="w-4 h-4" />,
};

const TIER_COLORS: Record<TokenTier, string> = {
    none: 'bg-gray-100 text-gray-600',
    basic: 'bg-blue-100 text-blue-600',
    pro: 'bg-purple-100 text-purple-600',
    premium: 'bg-yellow-100 text-yellow-600',
};

export function BrandingSelector({
    userAddress,
    fid,
    username,
    pfpUrl,
    displayName,
    selectedTemplateId,
    onTemplateSelect,
    onBurnRequired,
}: BrandingSelectorProps) {
    const [showBurnConfirm, setShowBurnConfirm] = useState<string | null>(null);

    const {
        tier,
        isLoading,
        getAvailableTemplates,
    } = useTokenAccess({
        address: userAddress,
        fid,
        username,
        pfpUrl,
        displayName,
        autoRefresh: true,
    });

    const { initiateBurn, canAfford, isPending } = useBurnAction({
        userAddress,
    });

    const availableTemplates = getAvailableTemplates();

    const handleTemplateSelect = async (template: TranscriptTemplate) => {
        if (!template.branding) {
            onTemplateSelect(template.id);
            return;
        }

        if (template.branding.requiresBurn) {
            const cost = template.branding.burnCost;
            if (cost && canAfford('white_label_export')) {
                setShowBurnConfirm(template.id);
                onBurnRequired?.(template.id, cost);
            } else {
                alert('Insufficient $VOISSS balance for this template');
            }
        } else {
            onTemplateSelect(template.id);
        }
    };

    const handleBurnConfirm = async (templateId: string) => {
        try {
            const result = await initiateBurn('white_label_export', 'export-action', {
                templateId,
                exportType: 'branding',
            });

            if (result) {
                onTemplateSelect(templateId);
                setShowBurnConfirm(null);
            }
        } catch (error) {
            console.error('Burn failed:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Export Templates</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${TIER_COLORS[tier]
                    }`}>
                    {TIER_ICONS[tier]}
                    {tier} Tier
                </div>
            </div>

            {(username || displayName) && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                        {pfpUrl && (
                            <img
                                src={pfpUrl}
                                alt={displayName || username}
                                className="w-10 h-10 rounded-full"
                            />
                        )}
                        <div>
                            <p className="font-medium">{displayName || username}</p>
                            {username && displayName !== username && (
                                <p className="text-sm text-gray-600">@{username}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableTemplates.map((template: TranscriptTemplate) => {
                    const isSelected = selectedTemplateId === template.id;
                    const needsBurn = template.branding?.requiresBurn || false;
                    const burnCost = template.branding?.burnCost;
                    const requiredTier = template.branding?.requiredTier || 'none';

                    return (
                        <div
                            key={template.id}
                            className={`
                relative border-2 rounded-lg p-4 cursor-pointer transition-all
                ${isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }
              `}
                            onClick={() => handleTemplateSelect(template)}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-5 h-5 text-blue-500" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="font-medium">{template.name}</h4>

                                <div className="text-sm text-gray-600">
                                    {template.branding?.watermark.voisssBrandingSize === 'prominent' && 'VOISSS branded'}
                                    {template.branding?.watermark.voisssBrandingSize === 'standard' && 'Co-branded'}
                                    {template.branding?.watermark.voisssBrandingSize === 'minimal' && 'Minimal branding'}
                                    {!template.branding && 'Standard template'}
                                </div>

                                {needsBurn && burnCost && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        <span className="text-yellow-600">
                                            Requires {(Number(burnCost) / 1e18).toLocaleString()} $VOISSS
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`px-2 py-1 rounded ${TIER_COLORS[requiredTier]}`}>
                                        {requiredTier === 'none' ? 'Free' : `${requiredTier} Tier`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Burn Confirmation Modal */}
            {showBurnConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Confirm Token Burn</h3>

                        <p className="text-gray-600 mb-4">
                            This will burn tokens to unlock white-label branding for this export.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBurnConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={isPending}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleBurnConfirm(showBurnConfirm)}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                disabled={isPending}
                            >
                                {isPending ? 'Burning...' : 'Confirm Burn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
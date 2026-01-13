"use client";

import { useState, useEffect } from 'react';
import { crossPlatformStorage } from '@voisss/shared';
import { useTokenAccess, TokenTier } from '@voisss/shared/hooks/useTokenAccess';

/**
 * Studio Modes mapped to token tiers:
 * - standard: no token required (freemium)
 * - ghost: basic tier (10k+) - relay saves through spender
 * - pro: pro tier (50k+) - 24-hour gasless pass
 * - vip: premium tier (250k+) - permanent gasless + priority
 */
export type StudioMode = 'standard' | 'ghost' | 'pro' | 'vip';

interface StudioSettings {
    activeMode: StudioMode;
    isUnlocked: {
        ghost: boolean;
        pro: boolean;
        vip: boolean;
    };
}

const STORAGE_KEY = 'voisss_studio_settings';

const TIER_MODE_MAP: Record<TokenTier, StudioMode> = {
    'none': 'standard',
    'basic': 'ghost',
    'pro': 'pro',
    'premium': 'vip',
};

const MODE_TIER_MAP: Record<StudioMode, TokenTier> = {
    'standard': 'none',
    'ghost': 'basic',
    'pro': 'pro',
    'vip': 'premium',
};

export function useStudioSettings(userAddress: string | null) {
    const [settings, setSettings] = useState<StudioSettings>({
        activeMode: 'standard',
        isUnlocked: {
            ghost: false,
            pro: false,
            vip: false,
        },
    });

    // Use unified token access hook
    const { tier, isLoading } = useTokenAccess({
        address: userAddress,
        autoRefresh: true,
        refreshInterval: 60000,
    });

    // Load persisted mode from storage
    useEffect(() => {
        const loadSettings = async () => {
            const saved = await crossPlatformStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.activeMode) {
                        setSettings(prev => ({ ...prev, activeMode: parsed.activeMode }));
                    }
                } catch (e) {
                    console.error('[useStudioSettings] Failed to parse stored settings', e);
                }
            }
        };

        loadSettings();
    }, []);

    // Update unlocked modes when tier changes
    useEffect(() => {
        setSettings(prev => ({
            ...prev,
            isUnlocked: {
                ghost: tier === 'basic' || tier === 'pro' || tier === 'premium',
                pro: tier === 'pro' || tier === 'premium',
                vip: tier === 'premium',
            },
        }));
    }, [tier]);

    const setMode = async (mode: StudioMode) => {
        const requiredTier = MODE_TIER_MAP[mode];
        
        if (mode !== 'standard' && !settings.isUnlocked[mode]) {
            throw new Error(
                `Mode ${mode} requires ${requiredTier} tier (${TIER_MODE_MAP[requiredTier]} tier)`
            );
        }

        setSettings(prev => {
            const newSettings = { ...prev, activeMode: mode };
            crossPlatformStorage.setItem(STORAGE_KEY, JSON.stringify({ activeMode: mode }));
            return newSettings;
        });
    };

    return {
        ...settings,
        setMode,
        tier,
        isLoading,
    };
}

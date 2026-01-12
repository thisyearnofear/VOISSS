"use client";

import { useState, useEffect } from 'react';
import { crossPlatformStorage } from '@voisss/shared';

export type StudioMode = 'standard' | 'ghost' | 'pro' | 'vip';

interface StudioSettings {
    activeMode: StudioMode;
    isUnlocked: {
        ghost: boolean;
        pro: boolean;
        vip: boolean;
    };
    recordingsCount: number;
    tokenBalance: string;
}

const STORAGE_KEY = 'voisss_studio_settings';

export function useStudioSettings(userAddress: string | null) {
    const [settings, setSettings] = useState<StudioSettings>({
        activeMode: 'standard',
        isUnlocked: {
            ghost: true, // Ghost is open to all
            pro: false,
            vip: false,
        },
        recordingsCount: 0,
        tokenBalance: '0',
    });

    // Load and Sync from storage
    useEffect(() => {
        const handleStorageUpdate = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed.activeMode) {
                        setSettings(prev => ({ ...prev, activeMode: parsed.activeMode }));
                    }
                } catch (e) {
                    console.error('Failed to sync studio settings', e);
                }
            }
        };

        const loadSettings = async () => {
            const saved = await crossPlatformStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setSettings(prev => ({ ...prev, activeMode: parsed.activeMode || 'standard' }));
                } catch (e) {
                    console.error('Failed to parse studio settings', e);
                }
            }
        };

        loadSettings();
        window.addEventListener('storage', handleStorageUpdate);
        return () => window.removeEventListener('storage', handleStorageUpdate);
    }, []);

    // Update eligibility whenever userAddress changes
    useEffect(() => {
        if (!userAddress) return;

        const checkEligibility = async () => {
            try {
                // 1. Fetch token balance (mocked for now, pattern ready)
                const balanceRes = await fetch('/api/user/token-balance', {
                    method: 'POST',
                    body: JSON.stringify({ address: userAddress })
                });
                const balanceData = await balanceRes.json();

                // 2. We could fetch recordings count from contract or DB
                // For now, these are the logic triggers
                const hasBalance = BigInt(balanceData.balance || '0') >= BigInt('1000000000000000000000000'); // 1M

                setSettings(prev => ({
                    ...prev,
                    tokenBalance: balanceData.balance,
                    isUnlocked: {
                        ghost: true,
                        pro: true, // Let's say Pro is unlocked for now for testing, or set a threshold
                        vip: hasBalance
                    }
                }));
            } catch (e) {
                console.error('Eligibility check failed', e);
            }
        };

        checkEligibility();
    }, [userAddress]);

    const setMode = async (mode: StudioMode) => {
        if (!settings.isUnlocked[mode as keyof typeof settings.isUnlocked] && mode !== 'standard') {
            throw new Error(`Mode ${mode} is not unlocked yet.`);
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
    };
}

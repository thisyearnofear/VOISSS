import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from '@voisss/shared';
import { type UserTier, deriveUserTier } from '@voisss/shared/utils/tierBridge';
import type { TokenTier } from '@voisss/shared/config/tokenAccess';

// Re-export so callers that import UserTier from this module still work
export type { UserTier };

interface FreemiumState {
  // User tier — derived from wallet connection + on-chain token balance
  userTier: UserTier;

  // Weekly limits for free tier
  weeklySavesUsed: number;
  weeklyAIVoiceUsed: number;
  weeklyDubbingUsed: number;
  lastResetDate: string;

  // Weekly limits (constants)
  WEEKLY_SAVE_LIMIT: number;
  WEEKLY_AI_VOICE_LIMIT: number;
  WEEKLY_DUBBING_LIMIT: number;

  // Actions
  canSaveRecording: () => boolean;
  canUseAIVoice: () => boolean;
  canUseDubbing: () => boolean;
  incrementSaveUsage: () => void;
  incrementAIVoiceUsage: () => void;
  incrementDubbingUsage: () => void;
  resetWeeklyLimits: () => void;
  setUserTier: (tier: UserTier) => void;
  getRemainingQuota: () => { saves: number; aiVoice: number; dubbing: number };
}

export const useFreemiumStore = create<FreemiumState>()(
  persist(
    (set, get) => ({
      userTier: 'guest',
      weeklySavesUsed: 0,
      weeklyAIVoiceUsed: 0,
      weeklyDubbingUsed: 0,
      lastResetDate: getWeekStartDate(),

      WEEKLY_SAVE_LIMIT: 5,
      WEEKLY_AI_VOICE_LIMIT: 3,
      WEEKLY_DUBBING_LIMIT: 3,

      canSaveRecording: () => {
        const state = get();
        if (state.lastResetDate !== getWeekStartDate()) state.resetWeeklyLimits();
        if (state.userTier === 'premium') return true;
        if (state.userTier === 'guest') return false;
        return state.weeklySavesUsed < state.WEEKLY_SAVE_LIMIT;
      },

      canUseAIVoice: () => {
        const state = get();
        if (state.lastResetDate !== getWeekStartDate()) state.resetWeeklyLimits();
        if (state.userTier === 'premium') return true;
        return state.weeklyAIVoiceUsed < state.WEEKLY_AI_VOICE_LIMIT;
      },

      canUseDubbing: () => {
        const state = get();
        if (state.lastResetDate !== getWeekStartDate()) state.resetWeeklyLimits();
        if (state.userTier === 'premium') return true;
        return state.weeklyDubbingUsed < state.WEEKLY_DUBBING_LIMIT;
      },

      incrementSaveUsage: () => {
        const state = get();
        if (state.userTier !== 'premium') set({ weeklySavesUsed: state.weeklySavesUsed + 1 });
      },

      incrementAIVoiceUsage: () => {
        const state = get();
        if (state.userTier !== 'premium') set({ weeklyAIVoiceUsed: state.weeklyAIVoiceUsed + 1 });
      },

      incrementDubbingUsage: () => {
        const state = get();
        if (state.userTier !== 'premium') set({ weeklyDubbingUsed: state.weeklyDubbingUsed + 1 });
      },

      resetWeeklyLimits: () => {
        set({
          weeklySavesUsed: 0,
          weeklyAIVoiceUsed: 0,
          weeklyDubbingUsed: 0,
          lastResetDate: getWeekStartDate(),
        });
      },

      setUserTier: (tier: UserTier) => set({ userTier: tier }),

      getRemainingQuota: () => {
        const state = get();
        if (state.lastResetDate !== getWeekStartDate()) state.resetWeeklyLimits();
        if (state.userTier === 'premium') {
          return { saves: Infinity, aiVoice: Infinity, dubbing: Infinity };
        }
        return {
          saves: Math.max(0, state.WEEKLY_SAVE_LIMIT - state.weeklySavesUsed),
          aiVoice: Math.max(0, state.WEEKLY_AI_VOICE_LIMIT - state.weeklyAIVoiceUsed),
          dubbing: Math.max(0, state.WEEKLY_DUBBING_LIMIT - state.weeklyDubbingUsed),
        };
      },
    }),
    {
      name: 'voisss-freemium-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          try { return await crossPlatformStorage.getItem(name) || null; }
          catch { return null; }
        },
        setItem: async (name: string, value: string) => {
          try { await crossPlatformStorage.setItem(name, value); } catch { /* no-op */ }
        },
        removeItem: async (name: string) => {
          try { await crossPlatformStorage.removeItem(name); } catch { /* no-op */ }
        },
      })),
      skipHydration: true,
    }
  )
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStartDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// ─── Sync hook ────────────────────────────────────────────────────────────────
/**
 * Syncs the freemium store's userTier whenever wallet connection or
 * on-chain token tier changes.
 *
 * Use `deriveUserTier` from tierBridge — single source of truth for the mapping.
 *
 * @param isWalletConnected  - wagmi isConnected
 * @param tokenTier          - on-chain TokenTier from useTokenAccess (null while loading)
 */
export const useSyncUserTier = (
  isWalletConnected: boolean,
  tokenTier: TokenTier | null
) => {
  const setUserTier = useFreemiumStore(state => state.setUserTier);

  React.useEffect(() => {
    setUserTier(deriveUserTier(isWalletConnected, tokenTier));
  }, [isWalletConnected, tokenTier, setUserTier]);
};

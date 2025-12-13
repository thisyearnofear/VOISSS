import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from '@voisss/shared';

export type UserTier = 'guest' | 'free' | 'premium';

interface FreemiumState {
  // User tier
  userTier: UserTier;
  
  // Weekly limits for free tier
  weeklySavesUsed: number;
  weeklyAIVoiceUsed: number;
  weeklyDubbingUsed: number;
  lastResetDate: string;
  
  // Weekly limits
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
  getRemainingQuota: () => {
    saves: number;
    aiVoice: number;
    dubbing: number;
  };
}

export const useFreemiumStore = create<FreemiumState>()(
  persist(
    (set, get) => ({
      // Initial state
      userTier: 'guest',
      weeklySavesUsed: 0,
      weeklyAIVoiceUsed: 0,
      weeklyDubbingUsed: 0,
      lastResetDate: getWeekStartDate(),
      
      // Limits
      WEEKLY_SAVE_LIMIT: 5,
      WEEKLY_AI_VOICE_LIMIT: 3,
      WEEKLY_DUBBING_LIMIT: 3,
      
      canSaveRecording: () => {
        const state = get();
        
        // Check if we need to reset weekly limits
        if (state.lastResetDate !== getWeekStartDate()) {
          get().resetWeeklyLimits();
        }
        
        // Premium users have unlimited saves
        if (state.userTier === 'premium') {
          return true;
        }
        
        // Guest users can't save (only download)
        if (state.userTier === 'guest') {
          return false;
        }
        
        // Free users have weekly limit
        return state.weeklySavesUsed < state.WEEKLY_SAVE_LIMIT;
      },
      
      canUseAIVoice: () => {
        const state = get();
        
        // Check if we need to reset weekly limits
        if (state.lastResetDate !== getWeekStartDate()) {
          get().resetWeeklyLimits();
        }
        
        // Premium users have unlimited
        if (state.userTier === 'premium') {
          return true;
        }
        
        // All users get limited AI voice tries
        return state.weeklyAIVoiceUsed < state.WEEKLY_AI_VOICE_LIMIT;
      },
      
      canUseDubbing: () => {
        const state = get();
        
        // Check if we need to reset weekly limits
        if (state.lastResetDate !== getWeekStartDate()) {
          get().resetWeeklyLimits();
        }
        
        // Premium users have unlimited
        if (state.userTier === 'premium') {
          return true;
        }
        
        // All users get limited dubbing tries
        return state.weeklyDubbingUsed < state.WEEKLY_DUBBING_LIMIT;
      },
      
      incrementSaveUsage: () => {
        const state = get();
        if (state.userTier !== 'premium') {
          set({ weeklySavesUsed: state.weeklySavesUsed + 1 });
        }
      },
      
      incrementAIVoiceUsage: () => {
        const state = get();
        if (state.userTier !== 'premium') {
          set({ weeklyAIVoiceUsed: state.weeklyAIVoiceUsed + 1 });
        }
      },
      
      incrementDubbingUsage: () => {
        const state = get();
        if (state.userTier !== 'premium') {
          set({ weeklyDubbingUsed: state.weeklyDubbingUsed + 1 });
        }
      },
      
      resetWeeklyLimits: () => {
        set({
          weeklySavesUsed: 0,
          weeklyAIVoiceUsed: 0,
          weeklyDubbingUsed: 0,
          lastResetDate: getWeekStartDate(),
        });
      },
      
      setUserTier: (tier: UserTier) => {
        set({ userTier: tier });
      },
      
      getRemainingQuota: () => {
        const state = get();
        
        // Check if we need to reset
        if (state.lastResetDate !== getWeekStartDate()) {
          get().resetWeeklyLimits();
        }
        
        if (state.userTier === 'premium') {
          return {
            saves: Infinity,
            aiVoice: Infinity,
            dubbing: Infinity,
          };
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
          try {
            return await crossPlatformStorage.getItem(name) || null;
          } catch (error) {
            console.warn('Failed to get storage item:', error);
            return null;
          }
        },
        setItem: async (name: string, value: string) => {
          try {
            await crossPlatformStorage.setItem(name, value);
          } catch (error) {
            console.warn('Failed to set storage item:', error);
          }
        },
        removeItem: async (name: string) => {
          try {
            await crossPlatformStorage.removeItem(name);
          } catch (error) {
            console.warn('Failed to remove storage item:', error);
          }
        }
      })),
      skipHydration: true,
    }
  )
);

// Helper function to get the start of the current week (Monday)
function getWeekStartDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// Hook to sync user tier with wallet connection
export const useSyncUserTier = (isWalletConnected: boolean, isPremium: boolean) => {
  const setUserTier = useFreemiumStore(state => state.setUserTier);
  
  React.useEffect(() => {
    if (isPremium) {
      setUserTier('premium');
    } else if (isWalletConnected) {
      setUserTier('free');
    } else {
      setUserTier('guest');
    }
  }, [isWalletConnected, isPremium, setUserTier]);
};
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UIState {
  favoriteRecordingIds: string[];
  theme: 'light' | 'dark' | 'system';

  // Actions
  toggleFavorite: (recordingId: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      favoriteRecordingIds: [],
      theme: 'system',

      toggleFavorite: (recordingId) => {
        set((state) => {
          const isFavorite = state.favoriteRecordingIds.includes(recordingId);
          if (isFavorite) {
            // Remove from favorites
            return {
              favoriteRecordingIds: state.favoriteRecordingIds.filter(
                (id) => id !== recordingId
              ),
            };
          } else {
            // Add to favorites
            return {
              favoriteRecordingIds: [...state.favoriteRecordingIds, recordingId],
            };
          }
        });
      },

      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: "voisss-ui-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selector to check if a recording is a favorite
export const useIsFavorite = (recordingId: string) => {
  return useUIStore((state) => state.favoriteRecordingIds.includes(recordingId));
};

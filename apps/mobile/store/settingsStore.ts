import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  theme: "dark" | "light" | "system";
  autoImport: boolean;
  cloudSync: boolean;
  cloudProvider: "none" | "firebase" | "aws";
  autoTagging: boolean;
  transcription: boolean;
  selectedChain: "base" | "scroll" | "starknet";

  // Actions
  setTheme: (theme: "dark" | "light" | "system") => void;
  setAutoImport: (autoImport: boolean) => void;
  setCloudSync: (cloudSync: boolean) => void;
  setCloudProvider: (provider: "none" | "firebase" | "aws") => void;
  setAutoTagging: (autoTagging: boolean) => void;
  setTranscription: (transcription: boolean) => void;
  setSelectedChain: (chain: "base" | "scroll" | "starknet") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      autoImport: true,
      cloudSync: false,
      cloudProvider: "none",
      autoTagging: false,
      transcription: false,
      selectedChain: "base",

      setTheme: (theme) => set({ theme }),
      setAutoImport: (autoImport) => set({ autoImport }),
      setCloudSync: (cloudSync) => set({ cloudSync }),
      setCloudProvider: (cloudProvider) => set({ cloudProvider }),
      setAutoTagging: (autoTagging) => set({ autoTagging }),
      setTranscription: (transcription) => set({ transcription }),
      setSelectedChain: (selectedChain) => set({ selectedChain }),
    }),
    {
      name: "voisss-settings-storage",
      // @ts-ignore - Known type compatibility issue with Zustand and AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

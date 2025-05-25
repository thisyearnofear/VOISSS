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

  // Actions
  setTheme: (theme: "dark" | "light" | "system") => void;
  setAutoImport: (autoImport: boolean) => void;
  setCloudSync: (cloudSync: boolean) => void;
  setCloudProvider: (provider: "none" | "firebase" | "aws") => void;
  setAutoTagging: (autoTagging: boolean) => void;
  setTranscription: (transcription: boolean) => void;
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

      setTheme: (theme) => set({ theme }),
      setAutoImport: (autoImport) => set({ autoImport }),
      setCloudSync: (cloudSync) => set({ cloudSync }),
      setCloudProvider: (cloudProvider) => set({ cloudProvider }),
      setAutoTagging: (autoTagging) => set({ autoTagging }),
      setTranscription: (transcription) => set({ transcription }),
    }),
    {
      name: "voisss-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

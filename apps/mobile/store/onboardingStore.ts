import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: (completed: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingComplete: (completed) =>
        set({ hasCompletedOnboarding: completed }),
    }),
    {
      name: "voisss-onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

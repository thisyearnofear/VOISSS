import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  completionTime: Date | null;
  stepsCompleted: string[];
  stepsSkipped: string[];
  currentStep: string | null;
  setOnboardingComplete: (completed: boolean) => void;
  trackStepCompleted: (stepId: string) => void;
  trackStepSkipped: (stepId: string) => void;
  setCurrentStep: (stepId: string) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      completionTime: null,
      stepsCompleted: [],
      stepsSkipped: [],
      currentStep: null,
      setOnboardingComplete: (completed) =>
        set({ 
          hasCompletedOnboarding: completed,
          completionTime: completed ? new Date() : null,
        }),
      trackStepCompleted: (stepId) =>
        set((state) => ({
          stepsCompleted: [...state.stepsCompleted, stepId],
        })),
      trackStepSkipped: (stepId) =>
        set((state) => ({
          stepsSkipped: [...state.stepsSkipped, stepId],
        })),
      setCurrentStep: (stepId) =>
        set({ currentStep: stepId }),
    }),
    {
      name: "voisss-onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

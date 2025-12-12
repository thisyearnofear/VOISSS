// Mobile-specific onboarding utilities
import { onboardingService, type OnboardingOptions, type OnboardingStep } from '@voisss/shared/services/onboarding-service';

export { onboardingService, type OnboardingOptions, type OnboardingStep };

// Check if user has completed onboarding
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const steps = await onboardingService.startOnboarding();
    const progress = onboardingService.getProgress();
    return progress === 1;
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    return false;
  }
}

// Get onboarding status
export async function getOnboardingStatus(): Promise<{
  completed: boolean;
  currentStep?: OnboardingStep;
  progress: number;
}> {
  try {
    const steps = await onboardingService.startOnboarding();
    const currentStep = onboardingService.getCurrentStep();
    const progress = onboardingService.getProgress();
    
    return {
      completed: progress === 1,
      currentStep,
      progress,
    };
  } catch (error) {
    console.error('Failed to get onboarding status:', error);
    return { completed: false, progress: 0 };
  }
}

// Mobile-specific onboarding configuration
export const MOBILE_ONBOARDING_OPTIONS: OnboardingOptions = {
  preferredChain: 'starknet',
  preferredNetwork: 'TESTNET',
  enableSocialLogin: true,
  enableFiatOnRamp: true,
};

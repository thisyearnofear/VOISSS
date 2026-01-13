// Mock onboarding service for mobile app
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  optional: boolean;
  completed: boolean;
  order: number;
}

class OnboardingService {
  private steps: OnboardingStep[] = [];
  private currentStepIndex = 0;
  private progress = 0;

  async startOnboarding(): Promise<OnboardingStep[]> {
    this.steps = [
      {
        id: 'welcome',
        title: 'Welcome',
        description: 'Welcome to VOISSS',
        optional: false,
        completed: false,
        order: 1
      },
      {
        id: 'authentication',
        title: 'Authentication',
        description: 'Set up your account',
        optional: false,
        completed: false,
        order: 2
      },
      {
        id: 'wallet',
        title: 'Wallet Setup',
        description: 'Connect your wallet',
        optional: false,
        completed: false,
        order: 3
      },
      {
        id: 'chain-selection',
        title: 'Chain Selection',
        description: 'Choose your blockchain',
        optional: true,
        completed: false,
        order: 4
      },
      {
        id: 'funding',
        title: 'Funding',
        description: 'Add funds to your wallet',
        optional: true,
        completed: false,
        order: 5
      },
      {
        id: 'tutorial',
        title: 'Tutorial',
        description: 'Learn how to use VOISSS',
        optional: true,
        completed: false,
        order: 6
      },
      {
        id: 'complete',
        title: 'Complete',
        description: 'Onboarding complete!',
        optional: false,
        completed: false,
        order: 7
      }
    ];
    
    this.currentStepIndex = 0;
    this.progress = 0;
    
    return this.steps;
  }

  async completeStep(stepId: string): Promise<void> {
    const stepIndex = this.steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      this.steps[stepIndex].completed = true;
      if (stepIndex >= this.currentStepIndex) {
        this.currentStepIndex = stepIndex + 1;
        this.progress = this.currentStepIndex / (this.steps.length - 1); // Exclude 'complete' step from progress calculation
      }
    }
  }

  async skipStep(stepId: string): Promise<void> {
    await this.completeStep(stepId);
  }

  getCurrentStep(): OnboardingStep {
    return this.steps[Math.min(this.currentStepIndex, this.steps.length - 1)];
  }

  getAllSteps(): OnboardingStep[] {
    return this.steps;
  }

  getProgress(): number {
    return this.progress;
  }

  async completeOnboarding(): Promise<void> {
    // Mark all steps as completed
    this.steps.forEach(step => {
      step.completed = true;
    });
    this.progress = 1;
  }

  async switchChain(chain: any, network: string): Promise<void> {
    // Mock implementation
    console.log(`Switching to chain: ${chain}, network: ${network}`);
  }

  async setupWalletWithSocialLogin(provider: string): Promise<void> {
    // Mock implementation
    console.log(`Setting up wallet with ${provider}`);
  }

  async connectExistingWallet(address: string): Promise<void> {
    // Mock implementation
    console.log(`Connecting wallet: ${address}`);
  }

  async initiateFiatOnRamp(amount: number, currency: string): Promise<string> {
    // Mock implementation
    console.log(`Initiating fiat on-ramp for ${amount} ${currency}`);
    return `tx_${Date.now()}`;
  }

  getOnboardingTips(): string[] {
    return [
      "Always backup your wallet seed phrase",
      "Keep your private keys secure",
      "Review transactions before confirming",
      "Enable two-factor authentication if available"
    ];
  }

  getQuickStartGuide(): string[] {
    return [
      "Tap the record button to start recording",
      "Add tags to make your recordings discoverable",
      "Share your recordings with friends",
      "Earn tokens by creating popular content",
      "Tip creators whose content you enjoy"
    ];
  }
}

export const onboardingService = new OnboardingService();
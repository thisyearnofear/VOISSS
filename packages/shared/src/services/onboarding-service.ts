/**
 * Onboarding Service - Simplified user onboarding for consumer crypto
 * 
 * This service provides a streamlined onboarding experience that:
 * - Supports multiple authentication methods
 * - Guides users through wallet setup
 * - Provides educational content
 * - Handles fiat on-ramp integration
 */

import { blockchainService, type SupportedChains } from '../blockchain';
import { createSession, saveUserSession, type UserSession } from '../utils/session';

export interface OnboardingOptions {
  preferredChain?: SupportedChains;
  preferredNetwork?: string;
  enableSocialLogin?: boolean;
  enableFiatOnRamp?: boolean;
  defaultToken?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

export class OnboardingService {
  private options: OnboardingOptions;
  private currentStep: number;
  private steps: OnboardingStep[];

  constructor(options: OnboardingOptions = {}) {
    this.options = {
      preferredChain: 'starknet',
      preferredNetwork: 'TESTNET',
      enableSocialLogin: true,
      enableFiatOnRamp: true,
      ...options,
    };
    
    this.currentStep = 0;
    this.steps = this.initializeSteps();
  }

  private initializeSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to VOISSS',
        description: 'Create and share voice recordings on the blockchain',
        completed: false,
      },
      {
        id: 'authentication',
        title: 'Set up your account',
        description: 'Choose how you want to sign in',
        completed: false,
      },
      {
        id: 'wallet',
        title: 'Connect your wallet',
        description: 'Connect or create a crypto wallet',
        completed: false,
      },
      {
        id: 'chain-selection',
        title: 'Choose your blockchain',
        description: 'Select which blockchain to use',
        completed: false,
        optional: true,
      },
      {
        id: 'funding',
        title: 'Get some crypto',
        description: 'Add funds to your wallet',
        completed: false,
        optional: !this.options.enableFiatOnRamp,
      },
      {
        id: 'tutorial',
        title: 'Quick tutorial',
        description: 'Learn how to use VOISSS',
        completed: false,
        optional: true,
      },
      {
        id: 'complete',
        title: 'You\'re all set!',
        description: 'Start creating and tipping',
        completed: false,
      },
    ];
  }

  async startOnboarding(): Promise<OnboardingStep[]> {
    this.currentStep = 0;
    this.steps = this.initializeSteps();
    return this.steps;
  }

  async completeStep(stepId: string): Promise<void> {
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    if (stepIndex >= 0) {
      this.steps[stepIndex].completed = true;
      
      // Move to next incomplete step
      const nextStepIndex = this.steps.findIndex((s, i) => 
        i > stepIndex && !s.completed && !s.optional
      );
      
      if (nextStepIndex >= 0) {
        this.currentStep = nextStepIndex;
      }
    }
  }

  async skipStep(stepId: string): Promise<void> {
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    if (stepIndex >= 0 && this.steps[stepIndex].optional) {
      this.steps[stepIndex].completed = true;
      
      // Move to next incomplete step
      const nextStepIndex = this.steps.findIndex((s, i) => 
        i > stepIndex && !s.completed && !s.optional
      );
      
      if (nextStepIndex >= 0) {
        this.currentStep = nextStepIndex;
      }
    }
  }

  getCurrentStep(): OnboardingStep {
    return this.steps[this.currentStep];
  }

  getAllSteps(): OnboardingStep[] {
    return this.steps;
  }

  getProgress(): number {
    const completedSteps = this.steps.filter(s => s.completed).length;
    const totalRequiredSteps = this.steps.filter(s => !s.optional).length;
    return Math.min(1, completedSteps / totalRequiredSteps);
  }

  async setupWalletWithSocialLogin(socialProvider: string): Promise<UserSession> {
    // In a real implementation, this would connect to social auth providers
    console.log(`Setting up wallet with ${socialProvider} login`);
    
    // For demo purposes, we'll create a session with a mock wallet
    const session = await createSession(
      undefined, // No wallet address yet
      this.options.preferredNetwork,
      this.options.preferredChain
    );
    
    // Complete authentication and wallet steps
    await this.completeStep('authentication');
    await this.completeStep('wallet');
    
    return session;
  }

  async connectExistingWallet(walletAddress: string): Promise<UserSession> {
    console.log(`Connecting existing wallet: ${walletAddress}`);
    
    // Validate wallet address format
    if (!walletAddress || !walletAddress.startsWith('0x')) {
      throw new Error('Invalid wallet address');
    }
    
    // Create session with the connected wallet
    const session = await createSession(
      walletAddress,
      this.options.preferredNetwork,
      this.options.preferredChain
    );
    
    // Complete authentication and wallet steps
    await this.completeStep('authentication');
    await this.completeStep('wallet');
    
    return session;
  }

  async switchChain(chain: SupportedChains, network: string): Promise<void> {
    await blockchainService.switchChain(chain, network);
    this.options.preferredChain = chain;
    this.options.preferredNetwork = network;
    
    // Update session with new chain
    const session = await createSession(
      await blockchainService.connectWallet(),
      network,
      chain
    );
    await saveUserSession(session);
    
    await this.completeStep('chain-selection');
  }

  async initiateFiatOnRamp(amount: number, currency: string): Promise<string> {
    // In a real implementation, this would connect to a fiat on-ramp provider
    console.log(`Initiating fiat on-ramp: ${amount} ${currency}`);
    
    // For demo purposes, return a mock transaction ID
    const transactionId = 'onramp_' + Math.random().toString(36).substring(2, 10);
    
    await this.completeStep('funding');
    
    return transactionId;
  }

  async completeOnboarding(): Promise<void> {
    // Mark all remaining steps as completed
    for (const step of this.steps) {
      if (!step.completed) {
        step.completed = true;
      }
    }
    
    this.currentStep = this.steps.length - 1;
    console.log('Onboarding completed successfully!');
  }

  // Educational content for users
  getOnboardingTips(): string[] {
    return [
      '💡 Tip: You can switch between Starknet and Scroll chains anytime',
      '🎁 Tip: Small tips (0.001 ETH) are a great way to support creators',
      '🔒 Tip: Your voice recordings are stored securely on IPFS',
      '🌐 Tip: VOISSS works on both mobile and web',
      '💰 Tip: Scroll has lower transaction fees than Ethereum mainnet',
    ];
  }

  getQuickStartGuide(): string[] {
    return [
      '1. Connect your wallet or create a new one',
      '2. Choose your preferred blockchain (Starknet or Scroll)',
      '3. Add some crypto to your wallet if needed',
      '4. Start recording your voice messages',
      '5. Share them with the world or tip other creators',
    ];
  }
}

export const onboardingService = new OnboardingService();

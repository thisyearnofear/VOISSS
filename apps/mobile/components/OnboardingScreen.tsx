import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onboardingService, type OnboardingStep } from '../utils/onboarding';
import { blockchain } from '../utils/starknet';
import { Button } from './ui/Button';
import { ChainSelector } from './ChainSelector';
import { AIVoiceGuide } from './AIVoiceGuide';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>();
  const [allSteps, setAllSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [showChainSelector, setShowChainSelector] = useState(false);

  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        const steps = await onboardingService.startOnboarding();
        setAllSteps(steps);
        setCurrentStep(steps[0]);
        setProgress(onboardingService.getProgress());
      } catch (error) {
        console.error('Failed to initialize onboarding:', error);
      }
    };
    
    initializeOnboarding();
  }, []);

  const handleNext = async () => {
    if (!currentStep) return;
    
    try {
      await onboardingService.completeStep(currentStep.id);
      const newSteps = onboardingService.getAllSteps();
      setAllSteps(newSteps);
      
      const nextStep = onboardingService.getCurrentStep();
      setCurrentStep(nextStep);
      setProgress(onboardingService.getProgress());
      
      // Check if onboarding is complete
      if (nextStep.id === 'complete') {
        await onboardingService.completeOnboarding();
        onComplete();
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const handleSkip = async () => {
    if (!currentStep) return;
    
    try {
      if (currentStep.optional) {
        await onboardingService.skipStep(currentStep.id);
        const newSteps = onboardingService.getAllSteps();
        setAllSteps(newSteps);
        
        const nextStep = onboardingService.getCurrentStep();
        setCurrentStep(nextStep);
        setProgress(onboardingService.getProgress());
      } else {
        // Skip all remaining steps
        await onboardingService.completeOnboarding();
        onSkip();
      }
    } catch (error) {
      console.error('Failed to skip step:', error);
    }
  };

  const handleChainSelected = async (chain: any, network: string) => {
    try {
      await onboardingService.switchChain(chain, network);
      setShowChainSelector(false);
      await handleNext();
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  const renderStepContent = () => {
    if (!currentStep) return null;
    
    switch (currentStep.id) {
      case 'welcome':
        return (
          <WelcomeStep onNext={handleNext} />
        );
      
      case 'authentication':
        return (
          <AuthenticationStep onNext={handleNext} />
        );
        
      case 'wallet':
        return (
          <WalletStep onNext={handleNext} />
        );
        
      case 'chain-selection':
        return (
          <ChainSelectionStep 
            onNext={() => setShowChainSelector(true)}
            onSkip={handleSkip}
          />
        );
        
      case 'funding':
        return (
          <FundingStep onNext={handleNext} onSkip={handleSkip} />
        );
        
      case 'tutorial':
        return (
          <TutorialStep onNext={handleNext} onSkip={handleSkip} />
        );
        
      case 'complete':
        return (
          <CompleteStep onNext={onComplete} />
        );
        
      default:
        return (
          <DefaultStep step={currentStep} onNext={handleNext} onSkip={handleSkip} />
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        
        {/* Step indicator */}
        <Text style={styles.stepIndicator}>
          Step {allSteps.findIndex(s => s.id === currentStep?.id) + 1} of {allSteps.filter(s => !s.optional).length}
        </Text>
        
        {/* Step content */}
        {renderStepContent()}
        
        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentStep?.optional && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep?.id === 'complete' ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={styles.nextIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Chain selector modal */}
      {showChainSelector && (
        <View style={styles.chainSelectorOverlay}>
          <ChainSelector 
            onChainSelected={handleChainSelected}
            showNetworks={true}
          />
          <TouchableOpacity 
            style={styles.closeChainSelector}
            onPress={() => setShowChainSelector(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Step Components

const WelcomeStep = ({ onNext }: { onNext: () => void }) => {
  const [showAIGuide, setShowAIGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(1);

  return (
    <View style={styles.stepContainer}>
      <Ionicons name="mic" size={60} color="#FF6B6B" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Welcome to VOISSS</Text>
      <Text style={styles.stepDescription}>
        Create, share, and monetize voice recordings on the blockchain.
        Tip creators and get tipped for your own content!
      </Text>
      
      <View style={styles.featuresContainer}>
        <FeatureItem icon="heart" text="Tip creators easily" />
        <FeatureItem icon="layers" text="Multi-chain support" />
        <FeatureItem icon="lock-closed" text="Secure & decentralized" />
      </View>
      
      {/* AI Voice Guide Option */}
      {!showAIGuide && (
        <View style={styles.aiGuideOption}>
          <Text style={styles.aiGuideTitle}>🤖 Want a Guided Tour?</Text>
          <Text style={styles.aiGuideSubtitle}>
            Let our AI voice guide walk you through the setup process
          </Text>
          
          <Button
            title="Start AI Guide"
            onPress={() => setShowAIGuide(true)}
            variant="secondary"
            size="md"
            icon="robot"
          />
          
          <TouchableOpacity 
            style={styles.skipGuideButton}
            onPress={onNext}
          >
            <Text style={styles.skipGuideText}>No thanks, continue normally</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* AI Voice Guide */}
      {showAIGuide && (
        <AIVoiceGuide
          step={guideStep}
          onGuideComplete={() => {
            if (guideStep < 6) {
              setGuideStep(guideStep + 1);
            } else {
              setShowAIGuide(false);
              onNext();
            }
          }}
          onSkip={() => {
            setShowAIGuide(false);
            onNext();
          }}
        />
      )}
    </View>
  );
};

const AuthenticationStep = ({ onNext }: { onNext: () => void }) => {
  const [selectedMethod, setSelectedMethod] = useState<'social' | 'wallet' | null>(null);

  const handleSelectMethod = async (method: 'social' | 'wallet') => {
    setSelectedMethod(method);
    
    try {
      if (method === 'social') {
        // In a real app, this would connect to social providers
        await onboardingService.setupWalletWithSocialLogin('google');
      }
      
      // Move to next step after a brief delay
      setTimeout(onNext, 1000);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Ionicons name="person-add" size={60} color="#FF6B6B" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Set up your account</Text>
      <Text style={styles.stepDescription}>
        Choose how you want to get started with VOISSS
      </Text>
      
      <View style={styles.authOptions}>
        <TouchableOpacity 
          style={styles.authOption}
          onPress={() => handleSelectMethod('social')}
          disabled={selectedMethod === 'social'}
        >
          <Ionicons name="logo-google" size={30} color="#DB4437" />
          <Text style={styles.authOptionText}>Continue with Google</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.authOption}
          onPress={() => handleSelectMethod('wallet')}
          disabled={selectedMethod === 'wallet'}
        >
          <Ionicons name="wallet" size={30} color="#FF6B6B" />
          <Text style={styles.authOptionText}>Connect Wallet</Text>
        </TouchableOpacity>
      </View>
      
      {selectedMethod && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>
            {selectedMethod === 'social' 
              ? 'Setting up your account...'
              : 'Connecting wallet...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const WalletStep = ({ onNext }: { onNext: () => void }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      const address = await blockchain.connectWallet();
      setWalletAddress(address);
      
      await onboardingService.connectExistingWallet(address);
      
      setTimeout(() => {
        setIsConnecting(false);
        onNext();
      }, 1500);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Ionicons name="wallet" size={60} color="#FF6B6B" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Connect Your Wallet</Text>
      <Text style={styles.stepDescription}>
        Connect an existing crypto wallet or create a new one to get started
      </Text>
      
      <TouchableOpacity 
        style={styles.connectWalletButton}
        onPress={handleConnectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="logo-bitcoin" size={20} color="white" style={styles.walletIcon} />
            <Text style={styles.connectWalletText}>
              {walletAddress ? 'Wallet Connected!' : 'Connect Wallet'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      {walletAddress ? (
        <View style={styles.walletInfo}>
          <Text style={styles.walletAddress}>
            {`${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`}
          </Text>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
        </View>
      ) : (
        <Text style={styles.walletHint}>
          No wallet detected. Connect your MetaMask, Argent, or other wallet.
        </Text>
      )}
    </View>
  );
};

const ChainSelectionStep = ({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) => {
  return (
    <View style={styles.stepContainer}>
      <Ionicons name="swap-horizontal" size={60} color="#FF6B6B" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Choose Your Blockchain</Text>
      <Text style={styles.stepDescription}>
        Select which blockchain you want to use for your transactions
      </Text>
      
      <View style={styles.chainInfo}>
        <View style={styles.chainOption}>
          <Ionicons name="diamond" size={30} color="#6B46C1" />
          <Text style={styles.chainOptionText}>Starknet</Text>
          <Text style={styles.chainOptionSubtext}>Fast & scalable</Text>
        </View>
        
        <View style={styles.chainOption}>
          <Ionicons name="layers" size={30} color="#2E86AB" />
          <Text style={styles.chainOptionText}>Scroll</Text>
          <Text style={styles.chainOptionSubtext}>EVM compatible</Text>
        </View>
      </View>
      
      <Text style={styles.chainHint}>
        💡 You can switch chains anytime from the settings
      </Text>
    </View>
  );
};

const FundingStep = ({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) => {
  const [amount, setAmount] = useState('20');
  const [currency, setCurrency] = useState('USD');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddFunds = async () => {
    try {
      setIsProcessing(true);
      const transactionId = await onboardingService.initiateFiatOnRamp(
        parseFloat(amount),
        currency
      );
      
      console.log(`Fiat on-ramp initiated: ${transactionId}`);
      
      setTimeout(() => {
        setIsProcessing(false);
        onNext();
      }, 2000);
    } catch (error) {
      console.error('Failed to add funds:', error);
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Ionicons name="cash" size={60} color="#FF6B6B" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Get Some Crypto</Text>
      <Text style={styles.stepDescription}>
        Add funds to your wallet to start tipping and creating
      </Text>
      
      <View style={styles.fundingOptions}>
        <View style={styles.amountSelector}>
          <TouchableOpacity 
            style={[styles.amountButton, amount === '10' && styles.amountButtonSelected]}
            onPress={() => setAmount('10')}
          >
            <Text style={styles.amountButtonText}>$10</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.amountButton, amount === '20' && styles.amountButtonSelected]}
            onPress={() => setAmount('20')}
          >
            <Text style={styles.amountButtonText}>$20</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.amountButton, amount === '50' && styles.amountButtonSelected]}
            onPress={() => setAmount('50')}
          >
            <Text style={styles.amountButtonText}>$50</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.amountButton, amount === '100' && styles.amountButtonSelected]}
            onPress={() => setAmount('100')}
          >
            <Text style={styles.amountButtonText}>$100</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.addFundsButton}
          onPress={handleAddFunds}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.addFundsButtonText}>
              Add ${amount} {currency}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.fundingHint}>
        💡 You can add funds later from your wallet settings
      </Text>
    </View>
  );
};

const TutorialStep = ({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) => {
  const tips = onboardingService.getOnboardingTips();
  const guide = onboardingService.getQuickStartGuide();

  return (
    <View style={styles.stepContainer}>
      <Ionicons name="school" size={60} color="#FF6B6B" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Quick Tutorial</Text>
      <Text style={styles.stepDescription}>
        Here are some tips to get you started
      </Text>
      
      <Text style={styles.sectionTitle}>🚀 Quick Start Guide:</Text>
      {guide.map((item: string, index: number) => (
        <Text key={index} style={styles.guideItem}>• {item}</Text>
      ))}

      <Text style={styles.sectionTitle}>💡 Pro Tips:</Text>
      {tips.map((tip: string, index: number) => (
        <Text key={index} style={styles.tipItem}>{tip}</Text>
      ))}
    </View>
  );
};

const CompleteStep = ({ onNext }: { onNext: () => void }) => {
  return (
    <View style={styles.stepContainer}>
      <Ionicons name="checkmark-circle" size={60} color="#4CAF50" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>You're All Set!</Text>
      <Text style={styles.stepDescription}>
        Your account is ready. Start creating voice recordings and tipping creators!
      </Text>
      
      <View style={styles.completeFeatures}>
        <View style={styles.completeFeature}>
          <Ionicons name="mic" size={24} color="#FF6B6B" />
          <Text style={styles.completeFeatureText}>Record Voice</Text>
        </View>
        
        <View style={styles.completeFeature}>
          <Ionicons name="heart" size={24} color="#FF6B6B" />
          <Text style={styles.completeFeatureText}>Tip Creators</Text>
        </View>
        
        <View style={styles.completeFeature}>
          <Ionicons name="share-social" size={24} color="#FF6B6B" />
          <Text style={styles.completeFeatureText}>Share Content</Text>
        </View>
      </View>
    </View>
  );
};

const DefaultStep = ({ step, onNext, onSkip }: {
  step: OnboardingStep;
  onNext: () => void;
  onSkip: () => void;
}) => {
  return (
    <View style={styles.stepContainer}>
      <Ionicons name="information-circle" size={60} color="#FF6B6B" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepDescription}>{step.description}</Text>
    </View>
  );
};

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={24} color="#FF6B6B" />
      <Text style={styles.featureItemText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  stepIndicator: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepIcon: {
    marginBottom: 20,
  },
  stepTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  skipButton: {
    padding: 15,
    borderRadius: 10,
  },
  skipButtonText: {
    color: '#aaa',
    fontSize: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  nextIcon: {
    marginLeft: 8,
  },
  // Authentication step styles
  authOptions: {
    width: '100%',
    gap: 15,
  },
  authOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  authOptionText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  // Wallet step styles
  connectWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  walletIcon: {
    marginRight: 8,
  },
  connectWalletText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  walletAddress: {
    color: 'white',
    fontSize: 14,
    marginRight: 10,
  },
  walletHint: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  // Chain selection styles
  chainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  chainOption: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    width: '45%',
  },
  chainOptionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  chainOptionSubtext: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  chainHint: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  // Funding step styles
  fundingOptions: {
    width: '100%',
    alignItems: 'center',
  },
  amountSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  amountButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    width: 80,
    alignItems: 'center',
  },
  amountButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF8E8E',
    borderWidth: 1,
  },
  amountButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  addFundsButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  addFundsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fundingHint: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  // Tutorial step styles
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  guideItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  tipItem: {
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  // Complete step styles
  completeFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
  },
  completeFeature: {
    alignItems: 'center',
    padding: 15,
  },
  completeFeatureText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  // Features section
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
  },
  featureItem: {
    alignItems: 'center',
    width: '30%',
  },
  featureItemText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  // AI Guide styles
  aiGuideOption: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  aiGuideTitle: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  aiGuideSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  skipGuideButton: {
    marginTop: 12,
  },
  skipGuideText: {
    color: '#aaa',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  // Chain selector overlay
  chainSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeChainSelector: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1001,
  },
});

import { useSubscriptionStore } from "../store/subscriptionStore";
// TODO: Replace with Base wallet hook
import { useBase } from "../hooks/useBase";

// Feature categories for our dual-path approach
export type FeatureCategory = "ai" | "web3" | "ultimate" | "premium";

// Specific features that can be gated
export type Feature = 
  // AI Features (Premium Subscription or Web3 with daily limit)
  | "voice_dubbing"
  | "ai_transcription" 
  | "ai_snippets"
  | "ai_voices"
  | "unlimited_recording_length"
  | "advanced_audio_processing"
  
  // Web3 Features (Wallet Connection Required)
  | "nft_minting"
  | "on_chain_storage"
  | "starknet_rewards"
  | "decentralized_sharing"
  | "governance_voting"
  | "creator_monetization"
  
  // Ultimate Features (Both Subscription + Wallet)
  | "cross_platform_sync"
  | "premium_web3_features"
  | "advanced_analytics"
  | "priority_support"
  | "exclusive_ai_models"
  | "enhanced_nft_utilities";

// Feature access result
export interface FeatureAccessResult {
  canAccess: boolean;
  reason?: string;
  upgradeAction?: "subscribe" | "connect_wallet" | "upgrade_to_ultimate";
  remainingUses?: number;
}

// Main feature gating function
export function useFeatureGating() {
  const subscription = useSubscriptionStore();
  const wallet = useBase();

  // Determine current user tier
  const getCurrentTier = (): "free" | "premium" | "web3" | "ultimate" => {
    const hasSubscription = subscription.hasActiveSubscription;
    const hasWallet = wallet.isConnected;

    if (hasSubscription && hasWallet) return "ultimate";
    if (hasSubscription) return "premium";
    if (hasWallet) return "web3";
    return "free";
  };

  // Check if user can access a specific feature
  const canAccessFeature = (feature: Feature): FeatureAccessResult => {
    const tier = getCurrentTier();
    
    switch (feature) {
      // AI Features - Premium subscription OR Web3 with daily limit
      case "voice_dubbing":
      case "ai_transcription":
      case "ai_snippets":
      case "ai_voices":
        return checkAIFeatureAccess(tier);
      
      case "unlimited_recording_length":
      case "advanced_audio_processing":
        // These require premium subscription
        if (tier === "premium" || tier === "ultimate") {
          return { canAccess: true };
        }
        return {
          canAccess: false,
          reason: "Premium subscription required",
          upgradeAction: "subscribe"
        };

      // Web3 Features - Wallet connection required
      case "nft_minting":
      case "on_chain_storage":
      case "starknet_rewards":
      case "decentralized_sharing":
      case "governance_voting":
      case "creator_monetization":
        if (tier === "web3" || tier === "ultimate") {
          return { canAccess: true };
        }
        return {
          canAccess: false,
          reason: "Starknet wallet connection required",
          upgradeAction: "connect_wallet"
        };

      // Ultimate Features - Both subscription AND wallet
      case "cross_platform_sync":
      case "premium_web3_features":
      case "advanced_analytics":
      case "priority_support":
      case "exclusive_ai_models":
      case "enhanced_nft_utilities":
        if (tier === "ultimate") {
          return { canAccess: true };
        }
        
        if (tier === "premium") {
          return {
            canAccess: false,
            reason: "Connect your Starknet wallet to unlock Ultimate features",
            upgradeAction: "connect_wallet"
          };
        }
        
        if (tier === "web3") {
          return {
            canAccess: false,
            reason: "Premium subscription required for Ultimate features",
            upgradeAction: "subscribe"
          };
        }
        
        return {
          canAccess: false,
          reason: "Ultimate tier required (Premium subscription + Starknet wallet)",
          upgradeAction: "upgrade_to_ultimate"
        };

      default:
        return { canAccess: false, reason: "Unknown feature" };
    }
  };

  // Helper function for AI feature access logic
  const checkAIFeatureAccess = (tier: "free" | "premium" | "web3" | "ultimate"): FeatureAccessResult => {
    // Premium and Ultimate tiers have unlimited access
    if (tier === "premium" || tier === "ultimate") {
      return { canAccess: true };
    }

    // Web3 tier gets 5 daily uses
    if (tier === "web3") {
      const remainingUses = Math.max(0, 5 - subscription.dailyAIUsage);
      
      if (remainingUses > 0) {
        return { 
          canAccess: true, 
          remainingUses 
        };
      }
      
      return {
        canAccess: false,
        reason: "Daily AI usage limit reached (5/5). Upgrade to Premium for unlimited access.",
        upgradeAction: "subscribe",
        remainingUses: 0
      };
    }

    // Free tier - no access
    return {
      canAccess: false,
      reason: "AI features require Premium subscription or Starknet wallet connection",
      upgradeAction: "subscribe"
    };
  };

  // Convenience functions for common checks
  const canUserAccessDubbing = (): FeatureAccessResult => {
    return canAccessFeature("voice_dubbing");
  };

  const canUserAccessAI = (): FeatureAccessResult => {
    return canAccessFeature("ai_transcription");
  };

  const canUserAccessWeb3 = (): FeatureAccessResult => {
    return canAccessFeature("nft_minting");
  };

  const canUserAccessUltimate = (): FeatureAccessResult => {
    return canAccessFeature("cross_platform_sync");
  };

  // Get user's current capabilities
  const getUserCapabilities = () => {
    const tier = getCurrentTier();
    
    return {
      tier,
      hasSubscription: subscription.hasActiveSubscription,
      hasWallet: wallet.isConnected,
      dailyAIUsage: subscription.dailyAIUsage,
      remainingAIUses: tier === "web3" ? Math.max(0, 5 - subscription.dailyAIUsage) : null,
      
      // Quick access checks
      canAccessAI: canUserAccessAI().canAccess,
      canAccessWeb3: canUserAccessWeb3().canAccess,
      canAccessUltimate: canUserAccessUltimate().canAccess,
    };
  };

  // Action to consume AI usage (for Web3 tier)
  const consumeAIUsage = () => {
    const tier = getCurrentTier();
    
    if (tier === "web3") {
      subscription.incrementAIUsage();
    }
    // Premium and Ultimate tiers don't need to track usage
  };

  return {
    // Main functions
    canAccessFeature,
    getCurrentTier,
    getUserCapabilities,
    consumeAIUsage,
    
    // Convenience functions (backward compatibility)
    canUserAccessDubbing,
    canUserAccessAI,
    canUserAccessWeb3,
    canUserAccessUltimate,
    
    // State
    isLoading: subscription.isLoading || wallet.isConnecting,
    error: subscription.error || wallet.error,
  };
}

// Hook for components that need to show upgrade prompts
export function useUpgradePrompts() {
  const { canAccessFeature, getCurrentTier } = useFeatureGating();
  
  const getUpgradeMessage = (feature: Feature): string | null => {
    const result = canAccessFeature(feature);
    
    if (result.canAccess) return null;
    
    const tier = getCurrentTier();
    
    switch (result.upgradeAction) {
      case "subscribe":
        return tier === "web3" 
          ? "Upgrade to Ultimate tier for unlimited AI features!"
          : "Subscribe to Premium for unlimited AI features!";
          
      case "connect_wallet":
        return tier === "premium"
          ? "Connect your Starknet wallet to unlock Ultimate features!"
          : "Connect your Starknet wallet to access Web3 features!";
          
      case "upgrade_to_ultimate":
        return "Unlock Ultimate tier with Premium subscription + Starknet wallet!";
        
      default:
        return result.reason || "Upgrade required";
    }
  };

  const getUpgradeButtonText = (feature: Feature): string => {
    const result = canAccessFeature(feature);
    
    switch (result.upgradeAction) {
      case "subscribe":
        return "Subscribe to Premium";
      case "connect_wallet":
        return "Connect Wallet";
      case "upgrade_to_ultimate":
        return "Upgrade to Ultimate";
      default:
        return "Upgrade";
    }
  };

  return {
    getUpgradeMessage,
    getUpgradeButtonText,
  };
}
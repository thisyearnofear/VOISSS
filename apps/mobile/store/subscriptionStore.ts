import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, { 
  CustomerInfo, 
  PurchasesOffering, 
  PurchasesPackage,
  LOG_LEVEL 
} from "react-native-purchases";

// Subscription tiers based on our dual-path strategy
export type SubscriptionTier = "free" | "premium" | "web3" | "ultimate";

interface SubscriptionState {
  // RevenueCat state
  isConfigured: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[] | null;
  isLoading: boolean;
  error: string | null;
  
  // Subscription status
  hasActiveSubscription: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiryDate: string | null;
  
  // Usage tracking for Web3 tier (5 daily AI uses)
  dailyAIUsage: number;
  lastUsageReset: string;
  
  // Actions
  initializeRevenueCat: (apiKey: string) => Promise<void>;
  fetchOfferings: () => Promise<void>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  updateCustomerInfo: (customerInfo: CustomerInfo) => void;
  
  // Feature gating
  canAccessAIFeatures: () => boolean;
  canAccessWeb3Features: () => boolean;
  canAccessUltimateFeatures: () => boolean;
  incrementAIUsage: () => void;
  resetDailyUsage: () => void;
  
  // Tier management
  updateSubscriptionTier: () => void;
  setError: (error: string | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConfigured: false,
      customerInfo: null,
      offerings: null,
      isLoading: false,
      error: null,
      hasActiveSubscription: false,
      subscriptionTier: "free",
      subscriptionExpiryDate: null,
      dailyAIUsage: 0,
      lastUsageReset: new Date().toDateString(),

      initializeRevenueCat: async (apiKey: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Configure RevenueCat
          Purchases.setLogLevel(LOG_LEVEL.INFO);
          await Purchases.configure({ apiKey });
          
          // Get initial customer info
          const customerInfo = await Purchases.getCustomerInfo();
          
          set({ 
            isConfigured: true, 
            customerInfo,
            isLoading: false 
          });
          
          // Update subscription tier based on customer info
          get().updateSubscriptionTier();
          
        } catch (error) {
          console.error("RevenueCat initialization failed:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to initialize RevenueCat",
            isLoading: false 
          });
        }
      },

      fetchOfferings: async () => {
        try {
          set({ isLoading: true, error: null });
          const offerings = await Purchases.getOfferings();
          
          set({ 
            offerings: offerings.all ? Object.values(offerings.all) : [],
            isLoading: false 
          });
        } catch (error) {
          console.error("Failed to fetch offerings:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch offerings",
            isLoading: false 
          });
        }
      },

      purchasePackage: async (packageToPurchase: PurchasesPackage) => {
        try {
          set({ isLoading: true, error: null });
          
          const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
          
          set({ 
            customerInfo,
            isLoading: false 
          });
          
          // Update subscription tier
          get().updateSubscriptionTier();
          
          return true;
        } catch (error) {
          console.error("Purchase failed:", error);
          set({ 
            error: error instanceof Error ? error.message : "Purchase failed",
            isLoading: false 
          });
          return false;
        }
      },

      restorePurchases: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const customerInfo = await Purchases.restorePurchases();
          
          set({ 
            customerInfo,
            isLoading: false 
          });
          
          // Update subscription tier
          get().updateSubscriptionTier();
          
        } catch (error) {
          console.error("Restore purchases failed:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to restore purchases",
            isLoading: false 
          });
        }
      },

      updateCustomerInfo: (customerInfo: CustomerInfo) => {
        set({ customerInfo });
        get().updateSubscriptionTier();
      },

      updateSubscriptionTier: () => {
        const { customerInfo } = get();
        
        if (!customerInfo) {
          set({ 
            hasActiveSubscription: false,
            subscriptionTier: "free",
            subscriptionExpiryDate: null 
          });
          return;
        }

        // Check for active premium subscription
        const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;
        
        if (hasActiveSubscription) {
          const activeEntitlement = Object.values(customerInfo.entitlements.active)[0];
          
          set({
            hasActiveSubscription: true,
            subscriptionTier: "premium", // Will be updated to "ultimate" if wallet is also connected
            subscriptionExpiryDate: activeEntitlement.expirationDate,
          });
        } else {
          set({
            hasActiveSubscription: false,
            subscriptionTier: "free",
            subscriptionExpiryDate: null,
          });
        }
      },

      // Feature gating logic for dual-path approach
      canAccessAIFeatures: () => {
        const { hasActiveSubscription, dailyAIUsage, lastUsageReset } = get();
        
        // Reset daily usage if it's a new day
        const today = new Date().toDateString();
        if (lastUsageReset !== today) {
          get().resetDailyUsage();
        }
        
        // Premium/Ultimate subscribers have unlimited access
        if (hasActiveSubscription) {
          return true;
        }
        
        // Web3 tier users get 5 daily uses
        // Note: This will be enhanced when we integrate with wallet state
        return dailyAIUsage < 5;
      },

      canAccessWeb3Features: () => {
        // Web3 features require wallet connection
        // This will be integrated with wallet state in the featureGating utility
        // The actual wallet check is done in useFeatureGating hook
        return true; // Placeholder - actual check done in featureGating.ts
      },

      canAccessUltimateFeatures: () => {
        const { hasActiveSubscription } = get();
        // Ultimate features require both subscription AND wallet
        // The actual wallet check is done in useFeatureGating hook
        return hasActiveSubscription; // Subscription part of Ultimate tier
      },

      incrementAIUsage: () => {
        const { dailyAIUsage, lastUsageReset } = get();
        
        // Reset if it's a new day
        const today = new Date().toDateString();
        if (lastUsageReset !== today) {
          get().resetDailyUsage();
          return;
        }
        
        set({ dailyAIUsage: dailyAIUsage + 1 });
      },

      resetDailyUsage: () => {
        set({ 
          dailyAIUsage: 0,
          lastUsageReset: new Date().toDateString()
        });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: "voisss-subscription-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist RevenueCat objects, only our state
      partialize: (state) => ({
        hasActiveSubscription: state.hasActiveSubscription,
        subscriptionTier: state.subscriptionTier,
        subscriptionExpiryDate: state.subscriptionExpiryDate,
        dailyAIUsage: state.dailyAIUsage,
        lastUsageReset: state.lastUsageReset,
      }),
    }
  )
);

// Hook to get combined wallet + subscription status
export const useFeatureAccess = () => {
  const subscription = useSubscriptionStore();
  
  // This will be enhanced to include wallet state from useStarknet
  // For now, we'll create the interface for dual-path gating
  
  return {
    // AI Features: Premium subscription OR (Web3 wallet + daily limit)
    canAccessAI: subscription.canAccessAIFeatures(),
    
    // Web3 Features: Wallet connection required
    canAccessWeb3: subscription.canAccessWeb3Features(),
    
    // Ultimate Features: Both subscription AND wallet
    canAccessUltimate: subscription.canAccessUltimateFeatures(),
    
    // Usage info
    dailyAIUsage: subscription.dailyAIUsage,
    remainingAIUses: Math.max(0, 5 - subscription.dailyAIUsage),
    
    // Subscription info
    hasSubscription: subscription.hasActiveSubscription,
    subscriptionTier: subscription.subscriptionTier,
    
    // Actions
    incrementAIUsage: subscription.incrementAIUsage,
  };
};
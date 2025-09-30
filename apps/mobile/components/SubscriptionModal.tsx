import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Sparkles, Check, Crown, RefreshCw, Wallet, Bot, Scissors, FileAudio, Megaphone, Clock, Star, Zap, Shield, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useStarknet } from '../hooks/useStarknet';
import { WalletModal } from './WalletModal';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'premium' | 'ultimate' | 'manage';
}

const premiumFeatures = [
  {
    icon: Bot,
    title: "AI Voices",
    description: "Transform your voice with AI-generated voices",
  },
  {
    icon: Scissors,
    title: "AI Snippets",
    description: "Auto-cut recordings into shareable snippets",
  },
  {
    icon: FileAudio,
    title: "Auto Transcription",
    description: "Get instant text transcripts of recordings",
  },
  {
    icon: Megaphone,
    title: "Smart Promotion",
    description: "AI helps you reach the right audience",
  },
  {
    icon: Clock,
    title: "Unlimited Recording",
    description: "No time limits on your recordings",
  },
  {
    icon: Star,
    title: "Priority Support",
    description: "Get help when you need it most",
  },
];

const ultimateFeatures = [
  {
    icon: Bot,
    title: "All Premium AI Features",
    description: "Unlimited AI voices, transcription, and snippets",
  },
  {
    icon: Wallet,
    title: "Web3 Integration",
    description: "NFT minting and on-chain storage",
  },
  {
    icon: Shield,
    title: "Decentralized Ownership",
    description: "Cryptographic proof of creation and ownership",
  },
  {
    icon: Globe,
    title: "Cross-Platform Sync",
    description: "Seamless sync between mobile and web via blockchain",
  },
  {
    icon: Crown,
    title: "Exclusive AI Models",
    description: "Access to the latest and most advanced AI",
  },
  {
    icon: Zap,
    title: "Enhanced Web3 Features",
    description: "Advanced blockchain utilities and rewards",
  },
];

export function SubscriptionModal({ visible, onClose, initialTab = 'premium' }: SubscriptionModalProps) {
  const {
    isConfigured,
    offerings,
    isLoading,
    error,
    hasActiveSubscription,
    subscriptionTier,
    initializeRevenueCat,
    fetchOfferings,
    purchasePackage,
    restorePurchases,
  } = useSubscriptionStore();

  const { isConnected: isWalletConnected, account } = useStarknet();
  
  const [activeTab, setActiveTab] = useState<'premium' | 'ultimate' | 'manage'>(initialTab);
  const [isWalletModalVisible, setIsWalletModalVisible] = useState(false);

  // Determine current tier based on subscription and wallet status
  const getCurrentTier = () => {
    if (hasActiveSubscription && isWalletConnected) return 'ultimate';
    if (hasActiveSubscription) return 'premium';
    if (isWalletConnected) return 'web3';
    return 'free';
  };

  const currentTier = getCurrentTier();

  useEffect(() => {
    if (visible && !isConfigured) {
      initializeRevenueCat('your_revenuecat_api_key_here');
    }
  }, [visible, isConfigured]);

  useEffect(() => {
    if (isConfigured && visible) {
      fetchOfferings();
    }
  }, [isConfigured, visible]);

  // Get the current offering (first one for now)
  const currentOffering = offerings && offerings.length > 0 ? offerings[0] : null;

  const handlePurchase = async (pkg: any) => {
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        Alert.alert('Success', 'Subscription activated successfully!');
        setActiveTab('manage');
      }
    } catch (err) {
      Alert.alert('Purchase Failed', 'Failed to complete purchase. Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Restore Complete', 'Your purchases have been restored.');
    } catch (err) {
      Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
    }
  };

  const renderPremiumTab = () => {
    if (isLoading || !currentOffering) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.dark.primary} />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
      );
    }

    const monthlyPackage = currentOffering.availablePackages.find(
      (pkg: any) => pkg.packageType === 'MONTHLY'
    );
    const annualPackage = currentOffering.availablePackages.find(
      (pkg: any) => pkg.packageType === 'ANNUAL'
    );

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <LinearGradient
          colors={['#7C5DFA', '#4E7BFF']}
          style={styles.premiumHeader}
        >
          <View style={styles.premiumBadge}>
            <Sparkles size={24} color="#FFD700" />
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.premiumTitle}>Unlock AI-Powered Features</Text>
          <Text style={styles.premiumSubtitle}>
            Transform your voice recordings with cutting-edge AI technology
          </Text>
        </LinearGradient>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's Included</Text>
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <feature.icon size={20} color={colors.dark.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
              <Check size={20} color="#4CAF50" />
            </View>
          ))}
        </View>

        {/* Pricing Plans */}
        <View style={styles.plansContainer}>
          {annualPackage && (
            <TouchableOpacity
              style={[styles.planCard, styles.popularPlan]}
              onPress={() => handlePurchase(annualPackage)}
              disabled={isLoading}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
              <Text style={styles.planTitle}>Annual</Text>
              <Text style={styles.planPrice}>
                {annualPackage.product.priceString}/year
              </Text>
              <Text style={styles.planSavings}>Save 40%</Text>
              <Text style={styles.planDescription}>
                Best value for serious creators
              </Text>
            </TouchableOpacity>
          )}

          {monthlyPackage && (
            <TouchableOpacity
              style={styles.planCard}
              onPress={() => handlePurchase(monthlyPackage)}
              disabled={isLoading}
            >
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planPrice}>
                {monthlyPackage.product.priceString}/month
              </Text>
              <Text style={styles.planDescription}>
                Perfect for getting started
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Restore Button */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isLoading}
        >
          <RefreshCw size={16} color={colors.dark.primary} />
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          Subscription automatically renews unless auto-renew is turned off at
          least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    );
  };

  const renderUltimateTab = () => {
    const hasSubscription = hasActiveSubscription;
    const hasWallet = isWalletConnected;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ultimate Header */}
        <LinearGradient
          colors={['#FFD700', '#FF6B35', '#7C5DFA']}
          style={styles.premiumHeader}
        >
          <View style={styles.ultimateBadge}>
            <Crown size={24} color="#FFD700" />
            <Text style={styles.ultimateBadgeText}>ULTIMATE</Text>
          </View>
          <Text style={styles.premiumTitle}>Premium + Web3 Power</Text>
          <Text style={styles.premiumSubtitle}>
            The complete VOISSS experience with AI and blockchain features
          </Text>
        </LinearGradient>

        {/* Current Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Sparkles size={20} color={hasSubscription ? '#4CAF50' : colors.dark.textSecondary} />
            <Text style={[styles.statusText, hasSubscription && styles.statusTextActive]}>
              Premium Subscription {hasSubscription ? '✓' : '✗'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Wallet size={20} color={hasWallet ? '#4CAF50' : colors.dark.textSecondary} />
            <Text style={[styles.statusText, hasWallet && styles.statusTextActive]}>
              Starknet Wallet {hasWallet ? '✓' : '✗'}
            </Text>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Ultimate Features</Text>
          {ultimateFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <feature.icon size={20} color={colors.dark.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
              <Check size={20} color="#4CAF50" />
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.ultimateActions}>
          {!hasSubscription && (
            <TouchableOpacity
              style={styles.ultimateActionButton}
              onPress={() => setActiveTab('premium')}
            >
              <Sparkles size={16} color={colors.dark.text} />
              <Text style={styles.ultimateActionText}>Get Premium Subscription</Text>
            </TouchableOpacity>
          )}
          
          {!hasWallet && (
            <TouchableOpacity
              style={[styles.ultimateActionButton, styles.walletActionButton]}
              onPress={() => setIsWalletModalVisible(true)}
            >
              <Wallet size={16} color={colors.dark.text} />
              <Text style={styles.ultimateActionText}>Connect Starknet Wallet</Text>
            </TouchableOpacity>
          )}

          {hasSubscription && hasWallet && (
            <View style={styles.ultimateComplete}>
              <Crown size={48} color="#FFD700" />
              <Text style={styles.ultimateCompleteTitle}>Ultimate Tier Unlocked!</Text>
              <Text style={styles.ultimateCompleteText}>
                You have access to all Premium AI features and Web3 capabilities.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderManageTab = () => {
    if (!hasActiveSubscription) {
      return (
        <View style={styles.noSubscriptionContainer}>
          <Sparkles size={48} color={colors.dark.textSecondary} />
          <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
          <Text style={styles.noSubscriptionText}>
            Subscribe to Premium to unlock AI-powered features
          </Text>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => setActiveTab('premium')}
          >
            <Text style={styles.subscribeButtonText}>View Plans</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Subscription Card */}
        <View style={styles.currentSubscriptionCard}>
          <LinearGradient
            colors={currentTier === 'ultimate' ? ['#FFD700', '#FF6B35'] : ['#7C5DFA', '#4E7BFF']}
            style={styles.subscriptionGradient}
          >
            <Crown size={48} color="#FFD700" />
            <Text style={styles.currentSubscriptionTitle}>
              {currentTier === 'ultimate' ? 'Ultimate' : 'Premium'} Member
            </Text>
            <Text style={styles.currentSubscriptionTier}>
              {currentTier === 'ultimate' ? 'Premium + Web3' : 'AI Features Unlocked'}
            </Text>
          </LinearGradient>
        </View>

        {/* Subscription Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Subscription Details</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>Active</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tier:</Text>
            <Text style={styles.detailValue}>{subscriptionTier}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Wallet:</Text>
            <Text style={styles.detailValue}>
              {isWalletConnected ? `Connected (${account?.slice(0, 6)}...)` : 'Not Connected'}
            </Text>
          </View>
        </View>

        {/* Manage Actions */}
        <View style={styles.manageContainer}>
          <Text style={styles.manageTitle}>Manage Subscription</Text>
          <Text style={styles.manageDescription}>
            To cancel or modify your subscription, please visit the App Store or Google Play Store.
          </Text>
          <TouchableOpacity style={styles.manageButton} onPress={handleRestore}>
            <RefreshCw size={16} color={colors.dark.text} />
            <Text style={styles.manageButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'premium' && styles.activeTab]}
            onPress={() => setActiveTab('premium')}
          >
            <Sparkles size={16} color={activeTab === 'premium' ? colors.dark.text : colors.dark.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'premium' && styles.activeTabText]}>
              Premium
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ultimate' && styles.activeTab]}
            onPress={() => setActiveTab('ultimate')}
          >
            <Crown size={16} color={activeTab === 'ultimate' ? colors.dark.text : colors.dark.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'ultimate' && styles.activeTabText]}>
              Ultimate
            </Text>
          </TouchableOpacity>
          {hasActiveSubscription && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
              onPress={() => setActiveTab('manage')}
            >
              <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>
                Manage
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'premium' && renderPremiumTab()}
          {activeTab === 'ultimate' && renderUltimateTab()}
          {activeTab === 'manage' && renderManageTab()}
        </ScrollView>

        {/* Wallet Modal */}
        <WalletModal
          visible={isWalletModalVisible}
          onClose={() => setIsWalletModalVisible(false)}
          onConnected={() => {
            setIsWalletModalVisible(false);
            // If user has subscription, they now have Ultimate tier
            if (hasActiveSubscription) {
              setActiveTab('ultimate');
            }
          }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.dark.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  tab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: colors.dark.card,
  },
  activeTab: {
    backgroundColor: colors.dark.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.dark.textSecondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: colors.dark.text,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },
  loadingText: {
    color: colors.dark.textSecondary,
    marginTop: 16,
  },
  premiumHeader: {
    padding: 32,
    alignItems: 'center' as const,
    margin: 16,
    borderRadius: 16,
  },
  premiumBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontWeight: '700' as const,
    marginLeft: 8,
  },
  ultimateBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  ultimateBadgeText: {
    color: '#FFD700',
    fontWeight: '700' as const,
    marginLeft: 8,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: colors.dark.text,
    textAlign: 'center' as const,
    opacity: 0.9,
  },
  statusContainer: {
    padding: 16,
    backgroundColor: colors.dark.card,
    margin: 16,
    borderRadius: 12,
  },
  statusItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    marginLeft: 12,
  },
  statusTextActive: {
    color: '#4CAF50',
    fontWeight: '600' as const,
  },
  featuresContainer: {
    padding: 16,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.dark.primary}20`,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative' as const,
  },
  popularPlan: {
    borderColor: colors.dark.primary,
  },
  popularBadge: {
    position: 'absolute' as const,
    top: -10,
    left: 16,
    backgroundColor: colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularBadgeText: {
    color: colors.dark.text,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.dark.text,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.dark.primary,
    marginBottom: 4,
  },
  planSavings: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4CAF50',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  restoreButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    margin: 16,
    padding: 16,
  },
  restoreButtonText: {
    color: colors.dark.primary,
    fontWeight: '500' as const,
    marginLeft: 8,
  },
  termsText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    textAlign: 'center' as const,
    padding: 16,
    lineHeight: 16,
  },
  ultimateActions: {
    padding: 16,
  },
  ultimateActionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  walletActionButton: {
    backgroundColor: '#4E7BFF',
  },
  ultimateActionText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  ultimateComplete: {
    alignItems: 'center' as const,
    paddingVertical: 32,
  },
  ultimateCompleteTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  ultimateCompleteText: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  noSubscriptionContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  subscribeButtonText: {
    color: colors.dark.text,
    fontWeight: '600' as const,
  },
  currentSubscriptionCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  subscriptionGradient: {
    padding: 32,
    alignItems: 'center' as const,
  },
  currentSubscriptionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
    marginTop: 16,
    marginBottom: 4,
  },
  currentSubscriptionTier: {
    fontSize: 14,
    color: colors.dark.text,
    opacity: 0.8,
  },
  detailsContainer: {
    backgroundColor: colors.dark.card,
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.dark.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.dark.text,
  },
  manageContainer: {
    backgroundColor: colors.dark.card,
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  manageTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginBottom: 8,
  },
  manageDescription: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  manageButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  manageButtonText: {
    color: colors.dark.text,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
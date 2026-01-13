import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Sparkles,
  Check,
  Crown,
  RefreshCw,
  Wallet,
  Bot,
  Scissors,
  FileAudio,
  Megaphone,
  Clock,
  Star,
  Zap,
  Shield,
  Globe,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@voisss/ui";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useBase } from "../hooks/useBase";
import { WalletModal } from "./WalletModal";
import { BaseModal } from "@voisss/ui";

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: "premium" | "ultimate" | "manage";
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
    title: "Unlimited Length",
    description: "Record and process audio of any length",
  },
  {
    icon: Megaphone,
    title: "Advanced Sharing",
    description: "Enhanced sharing options and analytics",
  },
];

const ultimateFeatures = [
  {
    icon: Wallet,
    title: "Web3 Integration",
    description: "Store recordings permanently on blockchain",
  },
  {
    icon: Shield,
    title: "NFT Minting",
    description: "Mint your recordings as collectible NFTs",
  },
  {
    icon: Globe,
    title: "Decentralized Storage",
    description: "IPFS-based decentralized storage",
  },
  {
    icon: Star,
    title: "Creator Rewards",
    description: "Earn rewards for popular content",
  },
  {
    icon: Zap,
    title: "Priority Processing",
    description: "Faster AI processing and transcoding",
  },
  {
    icon: Crown,
    title: "Exclusive Features",
    description: "Early access to new features and tools",
  },
];

export default function SubscriptionModal({
  visible,
  onClose,
  initialTab = "premium"
}: SubscriptionModalProps) {
  const { subscriptionTier, hasActiveSubscription, subscriptionExpiryDate, restorePurchases } = useSubscriptionStore();
  const { isConnected } = useBase();
  const [activeTab, setActiveTab] = useState<"premium" | "ultimate" | "manage">(initialTab);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handlePurchase = async (tier: "premium" | "ultimate") => {
    if (tier === "ultimate" && !isConnected) {
      setWalletModalVisible(true);
      return;
    }

    setIsPurchasing(true);
    try {
      // For now, we'll simulate the purchase since we don't have the actual package mapping
      // In a real implementation, we would map the tier to the appropriate RevenueCat package
      console.log(`Attempting to purchase ${tier} subscription`);
      // Show success message
    } catch (error) {
      Alert.alert("Purchase Failed", "Unable to complete purchase. Please try again.");
      console.error("Purchase error:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert("Success", "Purchases restored successfully!");
    } catch (error) {
      Alert.alert("Restore Failed", "Unable to restore purchases. Please try again.");
      console.error("Restore error:", error);
    }
  };

  const renderPremiumPlan = () => (
    <View style={{ padding: 16 }}>
      <LinearGradient
        colors={["#7C5DFA", "#4E7BFF"]}
        style={{
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Sparkles size={48} color="#FFFFFF" />
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Premium
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.9)",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Unlock advanced AI features
        </Text>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          $4.99
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "rgba(255, 255, 255, 0.8)",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          per month
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#FFFFFF",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={() => handlePurchase("premium")}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#7C5DFA" />
          ) : (
            <Text
              style={{
                color: "#7C5DFA",
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              Subscribe Now
            </Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.dark.text,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Premium Features
        </Text>
        {premiumFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "rgba(124, 93, 250, 0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                  marginTop: 2,
                }}
              >
                <IconComponent size={16} color="#7C5DFA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: colors.dark.text,
                    marginBottom: 4,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.dark.textSecondary,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderUltimatePlan = () => (
    <View style={{ padding: 16 }}>
      <LinearGradient
        colors={["#FF6B6B", "#6B46C1"]}
        style={{
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Crown size={48} color="#FFFFFF" />
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Ultimate
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.9)",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Everything in Premium + Web3 features
        </Text>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          $9.99
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "rgba(255, 255, 255, 0.8)",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          per month
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#FFFFFF",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={() => handlePurchase("ultimate")}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#6B46C1" />
          ) : (
            <Text
              style={{
                color: "#6B46C1",
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              Subscribe Now
            </Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.dark.text,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Ultimate Features
        </Text>
        {ultimateFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "rgba(255, 107, 107, 0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                  marginTop: 2,
                }}
              >
                <IconComponent size={16} color="#FF6B6B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: colors.dark.text,
                    marginBottom: 4,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.dark.textSecondary,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderManageSubscriptions = () => (
    <View style={{ padding: 16 }}>
      <View
        style={{
          backgroundColor: colors.dark.card,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          {subscription.tier === "premium" ? (
            <Sparkles size={48} color="#7C5DFA" />
          ) : (
            <Crown size={48} color="#FF6B6B" />
          )}
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: colors.dark.text,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {hasActiveSubscription && subscriptionTier === "premium" ? "Premium" : "Ultimate"} Plan
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.dark.textSecondary,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Active subscription
        </Text>
        <View
          style={{
            backgroundColor: colors.dark.background,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.dark.textSecondary,
              marginBottom: 4,
            }}
          >
            Next billing date
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.dark.text,
            }}
          >
            {subscriptionExpiryDate
              ? new Date(subscriptionExpiryDate).toLocaleDateString()
              : "Unknown"}
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: colors.dark.primary,
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 12,
          }}
          onPress={handleRestore}
        >
          <RefreshCw size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text
            style={{
              color: "#FFFFFF",
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Restore Purchases
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: colors.dark.card,
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={() => {
            Alert.alert(
              "Cancel Subscription",
              "Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm",
                  style: "destructive",
                  onPress: () => {
                    // TODO: Implement subscription cancellation
                    Alert.alert(
                      "Not Implemented",
                      "Subscription cancellation is not yet implemented."
                    );
                  },
                },
              ]
            );
          }}
        >
          <Text
            style={{
              color: colors.dark.error,
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Cancel Subscription
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <BaseModal
        visible={visible}
        onClose={onClose}
        title=""
        showCloseButton={false}
      >
        <View>
          {/* Tab Navigation */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.dark.card,
              borderRadius: 12,
              margin: 16,
              padding: 4,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor:
                  activeTab === "premium" ? colors.dark.primary : "transparent",
                alignItems: "center",
              }}
              onPress={() => setActiveTab("premium")}
            >
              <Text
                style={{
                  color:
                    activeTab === "premium"
                      ? "#FFFFFF"
                      : colors.dark.textSecondary,
                  fontWeight: "600",
                }}
              >
                Premium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor:
                  activeTab === "ultimate" ? "#FF6B6B" : "transparent",
                alignItems: "center",
              }}
              onPress={() => setActiveTab("ultimate")}
            >
              <Text
                style={{
                  color:
                    activeTab === "ultimate"
                      ? "#FFFFFF"
                      : colors.dark.textSecondary,
                  fontWeight: "600",
                }}
              >
                Ultimate
              </Text>
            </TouchableOpacity>
            {hasActiveSubscription && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor:
                    activeTab === "manage" ? colors.dark.primary : "transparent",
                  alignItems: "center",
                }}
                onPress={() => setActiveTab("manage")}
              >
                <Text
                  style={{
                    color:
                      activeTab === "manage"
                        ? "#FFFFFF"
                        : colors.dark.textSecondary,
                    fontWeight: "600",
                  }}
                >
                  Manage
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView>
            {activeTab === "premium" && renderPremiumPlan()}
            {activeTab === "ultimate" && renderUltimatePlan()}
            {activeTab === "manage" && renderManageSubscriptions()}
          </ScrollView>
        </View>
      </BaseModal>

      <WalletModal
        visible={walletModalVisible}
        onClose={() => setWalletModalVisible(false)}
      />
    </>
  );
}
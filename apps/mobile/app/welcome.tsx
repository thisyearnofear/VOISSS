import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Mic,
  FileAudio,
  Tag,
  Search,
  ArrowRight,
  ChevronRight,
} from "lucide-react-native";
import AnimatedGradientBackground from "@/components/AnimatedGradientBackground";
import colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import { useOnboardingStore } from "@/store/onboardingStore";

const { width } = Dimensions.get("window");

const ONBOARDING_STEPS = [
  {
    id: "organize",
    title: "Organize Your Voice Recordings",
    description:
      "Tired of scattered voice notes? VOISSS helps you organize all your recordings in one place with smart tagging and search.",
    icon: FileAudio,
    color: colors.dark.primary,
  },
  {
    id: "import",
    title: "Import From Anywhere",
    description:
      "Easily import recordings from your device, cloud storage, or record new ones directly in the app.",
    icon: Mic,
    color: colors.dark.secondary,
  },
  {
    id: "tag",
    title: "Smart Tagging & Categories",
    description:
      "Automatically organize recordings into categories or create your own custom tags for quick access.",
    icon: Tag,
    color: colors.dark.success,
  },
  {
    id: "search",
    title: "Find Recordings Instantly",
    description:
      "Powerful search helps you find any recording by name, tag, or content with just a few taps.",
    icon: Search,
    color: colors.dark.warning,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { skipOnboarding } = useLocalSearchParams<{
    skipOnboarding?: string;
  }>();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Get onboarding store actions
  const { hasCompletedOnboarding, setOnboardingComplete } =
    useOnboardingStore();

  // Skip welcome screen if onboarding is completed
  useEffect(() => {
    if (skipOnboarding === "true" || hasCompletedOnboarding) {
      router.replace({
        pathname: "/tabs",
      });
    }
  }, [skipOnboarding, hasCompletedOnboarding, router]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep((prev) => prev + 1);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Mark onboarding as complete
      setOnboardingComplete(true);
      // Go to main app
      router.replace({
        pathname: "/tabs",
      });
    }
  };

  const handleSkip = () => {
    // Mark onboarding as complete
    setOnboardingComplete(true);
    router.replace({
      pathname: "/tabs",
    });
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AnimatedGradientBackground
        breathing={true}
        gradientColors={[
          colors.dark.background,
          colors.dark.primary + "40", // Adding transparency
          colors.dark.secondary + "40",
          colors.dark.background,
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.logo}>VOISSS</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: currentStepData.color + "20" },
              ]}
            >
              <IconComponent size={48} color={currentStepData.color} />
            </View>

            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.description}>
              {currentStepData.description}
            </Text>

            {currentStep === 0 && (
              <View style={styles.problemContainer}>
                <Text style={styles.problemTitle}>The Problem:</Text>
                <View style={styles.problemItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.problemText}>
                    Voice recordings scattered across different apps
                  </Text>
                </View>
                <View style={styles.problemItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.problemText}>
                    No easy way to organize or find specific recordings
                  </Text>
                </View>
                <View style={styles.problemItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.problemText}>
                    Limited tagging and categorization options
                  </Text>
                </View>
              </View>
            )}

            {currentStep === ONBOARDING_STEPS.length - 1 && (
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Key Features:</Text>
                <View style={styles.featureRow}>
                  <View style={styles.featureItem}>
                    <FileAudio size={24} color={colors.dark.primary} />
                    <Text style={styles.featureText}>Smart Import</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Tag size={24} color={colors.dark.secondary} />
                    <Text style={styles.featureText}>Auto-Tagging</Text>
                  </View>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.featureItem}>
                    <Search size={24} color={colors.dark.success} />
                    <Text style={styles.featureText}>Powerful Search</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Mic size={24} color={colors.dark.warning} />
                    <Text style={styles.featureText}>
                      High-Quality Recording
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>

          <View style={styles.pagination}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentStep === index && styles.paginationDotActive,
                  {
                    backgroundColor:
                      currentStep === index
                        ? currentStepData.color
                        : colors.dark.inactive,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: currentStepData.color },
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep < ONBOARDING_STEPS.length - 1
                ? "Next"
                : "Get Started"}
            </Text>
            {currentStep < ONBOARDING_STEPS.length - 1 ? (
              <ChevronRight size={20} color={colors.dark.text} />
            ) : (
              <ArrowRight size={20} color={colors.dark.text} />
            )}
          </TouchableOpacity>
        </View>

        {Platform.OS !== "web" && (
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
            }}
            style={styles.backgroundImage}
            blurRadius={20}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark.text,
  },
  skipButton: {
    padding: theme.spacing.sm,
  },
  skipText: {
    color: colors.dark.textSecondary,
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  stepContent: {
    alignItems: "center",
    width: "100%",
    maxWidth: 500,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark.text,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  problemContainer: {
    width: "100%",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.md,
  },
  problemItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dark.primary,
    marginRight: theme.spacing.sm,
  },
  problemText: {
    fontSize: 15,
    color: colors.dark.textSecondary,
    flex: 1,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: theme.spacing.xl,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flex: 1,
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: "center",
    marginHorizontal: theme.spacing.xs,
  },
  featureText: {
    fontSize: 14,
    color: colors.dark.text,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  pagination: {
    flexDirection: "row",
    marginBottom: theme.spacing.xl,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  paginationDotActive: {
    width: 20,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xl,
  },
  nextButtonText: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: "600",
    marginRight: theme.spacing.sm,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.1,
    zIndex: -1,
  },
});

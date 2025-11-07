import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Mic,
  FileAudio,
  Tag,
  Search,
  ArrowRight,
  ChevronRight,
  Globe,
  Users,
  Lock,
  Heart,
  MessageCircle,
  Share2,
  Play,
  Pause,
  Headphones,
  TrendingUp,
  Award,
  DollarSign,
  Zap,
  Sparkles,
  Scissors,
  Bot,
  Megaphone,
  Clock,
  Wallet,
  Crown,
  Target,
  MapPin,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, theme, globalStyles } from "@voisss/ui";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useFeatureGating, useUpgradePrompts } from "../../utils/featureGating";
import { formatDuration, createPersistentMissionService, type Mission } from "@voisss/shared";

// Top navigation items
const topNavItems = [
  { id: "home", name: "Home", icon: Sparkles },
  { id: "community", name: "Community", icon: Users },
  { id: "leaderboard", name: "Leaderboard", icon: Award },
  { id: "challenges", name: "Challenges", icon: Zap },
];

// Mock trending recordings
const trendingRecordings = [
  {
    id: "trending1",
    title: "Morning Thoughts on AI Development",
    author: "Alex Chen",
    duration: 145, // 2:25
    plays: 1243,
    likes: 89,
    comments: 12,
    isPublic: true,
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
    waveform: Array.from({ length: 20 }, () => Math.random() * 0.8 + 0.2),
  },
  {
    id: "trending2",
    title: "Quick Guitar Riff Idea",
    author: "Maria Lopez",
    duration: 78, // 1:18
    plays: 876,
    likes: 54,
    comments: 8,
    isPublic: true,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
    waveform: Array.from({ length: 20 }, () => Math.random() * 0.8 + 0.2),
  },
  {
    id: "trending3",
    title: "Podcast Intro Draft",
    author: "James Wilson",
    duration: 182, // 3:02
    plays: 542,
    likes: 32,
    comments: 5,
    isPublic: true,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
    waveform: Array.from({ length: 20 }, () => Math.random() * 0.8 + 0.2),
  },
];

// Mock communities
const communities = [
  {
    id: "comm1",
    name: "Music Producers",
    members: 1243,
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  },
  {
    id: "comm2",
    name: "Language Learners",
    members: 876,
    image:
      "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80",
  },
  {
    id: "comm3",
    name: "Podcast Creators",
    members: 542,
    image:
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  },
  {
    id: "comm4",
    name: "Voice Actors",
    members: 324,
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  },
];

// Mock challenges
const challenges = [
  {
    id: "challenge1",
    title: "Daily Voice Journal",
    description: "Record a 1-minute reflection every day for a week",
    participants: 1243,
    daysLeft: 3,
    reward: "500 points",
    image:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1168&q=80",
  },
  {
    id: "challenge2",
    title: "Accent Challenge",
    description: "Try speaking in 5 different accents",
    participants: 876,
    daysLeft: 5,
    reward: "300 points",
    image:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  },
  {
    id: "challenge3",
    title: "Song Cover",
    description: "Record yourself singing your favorite song",
    participants: 542,
    daysLeft: 7,
    reward: "400 points",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  },
];

// Mock leaderboard
const leaderboard = [
  {
    id: "user1",
    name: "Alex Chen",
    points: 12430,
    rank: 1,
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    id: "user2",
    name: "Maria Lopez",
    points: 10876,
    rank: 2,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    id: "user3",
    name: "James Wilson",
    points: 9542,
    rank: 3,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    id: "user4",
    name: "Sarah Johnson",
    points: 8324,
    rank: 4,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  },
  {
    id: "user5",
    name: "David Kim",
    points: 7890,
    rank: 5,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
];

// AI features
const aiFeatures = [
  {
    id: "snippets",
    title: "AI Snippets",
    description: "Auto-cut your recordings into shareable snippets",
    icon: Scissors,
    color: "#7C5DFA",
  },
  {
    id: "voices",
    title: "AI Voices",
    description: "Transform your voice or use AI-generated voices",
    icon: Bot,
    color: "#4E7BFF",
  },
  {
    id: "transcription",
    title: "Auto Transcription",
    description: "Get text transcripts of your recordings instantly",
    icon: FileAudio,
    color: "#FF5252",
  },
  {
    id: "promotion",
    title: "Smart Promotion",
    description: "AI helps you reach the right audience",
    icon: Megaphone,
    color: "#4CAF50",
  },
];

const { width } = Dimensions.get("window");

export default function DiscoverScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("public");
  const [activeTopNav, setActiveTopNav] = useState("home");

  // Feature gating hooks
  const { getCurrentTier, getUserCapabilities } = useFeatureGating();
  const { getUpgradeMessage, getUpgradeButtonText } = useUpgradePrompts();

  const currentTier = getCurrentTier();
  const capabilities = getUserCapabilities();

  // Real mission data
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [missionService] = useState(() => createPersistentMissionService());

  // Load missions on mount
  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoadingMissions(true);
      setMissionError(null);
      const activeMissions = await missionService.getActiveMissions();
      setMissions(activeMissions);
    } catch (error) {
      console.error('Failed to load missions:', error);
      setMissionError('Failed to load missions');
    } finally {
      setLoadingMissions(false);
    }
  };

  const getMissionIcon = (topic: string) => {
    const icons: Record<string, any> = {
      crypto: "🪙",
      work: "💼",
      relationships: "💑",
      technology: "🤖",
      social: "👥",
      local: "🏘️",
    };
    return icons[topic] || "💬";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      easy: colors.dark.success || "#4CAF50",
      medium: colors.dark.warning || "#FFC107",
      hard: colors.dark.error || "#FF5252",
    };
    return colorMap[difficulty] || colors.dark.textSecondary;
  };

  const handlePlayPause = (id: string) => {
    setCurrentPlayingId((prev) => (prev === id ? null : id));
  };

  const renderTrendingItem = ({
    item,
  }: {
    item: (typeof trendingRecordings)[0];
  }) => (
    <View style={styles.trendingItem}>
      <View style={styles.trendingHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.recordingTitle}>{item.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handlePlayPause(item.id)}
        >
          {currentPlayingId === item.id ? (
            <Pause size={20} color={colors.dark.text} />
          ) : (
            <Play size={20} color={colors.dark.text} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.waveformContainer}>
        {item.waveform.map((value, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: value * 40,
                backgroundColor:
                  currentPlayingId === item.id
                    ? colors.dark.primary
                    : colors.dark.waveformBackground,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.recordingMeta}>
        <View style={styles.durationContainer}>
          <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Headphones size={16} color={colors.dark.textSecondary} />
            <Text style={styles.statText}>{item.plays}</Text>
          </View>
          <View style={styles.statItem}>
            <Heart size={16} color={colors.dark.textSecondary} />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <MessageCircle size={16} color={colors.dark.textSecondary} />
            <Text style={styles.statText}>{item.comments}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={16} color={colors.dark.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCommunityItem = ({ item }: { item: (typeof communities)[0] }) => (
    <TouchableOpacity style={styles.communityItem}>
      <Image source={{ uri: item.image }} style={styles.communityImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.communityGradient}
      />
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityMembers}>{item.members} members</Text>
      </View>
    </TouchableOpacity>
  );

  const renderChallengeItem = ({ item }: { item: (typeof challenges)[0] }) => (
    <TouchableOpacity style={styles.challengeItem}>
      <Image source={{ uri: item.image }} style={styles.challengeImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.challengeGradient}
      />
      <View style={styles.challengeInfo}>
        <Text style={styles.challengeTitle}>{item.title}</Text>
        <Text style={styles.challengeDescription}>{item.description}</Text>
        <View style={styles.challengeMeta}>
          <Text style={styles.challengeParticipants}>
            {item.participants} participants
          </Text>
          <Text style={styles.challengeDaysLeft}>
            {item.daysLeft} days left
          </Text>
        </View>
        <View style={styles.challengeReward}>
          <Award size={14} color={colors.dark.warning} />
          <Text style={styles.challengeRewardText}>{item.reward}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: (typeof leaderboard)[0];
    index: number;
  }) => (
    <View style={styles.leaderboardItem}>
      <Text style={styles.leaderboardRank}>#{item.rank}</Text>
      <Image source={{ uri: item.avatar }} style={styles.leaderboardAvatar} />
      <View style={styles.leaderboardUserInfo}>
        <Text style={styles.leaderboardName}>{item.name}</Text>
        <Text style={styles.leaderboardPoints}>
          {item.points.toLocaleString()} points
        </Text>
      </View>
      {index < 3 && (
        <View
          style={[
            styles.leaderboardBadge,
            {
              backgroundColor:
                index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32",
            },
          ]}
        >
          <Award size={14} color={colors.dark.background} />
        </View>
      )}
    </View>
  );

  const renderAIFeatureItem = ({ item }: { item: (typeof aiFeatures)[0] }) => {
    const IconComponent = item.icon;

    return (
      <TouchableOpacity style={styles.aiFeatureItem}>
        <View
          style={[
            styles.aiFeatureIconContainer,
            { backgroundColor: `${item.color}20` },
          ]}
        >
          <IconComponent size={24} color={item.color} />
        </View>
        <Text style={styles.aiFeatureTitle}>{item.title}</Text>
        <Text style={styles.aiFeatureDescription}>{item.description}</Text>
      </TouchableOpacity>
    );
  };

  // Render content based on active top navigation
  const renderContent = () => {
    switch (activeTopNav) {
      case "home":
        return (
          <>
            <View style={styles.brandHeader}>
              <Text style={styles.brandName}>VOISSS</Text>
              <Text style={styles.brandTagline}>Your Voice. Organized.</Text>

              <View style={styles.ctaContainer}>
                <TouchableOpacity style={styles.ctaButton}>
                  <Mic size={16} color={colors.dark.text} />
                  <Text style={styles.ctaButtonText}>Record</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ctaButton, styles.ctaButtonSecondary]}
                >
                  <FileAudio size={16} color={colors.dark.primary} />
                  <Text style={styles.ctaButtonTextSecondary}>Import</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sharingTabs}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "public" && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab("public")}
              >
                <Globe
                  size={16}
                  color={
                    activeTab === "public"
                      ? colors.dark.primary
                      : colors.dark.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "public" && styles.activeTabText,
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "groups" && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab("groups")}
              >
                <Users
                  size={16}
                  color={
                    activeTab === "groups"
                      ? colors.dark.primary
                      : colors.dark.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "groups" && styles.activeTabText,
                  ]}
                >
                  Groups
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "private" && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab("private")}
              >
                <Lock
                  size={16}
                  color={
                    activeTab === "private"
                      ? colors.dark.primary
                      : colors.dark.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "private" && styles.activeTabText,
                  ]}
                >
                  Private
                </Text>
              </TouchableOpacity>
            </View>

            {/* AI Features Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Bot size={20} color={colors.dark.primary} />
                  <Text style={styles.sectionTitle}>AI-Powered Features</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={aiFeatures}
                renderItem={renderAIFeatureItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.aiFeaturesList}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <TrendingUp size={20} color={colors.dark.primary} />
                  <Text style={styles.sectionTitle}>Trending Now</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={trendingRecordings}
                renderItem={renderTrendingItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>

            <View style={styles.upgradeContainer}>
              <LinearGradient
                colors={
                  currentTier === "ultimate"
                    ? [colors.dark.primary, "#FFD700"] // Gold gradient for Ultimate
                    : currentTier === "premium"
                    ? [colors.dark.primary, colors.dark.secondary]
                    : currentTier === "web3"
                    ? ["#4E7BFF", colors.dark.primary] // Blue gradient for Web3
                    : [colors.dark.primary, colors.dark.secondary] // Default for Free
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeContent}>
                  {currentTier === "ultimate" ? (
                    // Ultimate tier - show celebration
                    <>
                      <View style={styles.ultimateBadge}>
                        <Crown size={20} color="#FFD700" />
                        <Text style={styles.ultimateTitle}>Ultimate Member</Text>
                      </View>
                      <Text style={styles.upgradeDescription}>
                        You have access to all AI and Web3 features!
                      </Text>
                      <TouchableOpacity style={styles.upgradeButton}>
                        <Text style={styles.upgradeButtonText}>Explore Features</Text>
                      </TouchableOpacity>
                    </>
                  ) : currentTier === "premium" ? (
                    // Premium tier - show Web3 upgrade
                    <>
                      <View style={styles.tierBadge}>
                        <Sparkles size={20} color={colors.dark.primary} />
                        <Text style={styles.upgradeTitle}>Premium Member</Text>
                      </View>
                      <Text style={styles.upgradeDescription}>
                        Connect your Base wallet to unlock Web3 features and Web3 capabilities
                      </Text>
                      <TouchableOpacity style={styles.upgradeButton}>
                        <Wallet size={16} color={colors.dark.text} />
                        <Text style={styles.upgradeButtonText}>Connect Wallet</Text>
                      </TouchableOpacity>
                    </>
                  ) : currentTier === "web3" ? (
                    // Web3 tier - show subscription upgrade
                    <>
                      <View style={styles.tierBadge}>
                        <Wallet size={20} color="#4E7BFF" />
                        <Text style={styles.upgradeTitle}>Web3 Member</Text>
                      </View>
                      <Text style={styles.upgradeDescription}>
                        {capabilities.remainingAIUses !== null 
                          ? `${capabilities.remainingAIUses} AI uses remaining today. Upgrade to Premium for unlimited access!`
                          : "Subscribe to Premium for unlimited AI features and Ultimate tier benefits"
                        }
                      </Text>
                      <TouchableOpacity style={styles.upgradeButton}>
                        <Crown size={16} color={colors.dark.text} />
                        <Text style={styles.upgradeButtonText}>Subscribe to Premium</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Free tier - show dual-path options
                    <>
                      <Text style={styles.upgradeTitle}>Choose Your Path</Text>
                      <Text style={styles.upgradeDescription}>
                        Unlock AI features with Premium or Web3 features with Base wallet
                      </Text>
                      <View style={styles.dualPathButtons}>
                        <TouchableOpacity style={[styles.upgradeButton, styles.upgradeButtonPrimary]}>
                          <Sparkles size={16} color={colors.dark.text} />
                          <Text style={styles.upgradeButtonText}>Subscribe</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.upgradeButton, styles.upgradeButtonSecondary]}>
                          <Wallet size={16} color={colors.dark.primary} />
                          <Text style={[styles.upgradeButtonText, styles.upgradeButtonTextSecondary]}>Connect Wallet</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* Snippets Explanation */}
            <View style={styles.snippetsContainer}>
              <View style={styles.snippetsHeader}>
                <Scissors size={24} color={colors.dark.primary} />
                <Text style={styles.snippetsTitle}>VOISSS Snippets</Text>
              </View>
              <Text style={styles.snippetsDescription}>
                The audio version of Instagram Stories. Create and share
                bite-sized audio content up to 3 minutes long.
              </Text>

              <View style={styles.snippetsFeatures}>
                <View style={styles.snippetsFeatureItem}>
                  <Clock size={20} color={colors.dark.primary} />
                  <Text style={styles.snippetsFeatureText}>
                    Short & Engaging
                  </Text>
                </View>
                <View style={styles.snippetsFeatureItem}>
                  <Scissors size={20} color={colors.dark.primary} />
                  <Text style={styles.snippetsFeatureText}>AI Auto-Cut</Text>
                </View>
                <View style={styles.snippetsFeatureItem}>
                  <Share2 size={20} color={colors.dark.primary} />
                  <Text style={styles.snippetsFeatureText}>Easy Sharing</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.createSnippetButton}>
                <Text style={styles.createSnippetButtonText}>
                  Create Your First Snippet
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case "community":
        return (
          <>
            <View style={styles.communityHeader}>
              <Text style={styles.communityHeaderTitle}>Communities</Text>
              <Text style={styles.communityHeaderSubtitle}>
                Join voice communities and share your recordings with
                like-minded people
              </Text>

              <TouchableOpacity style={styles.createCommunityButton}>
                <Users size={16} color={colors.dark.text} />
                <Text style={styles.createCommunityButtonText}>
                  Create Community
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <TrendingUp size={20} color={colors.dark.primary} />
                  <Text style={styles.sectionTitle}>Popular Communities</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={communities}
                renderItem={renderCommunityItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.communitiesContainer}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Users size={20} color={colors.dark.primary} />
                  <Text style={styles.sectionTitle}>Your Communities</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={communities.slice(0, 2)}
                renderItem={renderCommunityItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.communitiesContainer}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <TrendingUp size={20} color={colors.dark.primary} />
                  <Text style={styles.sectionTitle}>Recommended For You</Text>
                </View>
              </View>

              <FlatList
                data={communities.slice(2)}
                renderItem={renderCommunityItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.communitiesContainer}
              />
            </View>
          </>
        );

      case "leaderboard":
        return (
          <>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.leaderboardHeaderTitle}>Leaderboard</Text>
              <Text style={styles.leaderboardHeaderSubtitle}>
                Top contributors in the VOISSS community
              </Text>

              <View style={styles.leaderboardTabs}>
                <TouchableOpacity
                  style={[styles.leaderboardTab, styles.leaderboardTabActive]}
                >
                  <Text style={styles.leaderboardTabTextActive}>Global</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.leaderboardTab}>
                  <Text style={styles.leaderboardTabText}>Friends</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.leaderboardTab}>
                  <Text style={styles.leaderboardTabText}>Communities</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.leaderboardTopUsers}>
              {leaderboard.slice(0, 3).map((user, index) => (
                <View
                  key={user.id}
                  style={[
                    styles.leaderboardTopUser,
                    index === 1 ? styles.leaderboardFirstPlace : null,
                  ]}
                >
                  <View
                    style={[
                      styles.leaderboardTopUserRank,
                      {
                        backgroundColor:
                          index === 0
                            ? "#C0C0C0"
                            : index === 1
                            ? "#FFD700"
                            : "#CD7F32",
                      },
                    ]}
                  >
                    <Text style={styles.leaderboardTopUserRankText}>
                      {user.rank}
                    </Text>
                  </View>
                  <Image
                    source={{ uri: user.avatar }}
                    style={styles.leaderboardTopUserAvatar}
                  />
                  <Text style={styles.leaderboardTopUserName}>{user.name}</Text>
                  <Text style={styles.leaderboardTopUserPoints}>
                    {user.points.toLocaleString()} pts
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.leaderboardList}>
              <Text style={styles.leaderboardListTitle}>Rankings</Text>
              {leaderboard.map((user, index) => (
                <View key={user.id} style={styles.leaderboardListItem}>
                  {renderLeaderboardItem({ item: user, index })}
                </View>
              ))}
            </View>

            <View style={styles.yourRankContainer}>
              <Text style={styles.yourRankTitle}>Your Rank</Text>
              <View style={styles.yourRank}>
                <Text style={styles.yourRankNumber}>#42</Text>
                <Text style={styles.yourRankPoints}>3,245 points</Text>
                <Text style={styles.yourRankToNext}>
                  1,255 points to next rank
                </Text>
              </View>
            </View>
          </>
        );

      case "challenges":
        return (
          <>
            <View style={styles.challengesHeader}>
              <Text style={styles.challengesHeaderTitle}>Missions</Text>
              <Text style={styles.challengesHeaderSubtitle}>
                Record authentic conversations and earn STRK tokens
              </Text>
            </View>

            {loadingMissions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.dark.primary} />
                <Text style={styles.loadingText}>Loading missions...</Text>
              </View>
            ) : missionError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{missionError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadMissions}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Mission Stats */}
                <View style={styles.missionStatsContainer}>
                  <View style={styles.missionStatCard}>
                    <Text style={styles.missionStatValue}>{missions.length}</Text>
                    <Text style={styles.missionStatLabel}>Active</Text>
                  </View>
                  <View style={styles.missionStatCard}>
                    <Text style={[styles.missionStatValue, { color: colors.dark.primary }]}>
                      {missions.reduce((sum, m) => sum + m.reward, 0)}
                    </Text>
                    <Text style={styles.missionStatLabel}>STRK</Text>
                  </View>
                  <View style={styles.missionStatCard}>
                    <Text style={[styles.missionStatValue, { color: colors.dark.success || "#4CAF50" }]}>
                      {missions.reduce((sum, m) => sum + m.currentParticipants, 0)}
                    </Text>
                    <Text style={styles.missionStatLabel}>Participants</Text>
                  </View>
                </View>

                {/* Active Missions */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <Target size={20} color={colors.dark.primary} />
                      <Text style={styles.sectionTitle}>Active Missions</Text>
                    </View>
                    <TouchableOpacity onPress={loadMissions}>
                      <Text style={styles.seeAllText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>

                  {missions.length === 0 ? (
                    <View style={styles.emptyMissionsContainer}>
                      <Text style={styles.emptyMissionsText}>
                        No active missions available
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={missions}
                      renderItem={({ item }) => (
                        <View style={styles.missionCard}>
                          <View style={styles.missionHeader}>
                            <View style={styles.missionTopicBadge}>
                              <Text style={styles.missionTopicEmoji}>
                                {getMissionIcon(item.topic)}
                              </Text>
                              <Text style={styles.missionTopicText}>
                                {item.topic}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.missionDifficultyBadge,
                                { backgroundColor: `${getDifficultyColor(item.difficulty)}20` }
                              ]}
                            >
                              <Text
                                style={[
                                  styles.missionDifficultyText,
                                  { color: getDifficultyColor(item.difficulty) }
                                ]}
                              >
                                {item.difficulty}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.missionTitle}>{item.title}</Text>
                          <Text style={styles.missionDescription} numberOfLines={2}>
                            {item.description}
                          </Text>

                          <View style={styles.missionMeta}>
                            <View style={styles.missionMetaItem}>
                              <Award size={14} color={colors.dark.primary} />
                              <Text style={styles.missionMetaText}>
                                {item.reward} STRK
                              </Text>
                            </View>
                            <View style={styles.missionMetaItem}>
                              <Users size={14} color={colors.dark.textSecondary} />
                              <Text style={styles.missionMetaText}>
                                {item.currentParticipants}/{item.maxParticipants || '∞'}
                              </Text>
                            </View>
                            <View style={styles.missionMetaItem}>
                              <Clock size={14} color={colors.dark.textSecondary} />
                              <Text style={styles.missionMetaText}>
                                {Math.ceil((item.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left
                              </Text>
                            </View>
                            {item.locationBased && (
                              <View style={styles.missionMetaItem}>
                                <MapPin size={14} color={colors.dark.warning || "#FFC107"} />
                              </View>
                            )}
                          </View>

                          <TouchableOpacity
                            style={styles.missionAcceptButton}
                            onPress={() => {
                              // Navigate to record tab with mission context
                              router.push({
                                pathname: "/tabs/record",
                                params: { missionId: item.id }
                              });
                            }}
                          >
                            <Text style={styles.missionAcceptButtonText}>
                              Accept Mission
                            </Text>
                            <ArrowRight size={16} color={colors.dark.text} />
                          </TouchableOpacity>
                        </View>
                      )}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                  )}
                </View>
              </>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={["bottom"]}>
      <View style={styles.container}>
        {/* Top Navigation - Duolingo Style */}
        <View style={styles.topNavContainer}>
          {topNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTopNav === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.topNavButton}
                onPress={() => setActiveTopNav(item.id)}
              >
                <View
                  style={[
                    styles.topNavIconContainer,
                    isActive && styles.topNavIconContainerActive,
                  ]}
                >
                  <IconComponent
                    size={24}
                    color={
                      isActive ? colors.dark.primary : colors.dark.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.topNavLabel,
                    isActive && styles.topNavLabelActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={styles.content}>{renderContent()}</ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
  },
  topNavContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  topNavButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  topNavIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  topNavIconContainerActive: {
    backgroundColor: `${colors.dark.primary}20`,
  },
  topNavLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  topNavLabelActive: {
    color: colors.dark.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  brandHeader: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  brandName: {
    fontSize: 42,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  brandTagline: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.primary,
    marginBottom: theme.spacing.lg,
  },
  ctaContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  ctaButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.dark.primary,
  },
  ctaButtonText: {
    color: colors.dark.text,
    fontWeight: "600",
  },
  ctaButtonTextSecondary: {
    color: colors.dark.primary,
    fontWeight: "600",
  },
  sharingTabs: {
    flexDirection: "row",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.dark.primary,
  },
  tabText: {
    color: colors.dark.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: colors.dark.primary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.text,
    marginLeft: theme.spacing.sm,
  },
  seeAllText: {
    color: colors.dark.primary,
    fontWeight: "500",
  },
  trendingItem: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  trendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark.text,
  },
  recordingTitle: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 40,
    marginBottom: theme.spacing.sm,
  },
  waveformBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: theme.borderRadius.sm,
  },
  recordingMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  durationContainer: {
    backgroundColor: colors.dark.cardAlt,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  duration: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: theme.spacing.md,
  },
  statText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginLeft: 4,
  },
  shareButton: {
    marginLeft: theme.spacing.md,
  },
  communitiesContainer: {
    paddingBottom: theme.spacing.sm,
  },
  communityItem: {
    width: 160,
    height: 100,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
    overflow: "hidden",
  },
  communityImage: {
    width: "100%",
    height: "100%",
  },
  communityGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
  },
  communityInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
  },
  communityName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark.text,
  },
  communityMembers: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  upgradeContainer: {
    marginBottom: theme.spacing.xl,
  },
  upgradeGradient: {
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  upgradeContent: {
    padding: theme.spacing.lg,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  upgradeDescription: {
    fontSize: 14,
    color: colors.dark.text,
    opacity: 0.8,
    marginBottom: theme.spacing.md,
  },
  upgradeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: "flex-start",
  },
  upgradeButtonText: {
    color: colors.dark.text,
    fontWeight: "600",
  },

  // Community screen styles
  communityHeader: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  communityHeaderTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  communityHeaderSubtitle: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  createCommunityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  createCommunityButtonText: {
    color: colors.dark.text,
    fontWeight: "600",
  },

  // Leaderboard screen styles
  leaderboardHeader: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  leaderboardHeaderTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  leaderboardHeaderSubtitle: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  leaderboardTabs: {
    flexDirection: "row",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    padding: 4,
  },
  leaderboardTab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  leaderboardTabActive: {
    backgroundColor: colors.dark.primary,
  },
  leaderboardTabText: {
    color: colors.dark.textSecondary,
  },
  leaderboardTabTextActive: {
    color: colors.dark.text,
    fontWeight: "600",
  },
  leaderboardTopUsers: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  leaderboardTopUser: {
    alignItems: "center",
    marginHorizontal: theme.spacing.md,
  },
  leaderboardFirstPlace: {
    marginBottom: -20,
  },
  leaderboardTopUserRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  leaderboardTopUserRankText: {
    color: colors.dark.background,
    fontWeight: "700",
  },
  leaderboardTopUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.dark.primary,
    marginBottom: theme.spacing.xs,
  },
  leaderboardTopUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 2,
  },
  leaderboardTopUserPoints: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  leaderboardList: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  leaderboardListTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.md,
  },
  leaderboardListItem: {
    marginBottom: theme.spacing.md,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaderboardRank: {
    width: 30,
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark.textSecondary,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  leaderboardUserInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
  },
  leaderboardPoints: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  leaderboardBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  yourRankContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  yourRankTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.md,
  },
  yourRank: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  yourRankNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark.primary,
  },
  yourRankPoints: {
    fontSize: 16,
    color: colors.dark.text,
  },
  yourRankToNext: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },

  // Challenges screen styles
  challengesHeader: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  challengesHeaderTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  challengesHeaderSubtitle: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  challengesContainer: {
    paddingBottom: theme.spacing.sm,
  },
  challengeItem: {
    width: 280,
    height: 160,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
    overflow: "hidden",
  },
  challengeImage: {
    width: "100%",
    height: "100%",
  },
  challengeGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
  },
  challengeInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: colors.dark.text,
    opacity: 0.9,
    marginBottom: theme.spacing.sm,
  },
  challengeMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  challengeParticipants: {
    fontSize: 12,
    color: colors.dark.text,
    opacity: 0.8,
  },
  challengeDaysLeft: {
    fontSize: 12,
    color: colors.dark.warning,
    fontWeight: "600",
  },
  challengeReward: {
    flexDirection: "row",
    alignItems: "center",
  },
  challengeRewardText: {
    fontSize: 12,
    color: colors.dark.warning,
    fontWeight: "600",
    marginLeft: 4,
  },
  challengeProgressItem: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  challengeProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  challengeProgressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
  },
  challengeProgressDays: {
    fontSize: 14,
    color: colors.dark.primary,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.dark.cardAlt,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.dark.primary,
    borderRadius: theme.borderRadius.full,
  },
  challengeProgressReward: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  completedChallengesContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  completedChallengesText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.sm,
  },
  completedChallengesPoints: {
    fontSize: 18,
    color: colors.dark.primary,
    fontWeight: "700",
  },

  // AI Features styles
  aiFeaturesList: {
    paddingBottom: theme.spacing.sm,
  },
  aiFeatureItem: {
    width: 200,
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  aiFeatureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  aiFeatureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  aiFeatureDescription: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    lineHeight: 20,
  },

  // Snippets section
  snippetsContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  snippetsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  snippetsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark.text,
    marginLeft: theme.spacing.sm,
  },
  snippetsDescription: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  snippetsFeatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  snippetsFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  snippetsFeatureText: {
    fontSize: 14,
    color: colors.dark.text,
    marginLeft: theme.spacing.xs,
  },
  createSnippetButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  createSnippetButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: "600",
  },
  // Mission styles
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  errorText: {
    color: colors.dark.error || "#FF5252",
    fontSize: 14,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: colors.dark.text,
    fontWeight: "600",
  },
  missionStatsContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  missionStatCard: {
    flex: 1,
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  missionStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: 4,
  },
  missionStatLabel: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  emptyMissionsContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyMissionsText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  missionCard: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  missionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  missionTopicBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.dark.primary}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  missionTopicEmoji: {
    fontSize: 14,
  },
  missionTopicText: {
    fontSize: 12,
    color: colors.dark.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  missionDifficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  missionDifficultyText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  missionDescription: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  missionMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  missionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  missionMetaText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  missionAcceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dark.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  missionAcceptButtonText: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: "600",
  },
  // Dual-path upgrade styles
  ultimateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  ultimateTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 93, 250, 0.2)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  dualPathButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  upgradeButtonPrimary: {
    flex: 1,
    backgroundColor: colors.dark.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  upgradeButtonSecondary: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.dark.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  upgradeButtonTextSecondary: {
    color: colors.dark.primary,
    fontWeight: "600",
  },
});

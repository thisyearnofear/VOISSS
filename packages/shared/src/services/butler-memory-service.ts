/**
 * Butler Memory Service - Personalized Agent Experience
 *
 * Uses Arkiv Braga Testnet to store user preferences, voice history,
 * and interaction patterns. Enables the Butler to:
 * - Remember user's favorite voices and styles
 * - Track usage patterns and suggest optimizations
 * - Provide proactive recommendations based on context
 * - Maintain conversation history across sessions
 */

import { createWalletClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

const PROJECT_ATTRIBUTE = "voisss-butler-memory";
const EXPIRY_MEMORY = ExpirationTime.fromDays(180); // 6 months

export interface ButlerUserPreference {
  userId: string;
  walletAddress: string;
  favoriteVoices: string[];
  preferredStyles: string[];
  defaultLanguage: string;
  usageCount: number;
  totalRecordings: number;
  lastInteraction: number;
  context: {
    useCase?: string; // e.g., "podcast", "commercial", "narration"
    tone?: string; // e.g., "professional", "casual", "energetic"
    audience?: string; // e.g., "enterprise", "consumer", "children"
  };
}

export interface ButlerConversationMemory {
  userId: string;
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    context?: {
      recordingId?: string;
      voiceId?: string;
      action?: string;
    };
  }>;
  summary: string;
  actionItems: string[];
  createdAt: number;
  expiresAt: number;
}

export interface VoiceRecommendation {
  voiceId: string;
  voiceName: string;
  score: number; // 0-100 relevance
  reason: string;
  useCase: string;
}

export interface ButlerMemoryQuery {
  userId?: string;
  walletAddress?: string;
  limit?: number;
  since?: number;
}

function getWalletClient() {
  const privateKey =
    process.env.ARKIV_PRIVATE_KEY || process.env.NEXT_PUBLIC_ARKIV_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "ARKIV_PRIVATE_KEY not configured. Add it to .env.local to enable Butler memory."
    );
  }
  if (!privateKey.startsWith("0x")) {
    throw new Error("ARKIV_PRIVATE_KEY must be a hex string starting with 0x");
  }
  return createWalletClient({
    chain: braga,
    transport: http(),
    account: privateKeyToAccount(privateKey as `0x${string}`),
  });
}

/**
 * Save or update user preferences to Arkiv
 */
export async function saveUserPreferences(
  preferences: ButlerUserPreference
): Promise<{ success: boolean; entityId?: string; error?: string }> {
  try {
    const client = getWalletClient();
    const now = Date.now();

    const attributes = [
      { key: "project", value: PROJECT_ATTRIBUTE },
      { key: "type", value: "butler-preference" },
      { key: "userId", value: preferences.userId },
      { key: "walletAddress", value: preferences.walletAddress },
      { key: "favoriteVoices", value: JSON.stringify(preferences.favoriteVoices) },
      { key: "preferredStyles", value: JSON.stringify(preferences.preferredStyles) },
      { key: "defaultLanguage", value: preferences.defaultLanguage },
      { key: "usageCount", value: preferences.usageCount },
      { key: "totalRecordings", value: preferences.totalRecordings },
      { key: "lastInteraction", value: now },
      { key: "context", value: JSON.stringify(preferences.context) },
      { key: "createdAt", value: now },
    ];

    const result = await client.writeEntities({
      metadata: {
        collection: "butler-preferences",
        name: `pref-${preferences.userId}-${now}`,
        description: `Butler preferences for ${preferences.userId}`,
      },
      attributes,
      json: preferences,
      expirationTime: EXPIRY_MEMORY,
    });

    // Transfer ownership to user
    if (result.entities && result.entities.length > 0) {
      await client.mutateEntities({
        entityIds: result.entities.map((e: any) => e.id),
        owner: preferences.walletAddress as `0x${string}`,
      });
    }

    return { success: true, entityId: result.entities?.[0]?.id };
  } catch (error) {
    console.error("Failed to save user preferences:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Retrieve user preferences from Arkiv
 */
export async function getUserPreferences(
  query: ButlerMemoryQuery
): Promise<ButlerUserPreference | null> {
  try {
    // This would use the Arkiv query API
    // For now, return a mock structure
    // In production, implement proper Arkiv read queries

    if (!query.userId && !query.walletAddress) {
      throw new Error("Must provide userId or walletAddress");
    }

    // TODO: Implement actual Arkiv query
    // const client = getPublicClient();
    // const entities = await client.readEntities({
    //   filter: {
    //     project: PROJECT_ATTRIBUTE,
    //     type: "butler-preference",
    //     [query.userId ? "userId" : "walletAddress"]: query.userId || query.walletAddress,
    //   },
    //   limit: 1,
    //   orderBy: "createdAt",
    //   orderDirection: "desc",
    // });

    return null; // Return null if no preferences found
  } catch (error) {
    console.error("Failed to retrieve user preferences:", error);
    return null;
  }
}

/**
 * Save conversation memory to Arkiv
 */
export async function saveConversationMemory(
  memory: ButlerConversationMemory
): Promise<{ success: boolean; entityId?: string; error?: string }> {
  try {
    const client = getWalletClient();
    const now = Date.now();

    const attributes = [
      { key: "project", value: PROJECT_ATTRIBUTE },
      { key: "type", value: "conversation-memory" },
      { key: "userId", value: memory.userId },
      { key: "sessionId", value: memory.sessionId },
      { key: "messageCount", value: memory.messages.length },
      { key: "summary", value: memory.summary },
      { key: "actionItems", value: JSON.stringify(memory.actionItems) },
      { key: "createdAt", value: now },
    ];

    const result = await client.writeEntities({
      metadata: {
        collection: "butler-conversations",
        name: `conv-${memory.sessionId}`,
        description: `Conversation memory for session ${memory.sessionId}`,
      },
      attributes,
      json: memory,
      expirationTime: EXPIRY_MEMORY,
    });

    return { success: true, entityId: result.entities?.[0]?.id };
  } catch (error) {
    console.error("Failed to save conversation memory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate personalized voice recommendations based on user history
 */
export async function getVoiceRecommendations(
  preferences: ButlerUserPreference,
  availableVoices: Array<{ id: string; name: string; tags: string[] }>
): Promise<VoiceRecommendation[]> {
  const recommendations: VoiceRecommendation[] = [];

  // Score each voice based on user preferences
  for (const voice of availableVoices) {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Boost if in favorites
    if (preferences.favoriteVoices.includes(voice.id)) {
      score += 30;
      reasons.push("favorite voice");
    }

    // Boost if matches preferred styles
    const matchingStyles = voice.tags.filter(tag =>
      preferences.preferredStyles.includes(tag)
    );
    if (matchingStyles.length > 0) {
      score += matchingStyles.length * 10;
      reasons.push(`matches ${matchingStyles.join(", ")}`);
    }

    // Boost if matches use case context
    if (preferences.context.useCase && voice.tags.includes(preferences.context.useCase)) {
      score += 15;
      reasons.push(`ideal for ${preferences.context.useCase}`);
    }

    // Boost if matches tone
    if (preferences.context.tone && voice.tags.includes(preferences.context.tone)) {
      score += 10;
      reasons.push(`${preferences.context.tone} tone`);
    }

    // Cap score at 100
    score = Math.min(score, 100);

    if (score >= 60) { // Only recommend if score is good
      recommendations.push({
        voiceId: voice.id,
        voiceName: voice.name,
        score,
        reason: reasons.join(", "),
        useCase: preferences.context.useCase || "general",
      });
    }
  }

  // Sort by score and return top 3
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Generate proactive Butler suggestions based on user context
 */
export function getProactiveSuggestions(
  preferences: ButlerUserPreference,
  recentActivity?: {
    lastRecordingId?: string;
    lastVoiceId?: string;
    timeSinceLastInteraction?: number;
  }
): string[] {
  const suggestions: string[] = [];

  // Suggest based on usage patterns
  if (preferences.usageCount > 10) {
    suggestions.push("You're a power user! Want to explore premium voice cloning?");
  }

  // Suggest based on time since last interaction
  if (recentActivity?.timeSinceLastInteraction) {
    const hours = recentActivity.timeSinceLastInteraction / (1000 * 60 * 60);
    if (hours > 24 && hours < 72) {
      suggestions.push("Welcome back! Ready to create something amazing?");
    } else if (hours > 72) {
      suggestions.push("It's been a while! Let me show you what's new.");
    }
  }

  // Suggest based on favorite voices
  if (preferences.favoriteVoices.length > 0) {
    suggestions.push(`Want to try a variation of your favorite voice?`);
  }

  // Suggest Arkiv integration
  if (preferences.totalRecordings > 5) {
    suggestions.push("You have great content! Want to publish it to the Arkiv memory vault?");
  }

  // Suggest based on context
  if (preferences.context.useCase === "podcast") {
    suggestions.push("Need help with podcast intro/outro music?");
  } else if (preferences.context.useCase === "commercial") {
    suggestions.push("Want to A/B test different voice styles for your ad?");
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

/**
 * Update preferences after a voice generation
 */
export async function trackVoiceUsage(
  userId: string,
  walletAddress: string,
  voiceId: string,
  recordingId: string
): Promise<void> {
  try {
    const existing = await getUserPreferences({ userId, walletAddress });

    const updated: ButlerUserPreference = existing || {
      userId,
      walletAddress,
      favoriteVoices: [],
      preferredStyles: [],
      defaultLanguage: "en",
      usageCount: 0,
      totalRecordings: 0,
      lastInteraction: Date.now(),
      context: {},
    };

    // Update stats
    updated.usageCount += 1;
    updated.totalRecordings += 1;
    updated.lastInteraction = Date.now();

    // Add to favorites if used 3+ times
    const voiceUsageCount = updated.favoriteVoices.filter(v => v === voiceId).length;
    if (voiceUsageCount >= 2 && !updated.favoriteVoices.includes(voiceId)) {
      updated.favoriteVoices.push(voiceId);
    }

    await saveUserPreferences(updated);
  } catch (error) {
    console.error("Failed to track voice usage:", error);
  }
}

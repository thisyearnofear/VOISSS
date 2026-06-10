/**
 * Butler Memory Service - Personalized Agent Experience
 *
 * Uses Arkiv Braga Testnet to store user preferences, voice history,
 * and interaction patterns.
 */

import { createWalletClient, createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";

const PROJECT_ATTRIBUTE = "voisss-butler-memory";
const EXPIRY_MEMORY = ExpirationTime.fromDays(180);

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
    useCase?: string;
    tone?: string;
    audience?: string;
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
  score: number;
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
  const privateKey = process.env.ARKIV_PRIVATE_KEY;
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

function getPublicClient() {
  return createPublicClient({
    chain: braga,
    transport: http(),
  });
}

function buildCreateParams(jsonData: object, entityType: string, userId: string) {
  return {
    payload: jsonToPayload(jsonData),
    contentType: "application/json" as const,
    attributes: [
      { key: "project", value: PROJECT_ATTRIBUTE },
      { key: "type", value: entityType },
      { key: "userId", value: userId },
    ],
    expiresIn: EXPIRY_MEMORY,
  };
}

export async function saveUserPreferences(
  preferences: ButlerUserPreference
): Promise<{ success: boolean; entityId?: string; error?: string }> {
  try {
    const client = getWalletClient();

    const result = await client.mutateEntities({
      creates: [buildCreateParams(preferences, "butler-preference", preferences.userId)],
      ownershipChanges: [],
    });

    const entityKey = result.createdEntities?.[0];

    if (entityKey) {
      await client.changeOwnership({
        entityKey,
        newOwner: preferences.walletAddress as `0x${string}`,
      });
    }

    return { success: true, entityId: entityKey };
  } catch (error) {
    console.error("Failed to save user preferences:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserPreferences(
  query: ButlerMemoryQuery
): Promise<ButlerUserPreference | null> {
  try {
    if (!query.userId && !query.walletAddress) {
      throw new Error("Must provide userId or walletAddress");
    }

    const client = getPublicClient();
    const q = client.buildQuery();

    q.where(eq("project", PROJECT_ATTRIBUTE));
    q.where(eq("type", "butler-preference"));
    q.withPayload(true);
    q.limit(10);

    const result = await q.fetch();
    const entities = result.entities || [];

    for (const entity of entities) {
      const payload = entity.toJson();
      if (!payload) continue;
      const pref = payload as ButlerUserPreference;

      if (query.userId && pref.userId === query.userId) return pref;
      if (query.walletAddress && pref.walletAddress === query.walletAddress) return pref;
    }

    return null;
  } catch (error) {
    console.error("Failed to retrieve user preferences:", error);
    return null;
  }
}

export async function saveConversationMemory(
  memory: ButlerConversationMemory
): Promise<{ success: boolean; entityId?: string; error?: string }> {
  try {
    const client = getWalletClient();

    const result = await client.mutateEntities({
      creates: [buildCreateParams(memory, "conversation-memory", memory.userId)],
    });

    return { success: true, entityId: result.createdEntities?.[0] };
  } catch (error) {
    console.error("Failed to save conversation memory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getVoiceRecommendations(
  preferences: ButlerUserPreference,
  availableVoices: Array<{ id: string; name: string; tags: string[] }>
): Promise<VoiceRecommendation[]> {
  const recommendations: VoiceRecommendation[] = [];

  for (const voice of availableVoices) {
    let score = 50;
    const reasons: string[] = [];

    if (preferences.favoriteVoices.includes(voice.id)) {
      score += 30;
      reasons.push("favorite voice");
    }

    const matchingStyles = voice.tags.filter(tag =>
      preferences.preferredStyles.includes(tag)
    );
    if (matchingStyles.length > 0) {
      score += matchingStyles.length * 10;
      reasons.push(`matches ${matchingStyles.join(", ")}`);
    }

    if (preferences.context.useCase && voice.tags.includes(preferences.context.useCase)) {
      score += 15;
      reasons.push(`ideal for ${preferences.context.useCase}`);
    }

    if (preferences.context.tone && voice.tags.includes(preferences.context.tone)) {
      score += 10;
      reasons.push(`${preferences.context.tone} tone`);
    }

    score = Math.min(score, 100);

    if (score >= 60) {
      recommendations.push({
        voiceId: voice.id,
        voiceName: voice.name,
        score,
        reason: reasons.join(", "),
        useCase: preferences.context.useCase || "general",
      });
    }
  }

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function getProactiveSuggestions(
  preferences: ButlerUserPreference,
  recentActivity?: {
    lastRecordingId?: string;
    lastVoiceId?: string;
    timeSinceLastInteraction?: number;
  }
): string[] {
  const suggestions: string[] = [];

  if (preferences.usageCount > 10) {
    suggestions.push("You're a power user! Want to explore premium voice cloning?");
  }

  if (recentActivity?.timeSinceLastInteraction) {
    const hours = recentActivity.timeSinceLastInteraction / (1000 * 60 * 60);
    if (hours > 24 && hours < 72) {
      suggestions.push("Welcome back! Ready to create something amazing?");
    } else if (hours > 72) {
      suggestions.push("It's been a while! Let me show you what's new.");
    }
  }

  if (preferences.favoriteVoices.length > 0) {
    suggestions.push("Want to try a variation of your favorite voice?");
  }

  if (preferences.totalRecordings > 5) {
    suggestions.push("You have great content! Want to publish it to the Arkiv memory vault?");
  }

  if (preferences.context.useCase === "podcast") {
    suggestions.push("Need help with podcast intro/outro music?");
  } else if (preferences.context.useCase === "commercial") {
    suggestions.push("Want to A/B test different voice styles for your ad?");
  }

  return suggestions.slice(0, 3);
}

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

    updated.usageCount += 1;
    updated.totalRecordings += 1;
    updated.lastInteraction = Date.now();

    const voiceUsageCount = updated.favoriteVoices.filter(v => v === voiceId).length;
    if (voiceUsageCount >= 2 && !updated.favoriteVoices.includes(voiceId)) {
      updated.favoriteVoices.push(voiceId);
    }

    await saveUserPreferences(updated);
  } catch (error) {
    console.error("Failed to track voice usage:", error);
  }
}

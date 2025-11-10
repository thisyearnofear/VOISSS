// Conditional import to avoid Node.js SDK in browser
const NeynarAPIClient = typeof window === 'undefined' 
  ? require('@neynar/nodejs-sdk').NeynarAPIClient 
  : null;

interface FarcasterConfig {
  apiKey: string;
  signerUuid?: string;
}

interface MemoryProtocolConfig {
  apiKey: string;
  endpoint: string;
}

interface SocialContext {
  fid?: number;
  username?: string;
  pfpUrl?: string;
  followerCount?: number;
  followingCount?: number;
}

interface VoiceMemory {
  id: string;
  content: string;
  metadata: {
    duration: number;
    topic: string;
    location?: string;
    sentiment?: string;
  };
  timestamp: Date;
}

export class FarcasterSocialService {
  private neynar: NeynarAPIClient;
  private memoryEndpoint: string;
  private memoryApiKey: string;

  constructor(farcasterConfig: FarcasterConfig, memoryConfig: MemoryProtocolConfig) {
    // Only initialize Neynar client on server side
    if (typeof window === 'undefined' && NeynarAPIClient) {
      this.neynar = new NeynarAPIClient(farcasterConfig.apiKey);
    }
    this.memoryEndpoint = memoryConfig.endpoint;
    this.memoryApiKey = memoryConfig.apiKey;
  }

  // Farcaster Integration
  async getUserContext(fid: number): Promise<SocialContext> {
    // Browser fallback - return basic context
    if (typeof window !== 'undefined' || !this.neynar) {
      return { fid };
    }
    
    try {
      const user = await this.neynar.lookupUserByFid(fid);
      return {
        fid: user.fid,
        username: user.username,
        pfpUrl: user.pfp_url,
        followerCount: user.follower_count,
        followingCount: user.following_count,
      };
    } catch (error) {
      console.error('Failed to fetch user context:', error);
      return { fid };
    }
  }

  async shareToFarcaster(recordingId: string, text: string, fid: number): Promise<boolean> {
    // Browser fallback - cannot publish from client side
    if (typeof window !== 'undefined' || !this.neynar) {
      console.warn('Farcaster sharing only available on server side');
      return false;
    }
    
    try {
      const manifestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/farcaster-miniapp/manifest?recordingId=${recordingId}`;
      const cast = await this.neynar.publishCast(
        process.env.FARCASTER_SIGNER_UUID!,
        text,
        {
          embeds: [{ url: manifestUrl }],
        }
      );
      return !!cast.hash;
    } catch (error) {
      console.error('Failed to share to Farcaster:', error);
      return false;
    }
  }

  // Memory Protocol Integration
  async storeVoiceMemory(memory: Omit<VoiceMemory, 'id' | 'timestamp'>): Promise<string> {
    try {
      const response = await fetch(`${this.memoryEndpoint}/memories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.memoryApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...memory,
          timestamp: new Date().toISOString(),
        }),
      });
      
      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Failed to store voice memory:', error);
      throw error;
    }
  }

  async getRelevantMemories(query: string, limit = 5): Promise<VoiceMemory[]> {
    try {
      const response = await fetch(`${this.memoryEndpoint}/memories/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.memoryApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to retrieve memories:', error);
      return [];
    }
  }

  // Enhanced Social Features
  async getPersonalizedFeed(fid: number): Promise<any[]> {
    try {
      const memories = await this.getRelevantMemories(`user:${fid} voice recordings`);
      const userContext = await this.getUserContext(fid);
      
      // Combine Farcaster social graph with Memory Protocol insights
      return memories.map(memory => ({
        ...memory,
        socialContext: userContext,
        relevanceScore: this.calculateRelevance(memory, userContext),
      }));
    } catch (error) {
      console.error('Failed to get personalized feed:', error);
      return [];
    }
  }

  private calculateRelevance(memory: VoiceMemory, context: SocialContext): number {
    // Simple relevance scoring based on topic, recency, and social signals
    let score = 0.5;
    
    if (memory.metadata.topic && context.fid) {
      score += 0.3; // Topic relevance
    }
    
    const daysSinceCreated = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 0.2 - daysSinceCreated * 0.01); // Recency bonus
    
    return Math.min(1, score);
  }
}

// Singleton instance
let farcasterSocialService: FarcasterSocialService | null = null;

export function createFarcasterSocialService(
  farcasterConfig: FarcasterConfig,
  memoryConfig: MemoryProtocolConfig
): FarcasterSocialService {
  if (!farcasterSocialService) {
    farcasterSocialService = new FarcasterSocialService(farcasterConfig, memoryConfig);
  }
  return farcasterSocialService;
}

export function getFarcasterSocialService(): FarcasterSocialService {
  if (!farcasterSocialService) {
    throw new Error('FarcasterSocialService not initialized. Call createFarcasterSocialService first.');
  }
  return farcasterSocialService;
}

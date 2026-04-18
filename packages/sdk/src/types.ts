/**
 * Configuration for VOISSS client
 */
export interface VoisssConfig {
  /** Base URL for VOISSS API (default: https://voisss.netlify.app) */
  apiUrl?: string;
  /** Agent's wallet address (required for payments) */
  agentAddress?: string;
  /** Network to use (default: base-mainnet) */
  network?: 'base-mainnet' | 'base-sepolia';
  /** Payment method preference */
  paymentMethod?: PaymentMethod;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Payment methods supported by VOISSS
 */
export type PaymentMethod = 'x402' | 'credits' | 'ows' | 'preview';

/**
 * Request to generate voice from text
 */
export interface VocalizeRequest {
  /** Text to convert to speech */
  text: string;
  /** Voice ID to use */
  voiceId: string;
  /** Agent's wallet address (overrides config) */
  agentAddress?: string;
  /** Preview mode (free, no payment required) */
  preview?: boolean;
  /** Optional voice generation settings */
  options?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  /** Maximum duration in milliseconds */
  maxDurationMs?: number;
}

/**
 * Response from voice generation
 */
export interface VocalizeResponse {
  success: boolean;
  data?: {
    /** URL to generated audio (IPFS or temporary) */
    audioUrl: string;
    /** Content hash for verification */
    contentHash: string;
    /** Cost in USDC (formatted) */
    cost: string;
    /** Cost in USDC wei (raw) */
    costWei: string;
    /** Base cost before discounts */
    baseCost?: string;
    /** Base cost in wei */
    baseCostWei?: string;
    /** Discount percentage applied */
    discountApplied?: number;
    /** Number of characters processed */
    characterCount: number;
    /** Payment method used */
    paymentMethod: string;
    /** Recording ID for reference */
    recordingId: string;
    /** IPFS hash (if uploaded) */
    ipfsHash?: string;
    /** Whether audio is temporarily stored */
    isTemporary?: boolean;
    /** Transaction hash (if applicable) */
    txHash?: string;
    /** Remaining credit balance */
    creditBalance?: string;
    /** Agent tier */
    tier?: string;
    /** Agent tier level */
    agentTier?: string;
    /** OWS chain used (if applicable) */
    owsChain?: string;
    /** OWS chain ID */
    owsChainId?: string;
  };
  error?: string;
  paymentRequired?: {
    amount: string;
    currency: string;
    reason: string;
  };
}

/**
 * Voice information
 */
export interface Voice {
  voiceId: string;
  name: string;
  description?: string;
  category?: string;
  previewUrl?: string;
  labels?: {
    use_case?: string;
    gender?: string;
    accent?: string;
    age?: string;
    language?: string;
    descriptive?: string;
  };
  pricing?: {
    developer: string;
    startup: string;
    enterprise: string;
  };
}

/**
 * Filter options for browsing voices
 */
export interface VoiceFilter {
  language?: string;
  gender?: 'male' | 'female' | 'neutral';
  accent?: string;
  useCase?: string;
  category?: string;
}

/**
 * Agent information and pricing
 */
export interface AgentInfo {
  agentAddress: string;
  creditBalance: string;
  creditBalanceWei: string;
  currentTier: string;
  costPerCharacter: string;
  costPerCharacterWei: string;
  sampleCost: {
    characters: number;
    baseUsdc: string;
    usdc: string;
    discountPercent: number;
    wei: string;
    formatted: string;
  };
  availablePaymentMethods: string[];
  recommendedMethod: string;
}

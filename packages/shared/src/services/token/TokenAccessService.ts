/**
 * Token Access Service
 * 
 * Consolidated service for all token-related operations following
 * DRY principle and clean architecture patterns.
 */

import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { PLATFORM_CONFIG } from '../../config/platform';
import { getTierForBalance, TokenTier } from '../../config/tokenAccess';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ type: 'address' }],
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
    },
] as const;

// RPC providers with fallbacks
const RPC_PROVIDERS = [
    process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://base-rpc.publicnode.com',
];

export interface TokenBalances {
    papajams: bigint;
    voisss: bigint;
    lastUpdated: Date;
    tier: TokenTier;
    eligibility: {
        canCreateMissions: boolean;
        canAcceptMissions: boolean;
        maxMissionsPerDay: number;
        premiumFeatures: string[];
    };
}

export interface EligibilityResult {
    eligible: boolean;
    reason?: string;
    requiredBalance?: bigint;
    currentBalance?: bigint;
    tier: TokenTier;
    recommendations?: string[];
}

export interface AccessResult {
    canAccess: boolean;
    reason?: string;
    requiredTier?: TokenTier;
    currentTier: TokenTier;
}

export interface TierBenefits {
    maxMissionsPerDay: number;
    canCreateMissions: boolean;
    premiumFeatures: string[];
    rewardMultiplier: number;
    prioritySupport: boolean;
}

// Cache interface
interface CacheEntry {
    balances: TokenBalances;
    expiresAt: number;
}

export class TokenAccessService {
    private cache = new Map<string, CacheEntry>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly MAX_RETRIES = 2;
    private readonly RPC_TIMEOUT = 10000; // 10 seconds

    /**
     * Get token balances for an address with caching
     */
    async getTokenBalances(address: string): Promise<TokenBalances> {
        // Check cache first
        const cached = this.getCachedBalance(address);
        if (cached) {
            return cached;
        }

        // Fetch fresh balances
        const balances = await this.fetchTokenBalances(address);

        // Cache the result
        this.setCachedBalance(address, balances);

        return balances;
    }

    /**
     * Validate creator eligibility (can create missions)
     */
    async validateCreatorEligibility(address: string): Promise<EligibilityResult> {
        const balances = await this.getTokenBalances(address);

        // Check $papajams requirement
        const papajamsEligible = balances.papajams >= BigInt(PLATFORM_CONFIG.creatorRequirements.minTokenBalance);

        // Check $voisss tier requirement
        const voisssEligible = balances.tier !== 'none';

        if (papajamsEligible || voisssEligible) {
            return {
                eligible: true,
                tier: balances.tier,
            };
        }

        // Not eligible - provide helpful guidance
        const papajamsRequired = BigInt(PLATFORM_CONFIG.creatorRequirements.minTokenBalance);
        const voisssRequired = BigInt('10000000000000000000000'); // 10k tokens

        return {
            eligible: false,
            reason: 'Insufficient token balance',
            requiredBalance: papajamsRequired,
            currentBalance: balances.papajams,
            tier: balances.tier,
            recommendations: [
                `Hold ${this.formatTokenAmount(papajamsRequired)} $papajams tokens, OR`,
                `Hold ${this.formatTokenAmount(voisssRequired)} $voisss tokens for Basic tier`,
                'Purchase tokens on Base chain to unlock mission creation',
            ],
        };
    }

    /**
     * Validate mission access for a user
     */
    async validateMissionAccess(address: string, mission: any): Promise<AccessResult> {
        const balances = await this.getTokenBalances(address);

        // Check if mission has tier requirements
        if (!mission.requiredTier || mission.requiredTier === 'none') {
            return {
                canAccess: true,
                currentTier: balances.tier,
            };
        }

        // Check tier hierarchy
        const tierHierarchy = ['none', 'basic', 'pro', 'premium'];
        const requiredIndex = tierHierarchy.indexOf(mission.requiredTier);
        const currentIndex = tierHierarchy.indexOf(balances.tier);

        if (currentIndex >= requiredIndex) {
            return {
                canAccess: true,
                currentTier: balances.tier,
            };
        }

        return {
            canAccess: false,
            reason: `Requires ${mission.requiredTier} tier or higher`,
            requiredTier: mission.requiredTier,
            currentTier: balances.tier,
        };
    }

    /**
     * Get cached balance if available and not expired
     */
    getCachedBalance(address: string): TokenBalances | null {
        const cached = this.cache.get(address.toLowerCase());
        if (!cached) return null;

        if (Date.now() > cached.expiresAt) {
            this.cache.delete(address.toLowerCase());
            return null;
        }

        return cached.balances;
    }

    /**
     * Refresh balances for multiple addresses
     */
    async refreshBalances(addresses: string[]): Promise<void> {
        const promises = addresses.map(address =>
            this.fetchTokenBalances(address).then(balances =>
                this.setCachedBalance(address, balances)
            ).catch(error =>
                console.warn(`Failed to refresh balance for ${address}:`, error)
            )
        );

        await Promise.allSettled(promises);
    }

    /**
     * Get user tier based on token balance
     */
    async getUserTier(address: string): Promise<TokenTier> {
        const balances = await this.getTokenBalances(address);
        return balances.tier;
    }

    /**
     * Get benefits for a specific tier
     */
    getTierBenefits(tier: TokenTier): TierBenefits {
        const benefits: Record<TokenTier, TierBenefits> = {
            none: {
                maxMissionsPerDay: 3,
                canCreateMissions: false,
                premiumFeatures: [],
                rewardMultiplier: 1.0,
                prioritySupport: false,
            },
            basic: {
                maxMissionsPerDay: 10,
                canCreateMissions: true,
                premiumFeatures: ['analytics', 'templates'],
                rewardMultiplier: 1.1,
                prioritySupport: false,
            },
            pro: {
                maxMissionsPerDay: 25,
                canCreateMissions: true,
                premiumFeatures: ['analytics', 'templates', 'bulk_operations', 'advanced_filters'],
                rewardMultiplier: 1.25,
                prioritySupport: true,
            },
            premium: {
                maxMissionsPerDay: 100,
                canCreateMissions: true,
                premiumFeatures: ['analytics', 'templates', 'bulk_operations', 'advanced_filters', 'priority_listing', 'custom_branding'],
                rewardMultiplier: 1.5,
                prioritySupport: true,
            },
        };

        return benefits[tier];
    }

    /**
     * Validate bulk eligibility for multiple addresses
     */
    async validateBulkEligibility(addresses: string[]): Promise<Record<string, EligibilityResult>> {
        const results: Record<string, EligibilityResult> = {};

        const promises = addresses.map(async (address) => {
            try {
                const eligibility = await this.validateCreatorEligibility(address);
                results[address] = eligibility;
            } catch (error) {
                results[address] = {
                    eligible: false,
                    reason: 'Failed to check eligibility',
                    tier: 'none',
                };
            }
        });

        await Promise.allSettled(promises);
        return results;
    }

    /**
     * Private method to fetch token balances from blockchain
     */
    private async fetchTokenBalances(address: string): Promise<TokenBalances> {
        const papajamsAddress = PLATFORM_CONFIG.papajamsToken.address;
        const voisssAddress = process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS as `0x${string}`;

        if (!voisssAddress) {
            throw new Error('VOISSS token address not configured');
        }

        let lastError: Error | null = null;

        // Try each RPC provider
        for (const rpcUrl of RPC_PROVIDERS) {
            for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
                try {
                    const publicClient = createPublicClient({
                        chain: base,
                        transport: http(rpcUrl, { timeout: this.RPC_TIMEOUT }),
                    });

                    const [papajamsBalance, voisssBalance] = await Promise.race([
                        Promise.all([
                            publicClient.readContract({
                                address: papajamsAddress,
                                abi: ERC20_ABI,
                                functionName: 'balanceOf',
                                args: [address as `0x${string}`],
                            }),
                            publicClient.readContract({
                                address: voisssAddress,
                                abi: ERC20_ABI,
                                functionName: 'balanceOf',
                                args: [address as `0x${string}`],
                            }),
                        ]),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('RPC timeout')), this.RPC_TIMEOUT)
                        ),
                    ]);

                    const tier = getTierForBalance(voisssBalance);
                    const benefits = this.getTierBenefits(tier);

                    return {
                        papajams: papajamsBalance,
                        voisss: voisssBalance,
                        lastUpdated: new Date(),
                        tier,
                        eligibility: {
                            canCreateMissions: benefits.canCreateMissions || papajamsBalance >= BigInt(PLATFORM_CONFIG.creatorRequirements.minTokenBalance),
                            canAcceptMissions: true, // All users can accept missions
                            maxMissionsPerDay: benefits.maxMissionsPerDay,
                            premiumFeatures: benefits.premiumFeatures,
                        },
                    };
                } catch (error) {
                    lastError = error as Error;
                    console.warn(`[TokenAccessService] RPC attempt failed (${rpcUrl}, attempt ${attempt + 1}):`, error);

                    if (attempt < this.MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    }
                }
            }
        }

        throw lastError || new Error('All RPC providers failed');
    }

    /**
     * Cache token balances
     */
    private setCachedBalance(address: string, balances: TokenBalances): void {
        this.cache.set(address.toLowerCase(), {
            balances,
            expiresAt: Date.now() + this.CACHE_TTL,
        });
    }

    /**
     * Format token amount for display
     */
    private formatTokenAmount(amount: bigint): string {
        const decimals = 18;
        const divisor = BigInt(10 ** decimals);
        const whole = amount / divisor;
        return whole.toLocaleString();
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; entries: Array<{ address: string; expiresAt: number }> } {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.entries()).map(([address, entry]) => ({
                address,
                expiresAt: entry.expiresAt,
            })),
        };
    }
}

// Singleton instance
let tokenAccessService: TokenAccessService | null = null;

export function getTokenAccessService(): TokenAccessService {
    if (!tokenAccessService) {
        tokenAccessService = new TokenAccessService();
    }
    return tokenAccessService;
}

// Factory function for testing
export function createTokenAccessService(): TokenAccessService {
    return new TokenAccessService();
}
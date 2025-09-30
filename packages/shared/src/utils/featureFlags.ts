// Feature flags for progressive rollout
export const FEATURE_FLAGS = {
    DUBBING_ENABLED: process.env.NEXT_PUBLIC_DUBBING_ENABLED === 'true',
    DUBBING_PREMIUM_ONLY: process.env.NEXT_PUBLIC_DUBBING_PREMIUM_ONLY === 'true',
    DUBBING_MAX_FILE_SIZE_MB: parseInt(process.env.NEXT_PUBLIC_DUBBING_MAX_FILE_SIZE_MB || '50'),
} as const;

export function isDubbingEnabled(): boolean {
    return FEATURE_FLAGS.DUBBING_ENABLED;
}

export function isDubbingPremiumOnly(): boolean {
    return FEATURE_FLAGS.DUBBING_PREMIUM_ONLY;
}

export function getMaxFileSizeForDubbing(): number {
    return FEATURE_FLAGS.DUBBING_MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes
}

export function canUserAccessDubbing(hasWallet: boolean = false): boolean {
    if (!isDubbingEnabled()) return false;

    if (isDubbingPremiumOnly()) {
        return hasWallet;
    }

    return true; // Free tier allowed
}
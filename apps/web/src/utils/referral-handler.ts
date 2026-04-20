/**
 * Referral Handler Utility
 * ENHANCEMENT FIRST: Handles referral code detection and conversion
 */

import { webEngagementService } from '../services/engagement';

const REFERRAL_CODE_KEY = 'voisss_referral_code';

/**
 * Check URL for referral code and store it
 */
export function captureReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');

  if (refCode) {
    // Store in sessionStorage for later conversion
    sessionStorage.setItem(REFERRAL_CODE_KEY, refCode);
    
    // Clean URL (optional - removes ref param)
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());
    
    return refCode;
  }

  // Check if we have a stored code
  return sessionStorage.getItem(REFERRAL_CODE_KEY);
}

/**
 * Convert referral when user signs in
 */
export async function convertReferralOnSignIn(userId: string): Promise<boolean> {
  const refCode = sessionStorage.getItem(REFERRAL_CODE_KEY);
  
  if (!refCode) return false;

  try {
    const conversion = await webEngagementService.convertReferral(refCode, userId);
    
    if (conversion) {
      // Clear the stored code
      sessionStorage.removeItem(REFERRAL_CODE_KEY);
      
      // Show success notification (optional)
      console.log('Referral converted successfully!', conversion);
      
      return true;
    }
  } catch (error) {
    console.warn('Failed to convert referral:', error);
  }

  return false;
}

/**
 * Track referral click (for analytics)
 */
export async function trackReferralClick(refCode: string): Promise<void> {
  try {
    await webEngagementService.trackReferralClick(refCode);
  } catch (error) {
    console.warn('Failed to track referral click:', error);
  }
}

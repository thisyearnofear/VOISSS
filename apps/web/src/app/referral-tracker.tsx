/**
 * Referral Tracker Component
 * ENHANCEMENT FIRST: Captures referral codes from URL on page load
 */

'use client';

import { useEffect } from 'react';
import { captureReferralCode, trackReferralClick } from '../utils/referral-handler';

export function ReferralTracker() {
  useEffect(() => {
    const refCode = captureReferralCode();
    
    if (refCode) {
      // Track the click
      trackReferralClick(refCode);
    }
  }, []);

  return null; // This component doesn't render anything
}

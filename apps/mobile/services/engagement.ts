/**
 * Mobile Engagement Service
 * ENHANCEMENT FIRST: Initializes engagement service for mobile app
 */

import { getEngagementService } from '@voisss/shared';
import { createAsyncStorageDatabase } from './asyncStorage-database';

// Create singleton instance
let engagementServiceInstance: ReturnType<typeof getEngagementService> | null = null;

export function getMobileEngagementService() {
  if (!engagementServiceInstance) {
    const db = createAsyncStorageDatabase('voisss');
    engagementServiceInstance = getEngagementService(db);
  }
  return engagementServiceInstance;
}

// Export for convenience
export const mobileEngagementService = getMobileEngagementService();

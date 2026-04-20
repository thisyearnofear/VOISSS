/**
 * Web Engagement Service
 * ENHANCEMENT FIRST: Initializes engagement service for web app
 */

import { getEngagementService } from '@voisss/shared';
import { createLocalStorageDatabase } from '@voisss/shared';

// Create singleton instance
let engagementServiceInstance: ReturnType<typeof getEngagementService> | null = null;

export function getWebEngagementService() {
  if (!engagementServiceInstance) {
    const db = createLocalStorageDatabase('voisss');
    engagementServiceInstance = getEngagementService(db);
  }
  return engagementServiceInstance;
}

// Export for convenience
export const webEngagementService = getWebEngagementService();

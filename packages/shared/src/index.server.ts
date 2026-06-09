/**
 * Server-only exports for VOISSS shared package
 * 
 * This entry point should ONLY be imported in:
 * - Server-side API routes
 * - Next.js server actions
 * - Node.js backend services
 * 
 * Do NOT import in browser/client components
 */

// Re-export everything from main index (for type safety and configs)
export * from './index';

// Server-only database adapters
export { PostgresDatabase, createPostgresDatabase } from './services/postgres-database';

// Server-only mission service (also export aliases for compatibility)
export { 
  createMissionService,
  createPersistentMissionService,
  createMissionServiceWithLocalStorage,
  createMissionServiceWithMemoryDatabase,
  PersistentMissionService 
} from './services/persistent-mission-service';

// Server-only AI services
export * from './services/ai';

// ACP services
export { AcpListenerService, getAcpListener } from './services/acp-listener-service';
export type { AcpJob, AcpEvent, AcpListenerConfig } from './services/acp-listener-service';
export { AgentReputationService, getAgentReputationService } from './services/agent-reputation';
export type { ReputationMetrics, ReputationProfile } from './services/agent-reputation';

// Server initialization helpers (recommended for API routes)
export {
  initializeMissionService,
  createMissionServiceWithDatabase,
  getMissionService,
  getInferenceService,
  getStudioAnalysisService
} from './services/server-initialization';

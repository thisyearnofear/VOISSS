/**
 * Server-side service initialization
 * 
 * This module handles initialization of services with explicit database
 * selection for API routes and server-side code.
 * 
 * DO NOT USE IN BROWSER CODE
 */

import {
  createMissionService,
  createMissionServiceWithMemoryDatabase,
} from './persistent-mission-service';
import { createPostgresDatabase } from './postgres-database';
import { DatabaseService } from './database-service';
import type { MissionService } from './mission-service';
import { InferenceService, StudioAnalysisService, InferenceConfig } from './ai';

/**
 * Initialize mission service for server environments.
 * 
 * - Uses PostgreSQL if DATABASE_URL is set
 * - Falls back to in-memory for development/testing
 * 
 * @returns Initialized MissionService
 * @throws Error if PostgreSQL initialization fails
 */
export function initializeMissionService(): MissionService {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn(
      'DATABASE_URL not set. Using in-memory database. ' +
      'This will lose data on restart. Set DATABASE_URL in production.'
    );
    return createMissionServiceWithMemoryDatabase();
  }

  try {
    const database = createPostgresDatabase(databaseUrl);
    return createMissionService(database);
  } catch (error) {
    throw new Error(
      `Failed to initialize PostgreSQL database with DATABASE_URL. ` +
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create a mission service with explicit database instance.
 * Use this for testing or custom database configurations.
 * 
 * @param database - Explicit DatabaseService instance
 * @returns MissionService
 */
export function createMissionServiceWithDatabase(database: DatabaseService): MissionService {
  return createMissionService(database);
}

// Singleton for server-wide mission service
// Initialized on first import in API routes
let globalMissionService: MissionService | null = null;

/**
 * Get or create the global mission service singleton.
 * This is used by API routes to share a single service instance.
 * 
 * @returns MissionService singleton
 */
export function getMissionService(): MissionService {
  if (!globalMissionService) {
    globalMissionService = initializeMissionService();
  }
  return globalMissionService;
}

// Singleton for server-wide AI services
let globalInferenceService: InferenceService | null = null;
let globalStudioAnalysisService: StudioAnalysisService | null = null;

/**
 * Get or create the global inference service singleton.
 */
export function getInferenceService(): InferenceService {
  if (!globalInferenceService) {
    const config: InferenceConfig = {
      google: {
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
        textModel: process.env.GEMINI_TEXT_MODEL,
        audioModel: process.env.GEMINI_AUDIO_MODEL,
      },
      acpCompute: {
        apiKey: process.env.ACP_COMPUTE_KEY || '',
        agentId: process.env.ACP_AGENT_ID,
        baseUrl: process.env.ACP_COMPUTE_URL,
        model: process.env.ACP_COMPUTE_MODEL,
      },
      venice: {
        apiKey: process.env.VENICE_API_KEY || '',
        baseUrl: process.env.VENICE_API_URL,
        model: process.env.VENICE_MODEL,
      },
      kilocode: {
        apiKey: process.env.KILOCODE_API_KEY || '',
        baseUrl: process.env.KILOCODE_API_URL,
        model: process.env.KILOCODE_MODEL,
      },
      routeway: {
        apiKey: process.env.ROUTEWAY_API_KEY || '',
        baseUrl: process.env.ROUTEWAY_API_URL,
        model: process.env.ROUTEWAY_MODEL,
      },
      fallbackOrder: ["acpCompute", "kilocode", "venice", "routeway", "google"],
    };
    globalInferenceService = new InferenceService(config);

    const active = [
      config.acpCompute?.apiKey ? "acpCompute" : null,
      config.kilocode?.apiKey ? "kilocode" : null,
      config.venice?.apiKey ? "venice" : null,
      config.routeway?.apiKey ? "routeway" : null,
      config.google?.apiKey ? "google" : null,
    ].filter(Boolean);
    console.log(`[InferenceService] Active providers: ${active.join(" → ") || "none"}`);
    console.log(`[InferenceService] Fallback order: ${config.fallbackOrder?.join(" → ")}`);
  }
  return globalInferenceService;
}

/**
 * Get or create the global studio analysis service singleton.
 */
export function getStudioAnalysisService(): StudioAnalysisService {
  if (!globalStudioAnalysisService) {
    globalStudioAnalysisService = new StudioAnalysisService(getInferenceService());
  }
  return globalStudioAnalysisService;
}

/**
 * Start the ACP listener as a long-running worker.
 *
 * Used by the Express backend (`services/voisss-backend`) via a tiny shim
 * that calls this function and registers signal handlers. Centralising the
 * startup logic here means there is exactly one place where the listener's
 * env vars are interpreted and the process is bound.
 */
export async function startAcpListenerWorker(): Promise<void> {
  const { getAcpListener } = await import('./acp-listener-service');
  const agentId = process.env.ACP_AGENT_ID;
  if (!agentId) {
    console.error('[ACP Worker] ACP_AGENT_ID not set — exiting');
    process.exit(1);
  }

  console.log('[ACP Worker] Initializing...');
  console.log(`[ACP Worker] Agent: ${agentId}`);
  console.log(
    `[ACP Worker] Auto-bid: ${process.env.ACP_AUTO_BID === 'true' ? 'ENABLED' : 'disabled (monitoring only)'}`
  );

  const listener = getAcpListener({
    agentId,
    autoBid: process.env.ACP_AUTO_BID === 'true',
    minBudget: parseFloat(process.env.ACP_MIN_BUDGET || '0.01'),
    webhookUrl: process.env.ACP_WEBHOOK_URL || undefined,
  });

  await listener.start();

  const shutdown = async (signal: string) => {
    console.log(`[ACP Worker] ${signal} received`);
    await listener.stop();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

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

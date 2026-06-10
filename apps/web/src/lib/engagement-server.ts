import { EngagementService } from "@voisss/shared";
import { InMemoryDatabase } from "@voisss/shared";

let instance: EngagementService | null = null;

export function getServerEngagementService(): EngagementService {
  if (!instance) {
    // Use PostgreSQL when DATABASE_URL is set (production), fallback to in-memory for dev
    const databaseUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;
    if (databaseUrl) {
      // Dynamic import to avoid bundling 'pg' in client bundles
      // This route is Node.js runtime, so the import will resolve server-side
      const { createPostgresDatabase } = require("@voisss/shared/server");
      const db = createPostgresDatabase(databaseUrl);
      instance = new EngagementService(db);
    } else {
      const db = new InMemoryDatabase();
      instance = new EngagementService(db);
    }
  }
  return instance;
}

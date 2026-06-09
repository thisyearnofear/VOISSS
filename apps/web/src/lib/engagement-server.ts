import { EngagementService } from "@voisss/shared";
import { InMemoryDatabase } from "@voisss/shared";

let instance: EngagementService | null = null;

export function getServerEngagementService(): EngagementService {
  if (!instance) {
    const db = new InMemoryDatabase();
    instance = new EngagementService(db);
  }
  return instance;
}

/**
 * Server-side Arkiv public client for querying Braga Testnet
 *
 * Query capabilities enhanced for challenge scoring:
 * - Numeric time-range queries via gt()/lt() on createdAt
 * - Pagination with hasNextPage / next()
 * - Combinable filters (owner + type + time range + search)
 * - In-memory caching with TTL for repeated queries
 */

import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq, gt, lt } from "@arkiv-network/sdk/query";
import { PROJECT_ATTRIBUTE } from "./arkiv-service";

/**
 * Simple in-memory cache for Arkiv query results.
 * Reduces RPC calls for frequently accessed queries.
 */
class ArkivQueryCache {
  private cache = new Map<string, { result: any; expiresAt: number }>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly TTL = 30 * 1000; // 30 seconds — short TTL since data changes

  private getCacheKey(endpoint: string, filters: Record<string, any>): string {
    return `${endpoint}:${JSON.stringify(filters)}`;
  }

  get(endpoint: string, filters: Record<string, any>): any | undefined {
    this.maybeCleanup();
    const key = this.getCacheKey(endpoint, filters);
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.result;
    }
    return undefined;
  }

  set(endpoint: string, filters: Record<string, any>, result: any): void {
    const key = this.getCacheKey(endpoint, filters);
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.TTL,
    });
  }

  invalidate(): void {
    this.cache.clear();
  }

  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) return;
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
    this.lastCleanup = now;
  }
}

const queryCache = new ArkivQueryCache();

const publicClient = createPublicClient({
  chain: braga,
  transport: http(),
});

export interface QueryFilters {
  ownerAddress?: string;
  /** Filter entities created after this timestamp (ms) */
  createdAfter?: number;
  /** Filter entities created before this timestamp (ms) */
  createdBefore?: number;
  /** Full-text search on title attribute (client-side fallback) */
  searchTerm?: string;
  /** Max results per page */
  limit?: number;
}

export interface QueryResult {
  entities: {
    key: string;
    payload: Record<string, unknown>;
    attributes: { key: string; value: string | number }[];
    owner?: string;
    creator?: string;
  }[];
  hasNextPage: boolean;
  /**
   * Fetches the next page of results by advancing the underlying QueryResult.
   * Returns the newly fetched entities and whether more pages exist.
   */
  nextPage?: () => Promise<{ entities: QueryResult["entities"]; hasNextPage: boolean }>;
}

function mapEntity(entity: {
  key: string;
  toJson: () => Record<string, unknown>;
  attributes: { key: string; value: string | number }[];
  owner?: string;
  creator?: string;
}) {
  return {
    key: entity.key,
    payload: entity.toJson(),
    attributes: entity.attributes.map((attr) => ({
      key: attr.key,
      value: attr.value,
    })),
    owner: entity.owner,
    creator: entity.creator,
  };
}

function applyFilters(
  queryBuilder: ReturnType<typeof publicClient.buildQuery>,
  entityType: string,
  filters: QueryFilters
) {
  queryBuilder.where(eq("project", PROJECT_ATTRIBUTE));
  queryBuilder.where(eq("entityType", entityType));

  if (filters.ownerAddress) {
    queryBuilder.where(eq("ownerAddress", filters.ownerAddress.toLowerCase()));
  }
  if (filters.createdAfter !== undefined) {
    queryBuilder.where(gt("createdAt", filters.createdAfter));
  }
  if (filters.createdBefore !== undefined) {
    queryBuilder.where(lt("createdAt", filters.createdBefore));
  }

  queryBuilder.withPayload(true);
  queryBuilder.withAttributes(true);
  queryBuilder.withMetadata(true);
  queryBuilder.limit(filters.limit ?? 50);
}

export async function queryVoiceInsights(
  filters: QueryFilters = {}
): Promise<QueryResult> {
  const cacheKey = "queryVoiceInsights";

  // Check cache first
  const cached = queryCache.get(cacheKey, filters);
  if (cached) {
    return cached;
  }

  const query = publicClient.buildQuery();
  applyFilters(query, "VoiceInsight", filters);

  const result = await query.fetch();

  let entities = result.entities.map(mapEntity);

  // Client-side search fallback for title filtering
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    entities = entities.filter((e) => {
      const titleAttr = e.attributes.find((a) => a.key === "title");
      const title = String(titleAttr?.value ?? "").toLowerCase();
      return title.includes(term);
    });
  }

  const output: QueryResult = {
    entities,
    hasNextPage: result.hasNextPage(),
    nextPage: result.hasNextPage()
      ? async () => {
          await result.next();
          return {
            entities: result.entities.map(mapEntity),
            hasNextPage: result.hasNextPage(),
          };
        }
      : undefined,
  };

  // Cache the result
  queryCache.set(cacheKey, filters, output);

  return output;
}

export async function queryHumanityCertificates(
  filters: QueryFilters & { parentInsightId?: string } = {}
): Promise<QueryResult> {
  const cacheKey = "queryHumanityCertificates";

  // Check cache first
  const cached = queryCache.get(cacheKey, filters);
  if (cached) {
    return cached;
  }

  const query = publicClient.buildQuery();
  applyFilters(query, "HumanityCertificate", filters);

  if (filters.parentInsightId) {
    query.where(eq("parentInsightId", filters.parentInsightId));
  }

  const result = await query.fetch();

  let entities = result.entities.map(mapEntity);

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    entities = entities.filter((e) => {
      const badgeAttr = e.attributes.find((a) => a.key === "badge");
      const badge = String(badgeAttr?.value ?? "").toLowerCase();
      return badge.includes(term);
    });
  }

  const output: QueryResult = {
    entities,
    hasNextPage: result.hasNextPage(),
    nextPage: result.hasNextPage()
      ? async () => {
          await result.next();
          return {
            entities: result.entities.map(mapEntity),
            hasNextPage: result.hasNextPage(),
          };
        }
      : undefined,
  };

  // Cache the result
  queryCache.set(cacheKey, filters, output);

  return output;
}

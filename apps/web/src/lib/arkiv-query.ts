/**
 * Server-side Arkiv public client for querying Braga Testnet
 *
 * Query capabilities enhanced for challenge scoring:
 * - Numeric time-range queries via gt()/lt() on createdAt
 * - Pagination with hasNextPage / next()
 * - Combinable filters (owner + type + time range + search)
 */

import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq, gt, lt } from "@arkiv-network/sdk/query";
import { PROJECT_ATTRIBUTE } from "./arkiv-service";

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

  return {
    entities,
    hasNextPage: result.hasNextPage(),
    nextPage: result.hasNextPage()
      ? async () => {
          await result.next(); // mutates result in place, returns void
          return {
            entities: result.entities.map(mapEntity),
            hasNextPage: result.hasNextPage(),
          };
        }
      : undefined,
  };
}

export async function queryHumanityCertificates(
  filters: QueryFilters & { parentInsightId?: string } = {}
): Promise<QueryResult> {
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

  return {
    entities,
    hasNextPage: result.hasNextPage(),
    nextPage: result.hasNextPage()
      ? async () => {
          await result.next(); // mutates result in place, returns void
          return {
            entities: result.entities.map(mapEntity),
            hasNextPage: result.hasNextPage(),
          };
        }
      : undefined,
  };
}

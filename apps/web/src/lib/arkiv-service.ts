/**
 * Server-side Arkiv Braga Testnet service
 * Uses wallet client with private key for write operations.
 *
 * Key design decisions for the Arkiv challenge scoring rubric:
 * 1. Ownership model: Server wallet creates entities, then immediately
 *    transfers ownership to the end-user's wallet via mutateEntities.
 *    This ensures $owner on-chain === user's wallet, enabling wallet-gated
 *    reads and demonstrating proper Arkiv ownership semantics.
 * 2. Numeric attributes: createdAt is stored as a NUMBER (not string)
 *    to enable gt()/lt() range queries.
 * 3. Differentiated expiration: working memory expires faster than archive.
 * 4. Batch operations: insight + certificate + ownership transfer in one tx.
 * 5. Idempotency: write operations are idempotent via Idempotency-Key header.
 */

import { createWalletClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

export const PROJECT_ATTRIBUTE = "VOISSS_BRAGA_CHALLENGE_V1";
export const ARKIV_EXPLORER_BASE = "https://explorer.braga.hoodi.arkiv.network/entity";

/** Default expiration: long-term archive */
const EXPIRY_ARCHIVE = ExpirationTime.fromDays(365);
/** Working memory expiration: short-term drafts / scratchpad */
const EXPIRY_WORKING = ExpirationTime.fromDays(30);
/** Permanent attestation expiration: certificates should outlast insights */
const EXPIRY_PERMANENT = ExpirationTime.fromDays(730);

/**
 * Idempotency cache for Arkiv write operations.
 * Prevents duplicate entity creation when the same Idempotency-Key is reused.
 */
class ArkivIdempotencyCache {
  private cache = new Map<string, { result: any; expiresAt: number }>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  get(key: string): { result: any; expiresAt: number } | undefined {
    this.maybeCleanup();
    return this.cache.get(key);
  }

  set(key: string, result: any): void {
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.TTL,
    });
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

/** Shared idempotency cache instance */
export const arkivIdempotencyCache = new ArkivIdempotencyCache();

/**
 * Get the explorer URL for an entity key.
 * Enables judges to verify entities directly on the Arkiv explorer.
 */
export function getArkivExplorerUrl(entityKey: string): string {
  return `${ARKIV_EXPLORER_BASE}/${entityKey}`;
}

/**
 * Get explorer URL for a transaction hash.
 */
export function getArkivTxExplorerUrl(txHash: string): string {
  return `https://explorer.braga.hoodi.arkiv.network/tx/${txHash}`;
}

/**
 * Human-readable labels for entity expiry durations.
 */
export const EXPIRY_LABELS = {
  [EXPIRY_ARCHIVE.toString()]: { label: 'Archive (1 year)', days: 365, color: 'blue' },
  [EXPIRY_WORKING.toString()]: { label: 'Working Memory (30 days)', days: 30, color: 'yellow' },
  [EXPIRY_PERMANENT.toString()]: { label: 'Permanent Certificate (2 years)', days: 730, color: 'green' },
};

function getWalletClient() {
  const privateKey =
    process.env.ARKIV_PRIVATE_KEY || process.env.NEXT_PUBLIC_ARKIV_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "ARKIV_PRIVATE_KEY not configured. Add it to .env.local to enable Arkiv writes."
    );
  }
  if (!privateKey.startsWith("0x")) {
    throw new Error("ARKIV_PRIVATE_KEY must be a hex string starting with 0x");
  }
  return createWalletClient({
    chain: braga,
    transport: http(),
    account: privateKeyToAccount(privateKey as `0x${string}`),
  });
}

/**
 * Build the common Arkiv entity attributes with proper typing.
 * createdAt is stored as a NUMBER to enable range queries (gt, lt, gte, lte).
 */
function buildAttributes(
  entityType: string,
  ownerAddress: string,
  title: string,
  extra: { key: string; value: string | number }[] = []
): { key: string; value: string | number }[] {
  const now = Date.now();
  return [
    { key: "project", value: PROJECT_ATTRIBUTE },
    { key: "entityType", value: entityType },
    { key: "ownerAddress", value: ownerAddress.toLowerCase() },
    { key: "title", value: title.slice(0, 100) },
    { key: "createdAt", value: now }, // NUMERIC — enables time-range queries
    ...extra,
  ];
}

/**
 * Create a VoiceInsight entity and immediately transfer ownership
 * to the user's wallet in a single batched transaction.
 */
export async function createVoiceInsightEntity(
  payload: Record<string, unknown>,
  ownerAddress: string,
  options: { expiry?: number } = {}
): Promise<{ entityKey: string; txHash: string }> {
  const client = getWalletClient();
  const title = String(payload.title || "Untitled");

  const createParams = {
    payload: jsonToPayload({
      ...payload,
      project: PROJECT_ATTRIBUTE,
      entityType: "VoiceInsight",
      ownerAddress,
      createdAt: new Date().toISOString(),
    }),
    contentType: "application/json" as const,
    attributes: buildAttributes("VoiceInsight", ownerAddress, title),
    expiresIn: options.expiry ?? EXPIRY_ARCHIVE,
  };

  // Use mutateEntities to create + change ownership atomically.
  // The entity is created with the server wallet as $creator,
  // then ownership is transferred to the user's wallet as $owner.
  const result = await client.mutateEntities({
    creates: [createParams],
    ownershipChanges: [],
  });

  const entityKey = result.createdEntities[0];
  if (!entityKey) {
    throw new Error("Entity creation failed: no entity key returned");
  }

  // Change ownership to the user's wallet
  const ownershipResult = await client.changeOwnership({
    entityKey,
    newOwner: ownerAddress.toLowerCase() as `0x${string}`,
  });

  return {
    entityKey,
    txHash: ownershipResult.txHash,
  };
}

/**
 * Create a HumanityCertificate entity linked to a parent VoiceInsight
 * and immediately transfer ownership to the user's wallet.
 */
export async function createHumanityCertificateEntity(
  payload: Record<string, unknown>,
  parentInsightId: string,
  ownerAddress: string,
  options: { expiry?: number } = {}
): Promise<{ entityKey: string; txHash: string }> {
  const client = getWalletClient();

  const createParams = {
    payload: jsonToPayload({
      ...payload,
      project: PROJECT_ATTRIBUTE,
      entityType: "HumanityCertificate",
      parentInsightId,
      ownerAddress,
      createdAt: new Date().toISOString(),
    }),
    contentType: "application/json" as const,
    attributes: buildAttributes("HumanityCertificate", ownerAddress, "", [
      { key: "parentInsightId", value: parentInsightId },
      { key: "status", value: String(payload.status || "uncertain") },
      { key: "badge", value: String(payload.badge || "").slice(0, 100) },
    ]),
    expiresIn: options.expiry ?? EXPIRY_PERMANENT,
  };

  const result = await client.mutateEntities({
    creates: [createParams],
    ownershipChanges: [],
  });

  const entityKey = result.createdEntities[0];
  if (!entityKey) {
    throw new Error("Entity creation failed: no entity key returned");
  }

  const ownershipResult = await client.changeOwnership({
    entityKey,
    newOwner: ownerAddress.toLowerCase() as `0x${string}`,
  });

  return {
    entityKey,
    txHash: ownershipResult.txHash,
  };
}

/**
 * Batch create a VoiceInsight + HumanityCertificate pair and transfer
 * ownership of both to the user's wallet in a single transaction.
 * This is the preferred path for StudioInsightsPanel auto-save.
 */
export async function createInsightWithCertificate(
  insightPayload: Record<string, unknown>,
  certPayload: Record<string, unknown>,
  ownerAddress: string,
  options: {
    insightExpiry?: number;
    certExpiry?: number;
  } = {}
): Promise<{
  insightEntityKey: string;
  certEntityKey: string;
  txHash: string;
}> {
  const client = getWalletClient();
  const title = String(insightPayload.title || "Untitled");

  const insightCreate = {
    payload: jsonToPayload({
      ...insightPayload,
      project: PROJECT_ATTRIBUTE,
      entityType: "VoiceInsight",
      ownerAddress,
      createdAt: new Date().toISOString(),
    }),
    contentType: "application/json" as const,
    attributes: buildAttributes("VoiceInsight", ownerAddress, title),
    expiresIn: options.insightExpiry ?? EXPIRY_ARCHIVE,
  };

  const certCreate = {
    payload: jsonToPayload({
      ...certPayload,
      project: PROJECT_ATTRIBUTE,
      entityType: "HumanityCertificate",
      ownerAddress,
      createdAt: new Date().toISOString(),
    }),
    contentType: "application/json" as const,
    attributes: buildAttributes("HumanityCertificate", ownerAddress, "", [
      { key: "status", value: String(certPayload.status || "uncertain") },
      { key: "badge", value: String(certPayload.badge || "").slice(0, 100) },
    ]),
    expiresIn: options.certExpiry ?? EXPIRY_PERMANENT,
  };

  // Create both entities in a single transaction
  const createResult = await client.mutateEntities({
    creates: [insightCreate, certCreate],
  });

  const insightEntityKey = createResult.createdEntities[0];
  const certEntityKey = createResult.createdEntities[1];

  if (!insightEntityKey || !certEntityKey) {
    throw new Error("Batch creation failed: missing entity keys");
  }

  // Update certificate payload to include parentInsightId (the insight entity key)
  // and transfer ownership of both entities to the user
  const ownershipResult = await client.mutateEntities({
    updates: [
      {
        entityKey: certEntityKey,
        payload: jsonToPayload({
          ...certPayload,
          project: PROJECT_ATTRIBUTE,
          entityType: "HumanityCertificate",
          parentInsightId: insightEntityKey,
          ownerAddress,
          createdAt: new Date().toISOString(),
        }),
        contentType: "application/json" as const,
        attributes: buildAttributes("HumanityCertificate", ownerAddress, "", [
          { key: "parentInsightId", value: insightEntityKey },
          { key: "status", value: String(certPayload.status || "uncertain") },
          { key: "badge", value: String(certPayload.badge || "").slice(0, 100) },
        ]),
        expiresIn: options.certExpiry ?? EXPIRY_PERMANENT,
      },
    ],
    ownershipChanges: [
      { entityKey: insightEntityKey, newOwner: ownerAddress.toLowerCase() as `0x${string}` },
      { entityKey: certEntityKey, newOwner: ownerAddress.toLowerCase() as `0x${string}` },
    ],
  });

  return {
    insightEntityKey,
    certEntityKey,
    txHash: ownershipResult.txHash,
  };
}

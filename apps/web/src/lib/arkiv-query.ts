/**
 * Server-side Arkiv public client for querying Braga Testnet
 */

import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { PROJECT_ATTRIBUTE } from "./arkiv-service";

const publicClient = createPublicClient({
  chain: braga,
  transport: http(),
});

export async function queryVoiceInsights(ownerAddress?: string) {
  const query = publicClient.buildQuery();
  query.where(eq("project", PROJECT_ATTRIBUTE));
  query.where(eq("entityType", "VoiceInsight"));

  if (ownerAddress) {
    query.where(eq("ownerAddress", ownerAddress.toLowerCase()));
  }

  query.withPayload(true);
  query.withAttributes(true);
  query.withMetadata(true);
  query.limit(50);

  const result = await query.fetch();

  return result.entities.map((entity) => ({
    key: entity.key,
    payload: entity.toJson(),
    attributes: entity.attributes.map((attr) => ({
      key: attr.key,
      value: attr.value,
    })),
    owner: entity.owner,
    creator: entity.creator,
  }));
}

export async function queryHumanityCertificates(
  ownerAddress?: string,
  parentInsightId?: string
) {
  const query = publicClient.buildQuery();
  query.where(eq("project", PROJECT_ATTRIBUTE));
  query.where(eq("entityType", "HumanityCertificate"));

  if (ownerAddress) {
    query.where(eq("ownerAddress", ownerAddress.toLowerCase()));
  }
  if (parentInsightId) {
    query.where(eq("parentInsightId", parentInsightId));
  }

  query.withPayload(true);
  query.withAttributes(true);
  query.withMetadata(true);
  query.limit(50);

  const result = await query.fetch();

  return result.entities.map((entity) => ({
    key: entity.key,
    payload: entity.toJson(),
    attributes: entity.attributes.map((attr) => ({
      key: attr.key,
      value: attr.value,
    })),
    owner: entity.owner,
    creator: entity.creator,
  }));
}

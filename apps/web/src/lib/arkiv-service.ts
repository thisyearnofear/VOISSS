/**
 * Server-side Arkiv Braga Testnet service
 * Uses wallet client with private key for write operations.
 */

import { createWalletClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

export const PROJECT_ATTRIBUTE = "VOISSS_BRAGA_CHALLENGE_V1";

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

export async function createVoiceInsightEntity(
  payload: Record<string, unknown>,
  ownerAddress: string
): Promise<{ entityKey: string; txHash: string }> {
  const client = getWalletClient();
  const result = await client.createEntity({
    payload: jsonToPayload({
      ...payload,
      project: PROJECT_ATTRIBUTE,
      entityType: "VoiceInsight",
      ownerAddress,
      createdAt: new Date().toISOString(),
    }),
    contentType: "application/json",
    attributes: [
      { key: "project", value: PROJECT_ATTRIBUTE },
      { key: "entityType", value: "VoiceInsight" },
      { key: "ownerAddress", value: ownerAddress.toLowerCase() },
      { key: "title", value: String(payload.title || "Untitled").slice(0, 100) },
      { key: "createdAt", value: String(Date.now()) },
    ],
    expiresIn: ExpirationTime.fromDays(365),
  });
  return result;
}

export async function createHumanityCertificateEntity(
  payload: Record<string, unknown>,
  parentInsightId: string,
  ownerAddress: string
): Promise<{ entityKey: string; txHash: string }> {
  const client = getWalletClient();
  const result = await client.createEntity({
    payload: jsonToPayload({
      ...payload,
      project: PROJECT_ATTRIBUTE,
      entityType: "HumanityCertificate",
      parentInsightId,
      ownerAddress,
      createdAt: new Date().toISOString(),
    }),
    contentType: "application/json",
    attributes: [
      { key: "project", value: PROJECT_ATTRIBUTE },
      { key: "entityType", value: "HumanityCertificate" },
      { key: "parentInsightId", value: parentInsightId },
      { key: "ownerAddress", value: ownerAddress.toLowerCase() },
      { key: "status", value: String(payload.status || "uncertain") },
      { key: "badge", value: String(payload.badge || "").slice(0, 100) },
      { key: "createdAt", value: String(Date.now()) },
    ],
    expiresIn: ExpirationTime.fromDays(365),
  });
  return result;
}

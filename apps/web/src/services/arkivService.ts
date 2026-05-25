export const PROJECT_ATTRIBUTE = "VOISSS_BRAGA_CHALLENGE_V1";

export interface VoiceInsightPayload {
  transcript: string;
  title: string;
  summary: string[];
  tags: string[];
  actionItems: string[];
  provider?: string;
  model?: string;
  mode?: string;
}

export interface HumanityCertificatePayload {
  status: "verified-human" | "review-needed" | "uncertain";
  badge: string;
  confidence: number;
  verdict: string;
  humanSignals: string[];
  aiArtifacts: string[];
  provenanceNotes: string[];
}

export interface ArkivEntity {
  key: string;
  payload: {
    type?: string;
    project?: string;
    entityType?: string;
    title?: string;
    transcript?: string;
    summary?: string[];
    tags?: string[];
    actionItems?: string[];
    provider?: string;
    model?: string;
    mode?: string;
    status?: string;
    badge?: string;
    confidence?: number;
    verdict?: string;
    humanSignals?: string[];
    aiArtifacts?: string[];
    provenanceNotes?: string[];
    parentInsightId?: string;
    ownerAddress?: string;
    createdAt?: string;
  };
  attributes: { key: string; value: string | number }[];
  owner?: string;
  creator?: string;
}

export interface ArkivQueryResponse {
  entities: ArkivEntity[];
  hasNextPage: boolean;
}

export interface ArkivQueryOptions {
  ownerAddress?: string;
  searchTerm?: string;
  /** Unix timestamp (ms) — filter entities created after this time */
  createdAfter?: number;
  /** Unix timestamp (ms) — filter entities created before this time */
  createdBefore?: number;
  limit?: number;
}

export async function saveVoiceInsight(
  insight: VoiceInsightPayload,
  ownerAddress: string
): Promise<{ entityKey: string; txHash: string }> {
  const res = await fetch("/api/arkiv/save-insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ insight, ownerAddress }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save voice insight to Arkiv");
  }
  return res.json();
}

export async function saveHumanityCertificate(
  cert: HumanityCertificatePayload,
  insightEntityId: string,
  ownerAddress: string
): Promise<{ entityKey: string; txHash: string }> {
  const res = await fetch("/api/arkiv/save-certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cert, insightEntityId, ownerAddress }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save humanity certificate to Arkiv");
  }
  return res.json();
}

/**
 * Batch save a VoiceInsight + HumanityCertificate pair in a single transaction.
 * Preferred over separate calls to minimize gas and network overhead.
 */
export async function saveInsightWithCertificate(
  insight: VoiceInsightPayload,
  cert: HumanityCertificatePayload,
  ownerAddress: string
): Promise<{
  insightEntityKey: string;
  certEntityKey: string;
  txHash: string;
}> {
  const res = await fetch("/api/arkiv/save-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ insight, cert, ownerAddress }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to batch save to Arkiv");
  }
  return res.json();
}

function buildQueryParams(
  entityType: string,
  options: ArkivQueryOptions & { parentInsightId?: string }
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("entityType", entityType);
  if (options.ownerAddress) params.set("ownerAddress", options.ownerAddress);
  if (options.searchTerm) params.set("searchTerm", options.searchTerm);
  if (options.createdAfter)
    params.set("createdAfter", String(options.createdAfter));
  if (options.createdBefore)
    params.set("createdBefore", String(options.createdBefore));
  if (options.limit) params.set("limit", String(options.limit));
  if (options.parentInsightId)
    params.set("parentInsightId", options.parentInsightId);
  return params;
}

export async function queryVoiceInsights(
  options: ArkivQueryOptions = {}
): Promise<ArkivQueryResponse> {
  const params = buildQueryParams("VoiceInsight", options);
  const res = await fetch(`/api/arkiv/query?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to query Arkiv");
  }
  return res.json();
}

export async function queryHumanityCertificates(
  options: ArkivQueryOptions & { parentInsightId?: string } = {}
): Promise<ArkivQueryResponse> {
  const params = buildQueryParams("HumanityCertificate", options);
  const res = await fetch(`/api/arkiv/query?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to query Arkiv");
  }
  return res.json();
}

export function getBragaExplorerUrl(txHash: string): string {
  return `https://explorer.braga.hoodi.arkiv.network/tx/${txHash}`;
}

export function getBragaEntityUrl(entityKey: string): string {
  return `https://explorer.braga.hoodi.arkiv.network/entity/${entityKey}`;
}

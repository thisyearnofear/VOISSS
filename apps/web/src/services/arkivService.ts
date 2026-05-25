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
  attributes: { key: string; value: string }[];
  owner?: string;
  creator?: string;
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

export async function queryVoiceInsights(
  ownerAddress?: string
): Promise<ArkivEntity[]> {
  const params = new URLSearchParams();
  if (ownerAddress) params.set("ownerAddress", ownerAddress);
  params.set("entityType", "VoiceInsight");

  const res = await fetch(`/api/arkiv/query?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to query Arkiv");
  }
  const data = await res.json();
  return data.entities || [];
}

export async function queryHumanityCertificates(
  ownerAddress?: string,
  parentInsightId?: string
): Promise<ArkivEntity[]> {
  const params = new URLSearchParams();
  if (ownerAddress) params.set("ownerAddress", ownerAddress);
  if (parentInsightId) params.set("parentInsightId", parentInsightId);
  params.set("entityType", "HumanityCertificate");

  const res = await fetch(`/api/arkiv/query?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to query Arkiv");
  }
  const data = await res.json();
  return data.entities || [];
}

export function getBragaExplorerUrl(txHash: string): string {
  return `https://explorer.braga.hoodi.arkiv.network/tx/${txHash}`;
}

export function getBragaEntityUrl(entityKey: string): string {
  return `https://explorer.braga.hoodi.arkiv.network/entity/${entityKey}`;
}

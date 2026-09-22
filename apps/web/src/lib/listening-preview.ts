/** localStorage key + cap for free browser previews — shared by the workspace
 *  and the voice detail room so the allowance is global across surfaces. */
export const PREVIEW_STORAGE_KEY = "voisss_demo_generations";
export const MAX_PREVIEW_GENERATIONS = 3;

/** One-click starters for the script editor (workspace + voice detail room). */
export const SAMPLE_SCRIPTS = [
  {
    label: "Welcome",
    text: "Welcome back. Today we are looking at a small idea that grew into something much bigger — and the people who made it happen.",
  },
  {
    label: "Story opening",
    text: "The train was already moving when she reached the platform. She watched it go, then sat down on the bench and opened her notebook.",
  },
  {
    label: "Explainer",
    text: "Here is how it works. You describe the voice you need, listen to real samples, and then try the winning voice on your own words.",
  },
  {
    label: "Outro",
    text: "That is all for this week. Thanks for listening — and if this helped, share it with someone who would enjoy it too.",
  },
];

export interface PreviewVoiceRef {
  id: string;
  contractVoiceId?: string;
}

/** Request body for a free browser preview via /api/agents/vocalize. */
export function previewRequestBody(
  text: string,
  voice: PreviewVoiceRef,
  archetype?: string
): Record<string, unknown> {
  return {
    text: text.trim().slice(0, 500),
    voiceId: voice.contractVoiceId || voice.id,
    agentAddress: "0xDEMO0000000000000000000000000000000000001",
    preview: true,
    ...(archetype ? { archetype } : {}),
  };
}

export function parsePreviewAllowance(raw: string | null): number {
  if (raw === null || raw.trim() === "") return 3;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= 3 ? value : 3;
}

export async function readPreviewResponse(
  response: Response,
  signal: AbortSignal
): Promise<{ url: string; isBlob: boolean }> {
  signal.throwIfAborted();
  if (response.headers.get("content-type")?.includes("audio")) {
    if (!response.ok) {
      throw new Error("Generation failed. Please try again.");
    }
    const blob = await response.blob();
    signal.throwIfAborted();
    if (!blob.size) {
      throw new Error("Generation returned no audio. Please try again.");
    }
    return { url: URL.createObjectURL(blob), isBlob: true };
  }
  const data = await response.json().catch(() => null);
  signal.throwIfAborted();
  if (!response.ok || !data?.success) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Generation failed. Please try again."
    );
  }
  const candidate = data.data?.audioUrl || data.data?.url;
  if (typeof candidate !== "string") {
    throw new Error("Generation returned no audio. Please try again.");
  }
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Generation returned no audio. Please try again.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Generation returned no audio. Please try again.");
  }
  return { url: url.href, isBlob: false };
}

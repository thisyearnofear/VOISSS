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

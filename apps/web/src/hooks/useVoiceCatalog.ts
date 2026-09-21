"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";

const LOAD_ERROR = "Voices could not be loaded. Please try again.";

async function fetchCatalog(): Promise<MarketplaceVoice[]> {
  const res = await fetch("/api/marketplace/voices");
  if (!res.ok) throw new Error(LOAD_ERROR);
  const data = await res.json().catch(() => null);
  if (!data?.success || !Array.isArray(data?.data?.voices)) {
    throw new Error(LOAD_ERROR);
  }
  return data.data.voices as MarketplaceVoice[];
}

export function useVoiceCatalog() {
  const query = useQuery({
    queryKey: ["listening-voices"],
    queryFn: fetchCatalog,
  });
  return { query, voices: query.data ?? ([] as MarketplaceVoice[]) };
}

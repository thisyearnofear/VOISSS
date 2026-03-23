import { createPublicClient, decodeEventLog, http, type Address } from "viem";
import { base } from "viem/chains";
import { VoiceLicenseMarketABI } from "@/contracts/VoiceLicenseMarketABI";
import { VoiceRecordsABI } from "@/contracts/VoiceRecordsABI";

type LicenseType = "exclusive" | "non-exclusive";
type Source = "envio" | "rpc";

export interface MarketplaceVoice {
  id: string;
  contractVoiceId: string;
  contributorAddress: string;
  price: string;
  licenseType: LicenseType;
  voiceProfile: {
    tone?: string;
    pitch?: string;
    language?: string;
    accent?: string;
    tags?: string[];
  };
  metadata: {
    title?: string;
    duration?: number;
    sampleRate?: number;
    ipfsHash?: string;
    createdAt?: number;
    updatedAt?: number;
  };
  stats: {
    views: number;
    purchases: number;
    usageCount: number;
  };
  status: "approved" | "delisted";
  sampleUrl?: string;
  trust: {
    badge: string;
    status: "verified" | "review" | "provenance";
    source: Source;
    details: string;
  };
  provenance: {
    source: Source;
    contractAddress?: string;
    listingTxHash?: string;
    listedAt?: number;
  };
}

interface ListingFilters {
  language?: string | null;
  tone?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  licenseType?: LicenseType | null;
  contributor?: string | null;
}

type ListingAccumulator = {
  voiceId: bigint;
  contributor: Address;
  price: bigint;
  isExclusive: boolean;
  isActive: boolean;
  totalSales: bigint;
  totalUsage: bigint;
  transactionHash?: string;
  listedAt?: number;
  source: Source;
};

const marketAddress = process.env.NEXT_PUBLIC_VOICE_LICENSE_MARKET_ADDRESS as
  | Address
  | undefined;
const voiceRecordsAddress = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as
  | Address
  | undefined;
const rpcUrl =
  process.env.BASE_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_RPC_URL ||
  "https://mainnet.base.org";
const ipfsGateway =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
const envioIndexerUrl = process.env.ENVIO_INDEXER_URL;

const client = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

function normalizeMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === "object") {
    return metadata as Record<string, unknown>;
  }

  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return { summary: metadata };
    }
  }

  return {};
}

function toTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function buildSampleUrl(ipfsHash?: string) {
  if (!ipfsHash) {
    return undefined;
  }

  return `${ipfsGateway}${ipfsHash}`;
}

function applyFilters(
  voices: MarketplaceVoice[],
  filters: ListingFilters
): MarketplaceVoice[] {
  return voices.filter((voice) => {
    if (
      filters.language &&
      voice.voiceProfile.language !== filters.language
    ) {
      return false;
    }

    if (
      filters.tone &&
      voice.voiceProfile.tone?.toLowerCase() !== filters.tone.toLowerCase()
    ) {
      return false;
    }

    if (filters.licenseType && voice.licenseType !== filters.licenseType) {
      return false;
    }

    if (
      filters.contributor &&
      voice.contributorAddress.toLowerCase() !== filters.contributor.toLowerCase()
    ) {
      return false;
    }

    if (filters.minPrice && BigInt(voice.price) < BigInt(filters.minPrice)) {
      return false;
    }

    if (filters.maxPrice && BigInt(voice.price) > BigInt(filters.maxPrice)) {
      return false;
    }

    return true;
  });
}

async function fetchEnvioListings(): Promise<ListingAccumulator[] | null> {
  if (!envioIndexerUrl || !marketAddress) {
    return null;
  }

  const query = `
    query MarketplaceListings {
      voiceListeds(orderBy: blockTimestamp, orderDirection: desc) {
        voiceId
        contributor
        price
        isExclusive
        transactionHash
        blockTimestamp
      }
      voiceDelisteds {
        voiceId
      }
      licensePurchaseds {
        voiceId
      }
      usageReporteds {
        voiceId
        usageCount
      }
    }
  `;

  const response = await fetch(envioIndexerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Envio indexer request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "Envio indexer error");
  }

  const data = payload.data;
  if (!data?.voiceListeds) {
    return null;
  }

  const delisted = new Set(
    (data.voiceDelisteds as Array<{ voiceId: string }> | undefined)?.map(
      (item) => item.voiceId
    ) || []
  );

  const salesCount = new Map<string, bigint>();
  for (const item of (data.licensePurchaseds as Array<{ voiceId: string }> | undefined) || []) {
    salesCount.set(
      item.voiceId,
      (salesCount.get(item.voiceId) || 0n) + 1n
    );
  }

  const usageCount = new Map<string, bigint>();
  for (const item of (data.usageReporteds as Array<{ voiceId: string; usageCount: string }> | undefined) || []) {
    usageCount.set(
      item.voiceId,
      (usageCount.get(item.voiceId) || 0n) + BigInt(item.usageCount || "0")
    );
  }

  const deduped = new Map<string, ListingAccumulator>();
  for (const item of data.voiceListeds as Array<Record<string, string | boolean>>) {
    const voiceId = String(item.voiceId);
    if (deduped.has(voiceId)) {
      continue;
    }

    deduped.set(voiceId, {
      voiceId: BigInt(voiceId),
      contributor: item.contributor as Address,
      price: BigInt(String(item.price)),
      isExclusive: Boolean(item.isExclusive),
      isActive: !delisted.has(voiceId),
      totalSales: salesCount.get(voiceId) || 0n,
      totalUsage: usageCount.get(voiceId) || 0n,
      transactionHash: String(item.transactionHash || ""),
      listedAt: Number(item.blockTimestamp || "0") * 1000,
      source: "envio",
    });
  }

  return [...deduped.values()].filter((item) => item.isActive);
}

async function fetchRpcListings(): Promise<ListingAccumulator[]> {
  if (!marketAddress) {
    return [];
  }

  const logs = await client.getLogs({
    address: marketAddress,
    fromBlock: 0n,
  });

  const listings = new Map<string, ListingAccumulator>();
  const purchaseCounts = new Map<string, bigint>();
  const usageCounts = new Map<string, bigint>();
  const delisted = new Set<string>();

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: VoiceLicenseMarketABI,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "VoiceListed") {
        const block = await client.getBlock({ blockHash: log.blockHash! });
        const voiceId = decoded.args.voiceId.toString();

        listings.set(voiceId, {
          voiceId: decoded.args.voiceId,
          contributor: decoded.args.contributor,
          price: decoded.args.price,
          isExclusive: decoded.args.isExclusive,
          isActive: true,
          totalSales: purchaseCounts.get(voiceId) || 0n,
          totalUsage: usageCounts.get(voiceId) || 0n,
          transactionHash: log.transactionHash,
          listedAt: Number(block.timestamp) * 1000,
          source: "rpc",
        });
      }

      if (decoded.eventName === "VoiceDelisted") {
        delisted.add(decoded.args.voiceId.toString());
      }

      if (decoded.eventName === "LicensePurchased") {
        const voiceId = decoded.args.voiceId.toString();
        purchaseCounts.set(voiceId, (purchaseCounts.get(voiceId) || 0n) + 1n);
      }

      if (decoded.eventName === "UsageReported") {
        const voiceId = decoded.args.voiceId.toString();
        usageCounts.set(
          voiceId,
          (usageCounts.get(voiceId) || 0n) + decoded.args.usageCount
        );
      }
    } catch {
      continue;
    }
  }

  return [...listings.values()]
    .map((item) => ({
      ...item,
      isActive: item.isActive && !delisted.has(item.voiceId.toString()),
      totalSales: purchaseCounts.get(item.voiceId.toString()) || item.totalSales,
      totalUsage: usageCounts.get(item.voiceId.toString()) || item.totalUsage,
    }))
    .filter((item) => item.isActive);
}

async function fetchRecordingMetadata(voiceIds: bigint[]) {
  if (!voiceRecordsAddress || voiceIds.length === 0) {
    return new Map<string, unknown>();
  }

  const entries = await Promise.all(
    voiceIds.map(async (voiceId) => {
      try {
        const result = await client.readContract({
          address: voiceRecordsAddress,
          abi: VoiceRecordsABI as any,
          functionName: "getRecording",
          args: [voiceId],
        });

        return [voiceId.toString(), { result }] as const;
      } catch {
        return [voiceId.toString(), null] as const;
      }
    })
  );

  return new Map(entries);
}

function buildVoiceProfile(
  metadata: Record<string, unknown>,
  fallbackTitle?: string
) {
  const tags = toTextArray(metadata.tags);

  return {
    tone:
      typeof metadata.tone === "string"
        ? metadata.tone
        : fallbackTitle?.split("-")[1]?.trim() || "Authentic",
    pitch: typeof metadata.pitch === "string" ? metadata.pitch : "medium",
    language:
      typeof metadata.language === "string" ? metadata.language : "en-US",
    accent: typeof metadata.accent === "string" ? metadata.accent : "Unknown",
    tags,
  };
}

function buildTrust(metadata: Record<string, unknown>, source: Source) {
  const humanity =
    typeof metadata.humanityCertificate === "object" &&
    metadata.humanityCertificate !== null
      ? (metadata.humanityCertificate as Record<string, unknown>)
      : null;

  const humanityStatus =
    typeof humanity?.status === "string" ? humanity.status : undefined;
  const humanityBadge =
    typeof humanity?.badge === "string" ? humanity.badge : undefined;
  const humanityVerdict =
    typeof humanity?.verdict === "string" ? humanity.verdict : undefined;

  if (humanityStatus === "verified-human") {
    return {
      badge: humanityBadge || "Gemini-Verified Human",
      status: "verified" as const,
      source,
      details: humanityVerdict || "Audio passed human-likeness checks.",
    };
  }

  if (humanityStatus === "review-needed" || humanityStatus === "uncertain") {
    return {
      badge: humanityBadge || "Trust Review",
      status: "review" as const,
      source,
      details:
        humanityVerdict || "Sample needs manual review before stronger claims.",
    };
  }

  return {
    badge: "Onchain Provenance",
    status: "provenance" as const,
    source,
    details: "Listing source is the live Base contract state.",
  };
}

export async function getMarketplaceListings(
  filters: ListingFilters = {}
): Promise<MarketplaceVoice[]> {
  const indexedListings =
    (await fetchEnvioListings().catch((error) => {
      console.warn("Envio indexer unavailable, falling back to RPC:", error);
      return null;
    })) || (await fetchRpcListings());

  const metadataMap = await fetchRecordingMetadata(
    indexedListings.map((listing) => listing.voiceId)
  );

  const voices = indexedListings.map((listing) => {
    const recordingResult = metadataMap.get(listing.voiceId.toString());
    const recording =
      recordingResult && typeof recordingResult === "object" && "result" in recordingResult
        ? (recordingResult as { result?: readonly unknown[] })
        : null;

    const tuple = Array.isArray(recording?.result)
      ? recording?.result
      : undefined;
    const ipfsHash = typeof tuple?.[1] === "string" ? tuple[1] : undefined;
    const title = typeof tuple?.[2] === "string" ? tuple[2] : undefined;
    const rawMetadata = typeof tuple?.[3] === "string" ? tuple[3] : undefined;
    const createdAt =
      typeof tuple?.[5] === "bigint" ? Number(tuple[5]) * 1000 : undefined;

    const parsedMetadata = normalizeMetadata(rawMetadata);
    const voiceProfile = buildVoiceProfile(parsedMetadata, title);
    const trust = buildTrust(parsedMetadata, listing.source);

    return {
      id: `voice_${listing.voiceId.toString()}`,
      contractVoiceId: listing.voiceId.toString(),
      contributorAddress: listing.contributor,
      price: listing.price.toString(),
      licenseType: listing.isExclusive ? "exclusive" : "non-exclusive",
      voiceProfile,
      metadata: {
        title,
        duration:
          typeof parsedMetadata.duration === "number"
            ? parsedMetadata.duration
            : undefined,
        sampleRate:
          typeof parsedMetadata.sampleRate === "number"
            ? parsedMetadata.sampleRate
            : undefined,
        ipfsHash,
        createdAt,
        updatedAt:
          typeof parsedMetadata.updatedAt === "number"
            ? parsedMetadata.updatedAt
            : undefined,
      },
      stats: {
        views:
          typeof parsedMetadata.views === "number" ? parsedMetadata.views : 0,
        purchases: Number(listing.totalSales),
        usageCount: Number(listing.totalUsage),
      },
      status: listing.isActive ? "approved" : "delisted",
      sampleUrl: buildSampleUrl(ipfsHash),
      trust,
      provenance: {
        source: listing.source,
        contractAddress: marketAddress,
        listingTxHash: listing.transactionHash,
        listedAt: listing.listedAt,
      },
    } satisfies MarketplaceVoice;
  });

  return applyFilters(voices, filters);
}

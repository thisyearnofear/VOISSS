import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";
import { getPageMetadata } from "@/lib/page-metadata";
import {
  DEMO_VOICES,
  formatMonthlyPriceUsdc,
  voiceDisplayName,
} from "@/lib/voice-detail";
import { VoiceListeningRoom } from "@/components/listening/VoiceListeningRoom";

interface VoiceDetailPageProps {
  params: Promise<{ voiceId: string }>;
}

async function fetchVoice(voiceId: string): Promise<MarketplaceVoice | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://voisss.netlify.app";
  try {
    const res = await fetch(`${baseUrl}/api/marketplace/voices?limit=500`, {
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!res.ok) return null;
    const data = await res.json();
    const voices: MarketplaceVoice[] = Array.isArray(data?.data?.voices)
      ? data.data.voices
      : [];
    return (
      voices.find((v) => v.id === voiceId || v.contractVoiceId === voiceId) ||
      null
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: VoiceDetailPageProps): Promise<Metadata> {
  const { voiceId } = await params;
  const voice = DEMO_VOICES[voiceId] || null;
  const name = voice ? voiceDisplayName(voice) : "Voice";
  const language = voice?.voiceProfile?.language || "English";
  const title = `${name} Voice — Licensed for AI Agents | VOISSS`;
  const description = `License the ${name} AI voice (${language}). Enterprise-grade API, blockchain-verified provenance. ${voice?.licenseType} licensing on Base.`;

  return {
    title,
    description,
    ...getPageMetadata("/marketplace"),
    alternates: {
      canonical: `/marketplace/voices/${voiceId}`,
    },
    openGraph: {
      title,
      description,
      url: `/marketplace/voices/${voiceId}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function VoiceDetailPage({ params }: VoiceDetailPageProps) {
  const { voiceId } = await params;
  const voice = await fetchVoice(voiceId);
  const displayVoice = voice || DEMO_VOICES[voiceId];

  if (!displayVoice) {
    notFound();
  }

  const name = voiceDisplayName(displayVoice);
  const language = displayVoice.voiceProfile?.language || "English";
  const accent = displayVoice.voiceProfile?.accent || "Neutral";

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${name} AI Voice`,
    description: `Licensed ${name} voice (${language}, ${accent}) for AI agents. Enterprise-grade API with blockchain-verified provenance.`,
    brand: { "@type": "Brand", name: "VOISSS" },
    offers: {
      "@type": "Offer",
      price: formatMonthlyPriceUsdc(displayVoice.price),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `/marketplace/voices/${voiceId}`,
      seller: {
        "@type": "Organization",
        name: "VOISSS",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: displayVoice.reputation?.trustScore?.toString() || "85",
      reviewCount: displayVoice.stats?.purchases?.toString() || "0",
      bestRating: "100",
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Language", value: language },
      { "@type": "PropertyValue", name: "Accent", value: accent },
      {
        "@type": "PropertyValue",
        name: "License",
        value: displayVoice.licenseType,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <VoiceListeningRoom voice={displayVoice} />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, ExternalLink, Globe, Shield, DollarSign, FileText, Users } from "lucide-react";
import { getPageMetadata } from "@/lib/page-metadata";

interface VoiceDetailPageProps {
  params: Promise<{ voiceId: string }>;
}

interface VoiceData {
  id: string;
  contractVoiceId?: string;
  contributorAddress: string;
  price: string;
  licenseType: "exclusive" | "non-exclusive";
  voiceProfile: {
    tone?: string;
    pitch?: string;
    language?: string;
    accent?: string;
    tags?: string[];
  };
  stats: {
    views: number;
    purchases: number;
    usageCount: number;
  };
  metadata?: {
    title?: string;
    description?: string;
    sampleUrl?: string;
    provenance?: string;
  };
  trust?: {
    badge: string;
    status: "verified" | "review" | "provenance";
    details: string;
  };
  reputation?: {
    trustScore: number;
    reputation: number;
    threatLevel: "green" | "yellow" | "orange" | "red";
  };
}

async function fetchVoice(voiceId: string): Promise<VoiceData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://voisss.netlify.app";
  try {
    const res = await fetch(`${baseUrl}/api/marketplace/voices?limit=500`, {
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!res.ok) return null;
    const data = await res.json();
    const voice = data.data?.voices?.find(
      (v: VoiceData) => v.id === voiceId || v.contractVoiceId === voiceId
    );
    return voice || null;
  } catch {
    return null;
  }
}

// Curated demo voices for the detail page
const DEMO_VOICES: Record<string, VoiceData> = {
  "demo-rachel": {
    id: "demo-rachel",
    contractVoiceId: "21m00Tcm4TlvDq8ikWAM",
    contributorAddress: "0xDEMO",
    price: "1",
    licenseType: "non-exclusive",
    voiceProfile: { tone: "Rachel", language: "en-US", accent: "American" },
    stats: { views: 100, purchases: 50, usageCount: 1000 },
  },
  "demo-antoni": {
    id: "demo-antoni",
    contractVoiceId: "ErXwobaYiN019PkySvjV",
    contributorAddress: "0xDEMO",
    price: "1",
    licenseType: "non-exclusive",
    voiceProfile: { tone: "Antoni", language: "en-US", accent: "American" },
    stats: { views: 100, purchases: 50, usageCount: 1000 },
  },
  "demo-bella": {
    id: "demo-bella",
    contractVoiceId: "EXAVITQu4vr4xnSDxMaL",
    contributorAddress: "0xDEMO",
    price: "1",
    licenseType: "non-exclusive",
    voiceProfile: { tone: "Bella", language: "en-US", accent: "American" },
    stats: { views: 100, purchases: 50, usageCount: 1000 },
  },
};

function PriceBadge({ price, licenseType }: { price: string; licenseType: string }) {
  const usdc = (parseInt(price, 10) / 1_000_000).toFixed(2);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <DollarSign className="w-3.5 h-3.5" />
        <span className="font-mono">${usdc}/mo</span>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md w-fit ${
        licenseType === "exclusive"
          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
      }`}>
        {licenseType}
      </span>
    </div>
  );
}

export async function generateMetadata({ params }: VoiceDetailPageProps): Promise<Metadata> {
  const { voiceId } = await params;
  const voice = DEMO_VOICES[voiceId] || null;
  const tone = voice?.voiceProfile?.tone || "Voice";
  const language = voice?.voiceProfile?.language || "English";
  const title = `${tone} Voice — Licensed for AI Agents | VOISSS`;
  const description = `License the ${tone} AI voice (${language}). Enterprise-grade API, blockchain-verified provenance. ${voice?.licenseType} licensing on Base.`;

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
  const demoVoice = DEMO_VOICES[voiceId];
  const displayVoice = voice || demoVoice;

  if (!displayVoice) {
    notFound();
  }

  const usdcPrice = (parseInt(displayVoice.price, 10) / 1_000_000).toFixed(2);
  const language = displayVoice.voiceProfile?.language || "English";
  const accent = displayVoice.voiceProfile?.accent || "Neutral";
  const tone = displayVoice.voiceProfile?.tone || "Professional";
  const sampleUrl = displayVoice.metadata?.sampleUrl;
  const provenance = displayVoice.metadata?.provenance || "VOISSS Marketplace";
  const contributorAddress = displayVoice.contributorAddress;

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${tone} AI Voice`,
    description: `Licensed ${tone} voice (${language}, ${accent}) for AI agents. Enterprise-grade API with blockchain-verified provenance.`,
    brand: { "@type": "Brand", name: "VOISSS" },
    offers: {
      "@type": "Offer",
      price: usdcPrice,
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
      { "@type": "PropertyValue", name: "License Type", value: displayVoice.licenseType },
      { "@type": "PropertyValue", name: "Provenance", value: provenance },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Header */}
      <div className="border-b border-[#2A2A2A] voisss-bg-mesh">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 mb-4">
            ← Back to Marketplace
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">{tone} Voice</h1>
                {displayVoice.trust && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    displayVoice.trust.status === "verified"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                  }`}>
                    {displayVoice.trust.badge}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">
                {language} · {accent} · {displayVoice.licenseType} license
              </p>
            </div>
            <PriceBadge price={displayVoice.price} licenseType={displayVoice.licenseType} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Voice info & sample */}
          <div className="lg:col-span-2 space-y-8">
            {/* Preview */}
            <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Preview</h2>
              {sampleUrl ? (
                <audio controls src={sampleUrl} className="w-full rounded-lg" />
              ) : (
                <div className="p-6 bg-[#0A0A0A] rounded-xl border border-white/5 text-center">
                  <p className="text-sm text-gray-400 mb-3">
                    Sample not available for this voice. Try the full demo.
                  </p>
                  <Link
                    href={`/demo?voiceId=${displayVoice.contractVoiceId || displayVoice.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-sm font-semibold hover:from-purple-500 hover:to-pink-500 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Try in Demo
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={<Globe className="w-4 h-4" />} label="Language" value={language} />
                <DetailItem icon={<Globe className="w-4 h-4" />} label="Accent" value={accent} />
                <DetailItem icon={<FileText className="w-4 h-4" />} label="License" value={displayVoice.licenseType} />
                <DetailItem icon={<Shield className="w-4 h-4" />} label="Provenance" value={provenance} />
              </dl>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Uses" value={displayVoice.stats.usageCount.toLocaleString()} />
              <StatCard label="Sales" value={displayVoice.stats.purchases.toString()} />
              <StatCard label="Views" value={displayVoice.stats.views.toLocaleString()} />
            </div>
          </div>

          {/* Right: CTA & contributor */}
          <div className="space-y-6">
            <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-1">
                ${usdcPrice}
                <span className="text-sm font-normal text-gray-400">/mo</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Per-character rate: ${displayVoice.price === "1" ? "0.000001" : (parseInt(displayVoice.price, 10) / 10_000_000).toFixed(7)}</p>
              <Link
                href={`/demo?voiceId=${displayVoice.contractVoiceId || displayVoice.id}`}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mb-3"
              >
                <Play className="w-4 h-4" />
                Try in Demo
              </Link>
              <Link
                href="/marketplace"
                className="w-full py-3 border border-white/10 hover:border-white/20 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                Browse All Voices
              </Link>
            </div>

            {/* Contributor */}
            <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Contributor</span>
              </div>
              <code className="text-xs text-gray-500 font-mono break-all">
                {contributorAddress.slice(0, 10)}…{contributorAddress.slice(-6)}
              </code>
              <a
                href={`https://basescan.org/address/${contributorAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 mt-2"
              >
                View on Basescan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-gray-500">{label}</div>
        <div className="text-sm font-medium text-white capitalize">{value}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{label}</div>
    </div>
  );
}

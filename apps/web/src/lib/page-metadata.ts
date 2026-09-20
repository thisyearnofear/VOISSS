import type { Metadata } from "next";

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_BASE_URL || "https://voisss.netlify.app"
);

export type PageMetadata = {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
};

export const PAGE_METADATA: Record<string, PageMetadata> = {
  '/': {
    title: 'VOISSS | Voice Marketplace — Describe the Voice, Get Ranked Matches',
    description: 'Type what you need in plain English. Every real voice is scored, ranked, and explained by an auditable matching rubric. Preview instantly, pay per use. Built on Base.',
  },
  '/marketplace': {
    title: 'Discover | VOISSS Voice Marketplace',
    description: 'Describe the voice you need — intent matching scores and ranks real voices with reasons. Preview instantly, license or pay per character.',
  },
  '/generate': {
    title: 'Generate | VOISSS Voice Generation',
    description: 'Turn text into speech with a real marketplace voice. Free previews, pay-per-character pricing, 70% to voice creators.',
  },
  '/sell': {
    title: 'Sell Your Voice | VOISSS',
    description: 'Record or import your ElevenLabs voices to the VOISSS marketplace. Earn 70% of every license and use.',
  },
  '/sell/import': {
    title: 'Import | Bring Your ElevenLabs Voices to VOISSS',
    description: 'Import your ElevenLabs voices to the VOISSS marketplace. Earn 70% revenue share when AI agents license your voice.',
  },
  '/sell/dashboard': {
    title: 'Dashboard | VOISSS Contributor',
    description: 'Manage your VOISSS voice listings, pricing, and earnings.',
  },
  '/developers': {
    title: 'API | VOISSS for Developers',
    description: 'Integrate licensed human voices into your AI agent. REST API, x402 payments, OpenAPI spec, agent wallets.',
  },
  '/benchmarks': {
    title: 'Benchmarks | VOISSS Matching Engine',
    description: 'Live benchmark of the VOISSS intent-matching engine. Jev vs GPT-4o-mini scoring the real marketplace catalog — measured, reproducible.',
  },
  '/help': {
    title: 'Help | VOISSS FAQ & Support',
    description: 'Frequently asked questions about VOISSS voice licensing, payments, and API integration.',
  },
  '/contact': {
    title: 'Contact | VOISSS',
    description: 'Get in touch with the VOISSS team. Questions about voice licensing, partnerships, or API access.',
  },
  '/privacy': {
    title: 'Privacy | VOISSS',
    description: 'Read how VOISSS handles voice, account, and payment data.',
  },
};

/** Build complete, route-specific Next.js metadata from the public URL. */
export function getPageMetadata(pathname: keyof typeof PAGE_METADATA): Metadata {
  const page = PAGE_METADATA[pathname];
  const canonical = new URL(pathname, siteUrl).toString();

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical },
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: "VOISSS",
      locale: "en_US",
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: page.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/og-image.png"],
    },
  };
}

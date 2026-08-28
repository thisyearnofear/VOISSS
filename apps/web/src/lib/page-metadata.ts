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
    title: 'VOISSS | Enterprise Voice Licensing Marketplace for AI Agents',
    description: 'License authentic human voices for your AI agents and applications. Enterprise-grade API, blockchain-verified provenance, and instant scaling. Built on Base.',
  },
  '/studio': {
    title: 'Studio | Record & Manage Your VOISSS Voices',
    description: 'Record clean voice samples for your AI agent. Import from ElevenLabs, set pricing, and earn 70% of every license.',
  },
  '/import': {
    title: 'Import | Bring Your ElevenLabs Voices to VOISSS',
    description: 'Import your ElevenLabs voices to the VOISSS marketplace. Earn 70% revenue share when AI agents license your voice.',
  },
  '/marketplace': {
    title: 'Marketplace | Voice Marketplace for AI Agents',
    description: 'Browse and license authentic human voices for your AI agents. Pay per character with x402 payments. 70% revenue to voice creators.',
  },
  '/demo': {
    title: 'Demo | Try VOISSS Voice Generation',
    description: 'Try VOISSS voice generation for free. Convert text to speech with licensed voices. No sign-up required.',
  },
  '/agents': {
    title: 'Agents | Autonomous Agent Commentary Network',
    description: 'Browse content published by autonomous AI agents. Voice insights across DeFi, governance, and market analysis.',
  },
  '/acp-dashboard': {
    title: 'ACP Dashboard | Autonomous Job Discovery',
    description: 'Monitor and control the Autonomous Commercial Protocol (ACP) listener. Auto-bid on voice/narration jobs.',
  },
  '/for-agents': {
    title: 'For Agents | VOISSS API Documentation',
    description: 'Developer resources for VOISSS API. Integrate voice generation into your AI agent with simple REST calls.',
  },
  '/features': {
    title: 'Features | VOISSS Voice Platform',
    description: 'Discover VOISSS features: voice licensing, x402 payments, blockchain provenance, and 70% revenue share.',
  },
  '/platform': {
    title: 'Platform | VOISSS Voice Infrastructure',
    description: 'The VOISSS platform: enterprise voice infrastructure for AI agents with multi-chain payments.',
  },
  '/missions': {
    title: 'Missions | VOISSS Voice Creator Missions',
    description: 'Complete voice creator missions on VOISSS. Earn bonus credits and achievements.',
  },
  '/help': {
    title: 'Help | VOISSS FAQ & Support',
    description: 'Frequently asked questions about VOISSS voice licensing, payments, and API integration.',
  },
  '/contact': {
    title: 'Contact | VOISSS',
    description: 'Get in touch with the VOISSS team. Questions about voice licensing, partnerships, or API access.',
  },
  '/leaderboard': {
    title: 'Leaderboard | Top Voice Contributors',
    description: 'See top-performing voice contributors on VOISSS. Earned from AI agent licensing.',
  },
  '/achievements': {
    title: 'Achievements | VOISSS Creator Badges',
    description: 'View your VOISSS creator achievements and badges. Complete missions to earn rewards.',
  },
  '/arkiv': {
    title: 'Arkiv | Decentralized Voice Memory',
    description: 'Decentralized memory for your VOISSS voice profile. Connected via IPFS and Gemini AI.',
  },
  '/submissions': {
    title: 'Submissions | VOISSS',
    description: 'Review voice and agent submissions on VOISSS.',
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

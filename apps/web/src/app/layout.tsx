import type { Metadata } from "next";
import { Inter, Anton, Syne, Courier_Prime } from "next/font/google";
import { BaseProvider } from "./providers";
import ScrollLife from "../components/ScrollLife";
import { ReferralTracker } from "./referral-tracker";
import "./globals.css";
import "../styles/listening-room.css";
import { validateX402Config } from "@/lib/x402-startup-check";
import { getPageMetadata } from "@/lib/page-metadata";
import { ListeningRoomProvider } from "../contexts/ListeningRoomContext";
import ListeningShell from "../components/listening/ListeningShell";

// Validate x402 configuration on server startup
if (typeof window === 'undefined') {
  validateX402Config();
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const anton = Anton({
  weight: '400',
  variable: "--font-anton",
  subsets: ["latin"],
  display: 'swap',
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: 'swap',
});

const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  variable: "--font-courier-prime",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "VOISSS | Enterprise Voice Licensing Marketplace for AI Agents",
  description: "License authentic human voices for your AI agents and applications. Enterprise-grade API, blockchain-verified provenance, and instant scaling. Built on Base.",
  keywords: [
    "enterprise voice licensing",
    "B2B voice marketplace",
    "AI agent voices",
    "voice API for developers",
    "Base blockchain",
    "x402 payments",
    "AI voice licensing",
    "blockchain provenance",
    "ElevenLabs enterprise",
    "Web3 voice",
  ],
  authors: [{ name: "VOISSS Team" }],
  creator: "VOISSS",
  publisher: "VOISSS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  ...getPageMetadata("/"),
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://voisss.netlify.app"
  ),
  openGraph: {
    title: "VOISSS | Enterprise Voice Licensing Marketplace for AI Agents",
    description: "License authentic human voices for your AI agents and applications. Enterprise-grade API, blockchain-verified provenance, and instant scaling. Built on Base.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://voisss.netlify.app",
    siteName: "VOISSS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VOISSS - Enterprise Voice Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOISSS | Enterprise Voice Licensing Marketplace for AI Agents",
    description: "License authentic human voices for your AI agents and applications. Enterprise-grade API, blockchain-verified provenance, and instant scaling. Built on Base.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7C5DFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* Marks the document as JS-capable before first paint, so scroll-reveal
            styles (`.js [data-reveal]`) only hide content when JS can reveal it.
            Without this, a no-JS visitor would see blank sections. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Analytics - Google Analytics (next/script for optimal loading) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
        )}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `,
            }}
          />
        )}
      </head>
      <body
        className={`${inter.variable} ${anton.variable} ${syne.variable} ${courierPrime.variable} antialiased font-sans`}
        suppressHydrationWarning={true}
      >
        <BaseProvider>
          <ReferralTracker />
          {/* One observer for every route: staged reveals for [data-reveal] plus
              the scroll progress rail. Mounted here so any page can opt in. */}
          <ScrollLife />
          <ListeningRoomProvider>
            <ListeningShell>{children}</ListeningShell>
          </ListeningRoomProvider>
        </BaseProvider>
      </body>
    </html>
  );
}

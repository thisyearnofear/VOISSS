import type { Metadata } from "next";
import { Inter, Anton, Syne, Courier_Prime } from "next/font/google";
import { BaseProvider } from "./providers";
import Nav from "../components/Nav";
import VoiceAssistant from "../components/VoiceAssistant";
import "./globals.css";

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
  title: "VOISSS | Morph Your Voice",
  description: "Transform your voice with AI, store securely onchain.",
  keywords: [
    "voice recording",
    "AI voice transformation",
    "Base",
    "blockchain",
    "decentralized",
    "IPFS",
    "voice cloning",
    "ElevenLabs",
    "Web3",
    "SocialFi",
  ],
  authors: [{ name: "VOISSS Team" }],
  creator: "VOISSS",
  publisher: "VOISSS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://voisss.vercel.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VOISSS | Morph Your Voice",
    description: "Transform your voice with AI, store securely onchain.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://voisss.vercel.app",
    siteName: "VOISSS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VOISSS - Morph Your Voice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOISSS | Morph Your Voice",
    description: "Transform your voice with AI, store securely onchain.",
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

        {/* Analytics - Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
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
          </>
        )}
      </head>
      <body
        className={`${inter.variable} ${anton.variable} ${syne.variable} ${courierPrime.variable} antialiased font-sans`}
        suppressHydrationWarning={true}
      >
        <BaseProvider>
          <Nav />
          {children}
          <VoiceAssistant />
        </BaseProvider>
      </body>
    </html>
  );
}

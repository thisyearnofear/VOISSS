import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BaseProvider } from "./providers";
import Nav from "../components/Nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VOISSS | Gasless Voice Recording",
  description: "Transform your voice with AI, store securely on blockchain, and earn rewards. The ultimate gasless voice recording platform.",
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
    "SocialFi"
  ],
  authors: [{ name: "VOISSS Team" }],
  creator: "VOISSS",
  publisher: "VOISSS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://voisss.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "VOISSS | Gasless Voice Recording",
    description: "Transform your voice with AI, store securely on blockchain, and earn rewards. The ultimate decentralized voice recording platform.",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://voisss.vercel.app',
    siteName: "VOISSS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VOISSS - Gasless Voice Recording",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOISSS | Gasless Voice Recording",
    description: "Transform your voice with AI, store securely on blockchain, and earn rewards.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
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
    <html lang="en">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
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
      <body className={`${inter.variable} antialiased`}>
        <BaseProvider>
          <Nav />
          {children}
        </BaseProvider>
      </body>
    </html>
  );
}

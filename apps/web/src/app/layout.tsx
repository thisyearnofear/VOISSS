import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StarknetProvider } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VOISSS - Decentralized Voice Recording Platform",
  description:
    "Next-generation voice recording platform built for Starknet Reignite Hackathon. Transform how you capture, organize, and share audio content with decentralized storage and community features.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <StarknetProvider>{children}</StarknetProvider>
      </body>
    </html>
  );
}

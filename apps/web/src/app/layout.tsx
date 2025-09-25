import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StarknetProvider } from "./providers";
import Nav from "../components/Nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VOISSS | Transform Your Voice",
  description: "Record, transform, store securely & share.",
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
        <StarknetProvider>
          <Nav />
          {children}
        </StarknetProvider>
      </body>
    </html>
  );
}

import { StarknetConfig, publicProvider } from "@starknet-react/core";
import { goerli, mainnet } from "@starknet-react/chains";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VOISSS",
  description: "Next-generation voice recording platform on Starknet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StarknetConfig chains={[goerli, mainnet]} provider={publicProvider()}>
          {children}
        </StarknetConfig>
      </body>
    </html>
  );
}

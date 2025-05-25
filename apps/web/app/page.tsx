"use client";

import { useConnect } from "@starknet-react/core";
import { useState } from "react";

export default function Home() {
  const { connect, connectors } = useConnect();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const available = connectors.filter((c) => c.available());
      if (available.length > 0) {
        await connect({ connector: available[0] });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
    setConnecting(false);
  };

  const hasAvailableConnectors = connectors.some((c) => c.available());

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">VOISSS</h1>
        <button
          onClick={handleConnect}
          disabled={connecting || !hasAvailableConnectors}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {connecting
            ? "Connecting..."
            : !hasAvailableConnectors
            ? "No Wallet Found"
            : "Connect Wallet"}
        </button>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useConnect } from "wagmi";
import { useBase } from "@/app/providers";

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function ConnectModal({ open, onClose, onConnected }: ConnectModalProps) {
  const { connectors, connectAsync, status, error } = useConnect();
  const baseCtx = useBase();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Prefer ordering: Coinbase Smart Wallet -> injected -> WalletConnect
  const ordered = [...connectors].sort((a, b) => {
    const rank = (id: string) => {
      if (id === "coinbaseWalletSDK") return 0;
      if (id === "coinbaseWallet") return 0;
      if (id === "injected") return 1;
      if (id.includes("walletConnect")) return 2;
      return 3;
    };
    return rank(a.id) - rank(b.id);
  });

  const labelFor = (c: { id: string; name: string }) => {
    if (c.id.includes("coinbaseWallet")) return "Coinbase Smart Wallet";
    if (c.id === "injected") return "Browser Wallet";
    if (c.id.includes("walletConnect")) return "WalletConnect";
    return c.name;
  };

  const descFor = (id: string) => {
    if (id.includes("coinbaseWallet")) return "Gasless Sub Accounts · Base native · Recommended";
    if (id === "injected") return "MetaMask · Rabby · Brave · Phantom";
    if (id.includes("walletConnect")) return "Mobile · Farcaster · 300+ wallets · QR";
    return "";
  };

  const handleConnect = async (connector: (typeof connectors)[number]) => {
    setBusyId(connector.id);
    try {
      // Base SDK pre-warm so SIWE uses wallet_connect capability when available
      if (connector.id.includes("coinbaseWallet") && baseCtx?.provider) {
        // no-op, Wagmi's coinbaseWallet will still use the same SDK under the hood
      }
      await connectAsync({ connector });
      onConnected?.();
      onClose();
    } catch (e) {
      console.warn("connect failed", e);
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0F0F0F] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-white">Connect a wallet</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          No account needed to browse. Sign to license, sell, or call the API. Base is primary — every wallet
          verifies via the same SIWE.
        </p>

        <div className="mt-5 grid gap-2">
          {ordered.map((c) => (
            <button
              key={c.id}
              onClick={() => handleConnect(c)}
              disabled={busyId !== null}
              className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left hover:border-[var(--lr-accent)] hover:bg-white/[0.04] disabled:opacity-60"
            >
              <span>
                <span className="block text-sm font-semibold text-white">{labelFor(c)}</span>
                <span className="block text-xs text-white/55">{descFor(c.id)}</span>
              </span>
              <span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/70 group-hover:border-[var(--lr-accent)] group-hover:text-[var(--lr-accent)]">
                {busyId === c.id ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "→"
                )}
              </span>
            </button>
          ))}
        </div>

        {status === "pending" && <p className="mt-3 text-xs text-white/50">Opening wallet…</p>}
        {error && (
          <p className="mt-3 text-xs text-red-300" role="status">
            {(error as Error).message}
          </p>
        )}

        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <p className="text-xs font-medium text-white/70">Coinbase Smart Wallet stays super-powered</p>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Sub Accounts + gasless + batched paymaster remain opt-in after you connect. We no longer gate browsing.
          </p>
        </div>

        <p className="mt-3 text-center text-[11px] tracking-wide text-white/40">
          By connecting you agree to sign a one-time message to verify ownership. No gas.
        </p>
      </div>
    </div>
  );
}

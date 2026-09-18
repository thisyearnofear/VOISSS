/**
 * DashboardBalanceChips — live balance surface for both sides of the marketplace
 *
 * Contributor view (/marketplace/dashboard): credits + Tier + Dynamic rails
 * Buyer view (/marketplace): compact credits strip when authenticated
 *
 * Design:
 *  - Feels like Stripe / Linear — muted VOISSS palette (#0A0A0A / #1A1A1A / #2A2A2A),
 *    Syne headings, purple #7C5DFA only on the primary CTA.
 *  - Wallet USDC is the *on-chain* balance (wagmi useBalance on Base).
 *  - VOISSS credits is the *internal* balance (useAgentCredits → /api/agents/credits).
 *  - Tier + per-char cost from the same quote — explains why credits matter.
 *  - Deposit opens CreditDepositModal directly; after success, both chips refresh.
 *  - Never blocks the page: skeletons when loading, dashed empty when zero, error is a tiny retry pill.
 */

"use client";

import React, { useCallback, useState } from "react";
import { Coins, Crown, ExternalLink, Plus, RefreshCw, Sparkles, Wallet } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { base } from "wagmi/chains";
import { useAgentCredits } from "@/hooks/useAgentCredits";
import { useDynamicWallet } from "@/hooks/useDynamicWallet";
import { CreditDepositModal } from "./CreditDepositModal";

// USDC on Base
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

// ---------------------------------------------------------------------------
// tiny helpers
// ---------------------------------------------------------------------------

function TierPill({ tier, discount }: { tier?: string | null; discount?: number | null }) {
  const normalized = (tier ?? "none").toLowerCase();
  const colors: Record<string, string> = {
    premium: "bg-amber-500/15 border-amber-500/25 text-amber-200",
    pro: "bg-[#7C5DFA]/15 border-[#7C5DFA]/25 text-[#C4B5FD]",
    basic: "bg-cyan-500/15 border-cyan-500/25 text-cyan-200",
    none: "bg-[#1A1A1A] border-[#2A2A2A] text-gray-500",
  };
  const cls = colors[normalized] ?? colors.none;
  const label = normalized === "none" ? "No tier" : normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-widest uppercase ${cls}`}>
      <Crown className="h-3 w-3" />
      {label}
      {typeof discount === "number" && discount > 0 ? <span className="font-mono normal-case tracking-normal text-[11px]">· −{discount}%</span> : null}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#0A0A0A]/60 px-3 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-[#1A1A1A]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 rounded bg-[#1A1A1A]" />
        <div className="h-4 w-28 rounded bg-[#1A1A1A]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contributor header strip — 1..3 chips depending on state
// ---------------------------------------------------------------------------

export function DashboardBalanceStrip({
  agentRegistryAddress,
  onDepositSuccess,
}: {
  agentRegistryAddress: string;
  onDepositSuccess?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const credits = useAgentCredits(address as string | undefined);
  const dyn = useDynamicWallet(address as string | undefined);
  const walletUsdc = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: base.id,
    token: USDC_BASE,
    query: { enabled: !!address && isConnected },
  });
  const [depositOpen, setDepositOpen] = useState(false);

  const handleDeposited = useCallback(
    (amount: bigint) => {
      void credits.refresh();
      void walletUsdc.refetch?.();
      onDepositSuccess?.();
      void amount;
    },
    [credits, walletUsdc, onDepositSuccess]
  );

  if (!isConnected || !address) return null;

  const creditsLoading = credits.isLoading && !credits.balance;
  const walletLoading = walletUsdc.isLoading && walletUsdc.data === undefined;
  const discount = credits.quote?.discountPercent ?? 0;
  const tier = credits.quote?.currentTier ?? null;
  const perCharWei = credits.quote?.unitCost ?? null;
  const perCharLabel = (() => {
    if (perCharWei == null) return null;
    try {
      const n = BigInt(perCharWei);
      // 1n = $0.000001
      if (n === 0n) return "Free with tier";
      if (n === 1n) return "$0.000001 / char";
      return `$${(Number(n) / 1e6).toFixed(6)} / char`;
    } catch {
      return null;
    }
  })();

  return (
    <>
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#0F0F0F]/70 backdrop-blur-sm overflow-hidden">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-[#2A2A2A] bg-[#0A0A0A]/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#7C5DFA]/15 border border-[#7C5DFA]/20 text-[#9C88FF]">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-white">Your funds</span>
            <span className="hidden sm:inline text-xs text-gray-500">Balance + agent wallet — one row</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TierPill tier={tier} discount={discount} />
            <button
              type="button"
              onClick={() => {
                void credits.refresh();
                void walletUsdc.refetch?.();
              }}
              className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] p-1.5 text-gray-500 hover:text-white transition-colors"
              aria-label="Refresh balances"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${credits.isRefreshing || walletUsdc.isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="p-2 sm:p-3 grid gap-2 sm:grid-cols-3">
          {/* VOISSS credits (internal) */}
          {creditsLoading ? (
            <SkeletonRow />
          ) : (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-3 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#7C5DFA]/15 border border-[#7C5DFA]/20 text-[#9C88FF]">
                <Coins className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold tracking-widest uppercase text-gray-500">VOISSS credits</div>
                <div className="text-sm font-semibold text-white leading-tight" title={credits.balanceWei ?? undefined}>
                  {credits.error ? (
                    <span className="text-red-300 text-xs">Failed to load</span>
                  ) : credits.balanceFormatted ? (
                    credits.balanceFormatted
                  ) : (
                    <span className="text-gray-500">$0</span>
                  )}
                  <span className="ml-1.5 text-xs font-normal text-gray-500">USDC</span>
                </div>
                <div className="text-xs text-gray-500 leading-tight truncate">
                  {perCharLabel ?? (credits.quote ? `$0.000001 / char` : "—")}
                  {discount > 0 ? <span className="text-emerald-300/80"> · tier saves {discount}%</span> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDepositOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-gray-100 transition-colors shadow"
              >
                <Plus className="h-3.5 w-3.5" /> Top up
              </button>
            </div>
          )}

          {/* Wallet USDC (Base) */}
          {walletLoading ? (
            <SkeletonRow />
          ) : (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-3 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-300">
                <Wallet className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold tracking-widest uppercase text-gray-500">Wallet USDC · Base</div>
                <div className="text-sm font-semibold text-white leading-tight">
                  {walletUsdc.error ? (
                    <span className="text-red-300 text-xs">Unavailable</span>
                  ) : walletUsdc.data ? (
                    <>
                      {Number(walletUsdc.data.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      <span className="ml-1.5 text-xs font-normal text-gray-500">{walletUsdc.data.symbol}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
                <a
                  href={`https://basescan.org/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  View on BaseScan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Agent wallet (compact) */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-3 flex items-center gap-3">
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg border ${
                dyn.hasWallet
                  ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-300"
                  : "bg-[#1A1A1A] border-[#2A2A2A] text-gray-500"
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold tracking-widest uppercase text-gray-500">Agent wallet</div>
              <div className="text-xs font-medium leading-tight">
                {dyn.isLoading ? (
                  <span className="text-gray-500">Checking…</span>
                ) : dyn.hasWallet && dyn.wallet ? (
                  <span className="font-mono text-white">
                    {dyn.wallet.address.slice(0, 6)}…{dyn.wallet.address.slice(-4)}
                  </span>
                ) : dyn.status?.configured ? (
                  <span className="text-amber-300">Ready to create</span>
                ) : (
                  <span className="text-gray-500">Off</span>
                )}
              </div>
              <div className="text-xs text-gray-500 leading-tight truncate">
                {dyn.hasWallet ? "Signs x402 on Base" : "Lets the agent pay itself"}
              </div>
            </div>
            {dyn.status?.mode ? (
              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${
                  dyn.status.mode === "mpc"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : dyn.status.mode === "eoa-fallback"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                      : "bg-[#1A1A1A] border-[#2A2A2A] text-gray-500"
                }`}
              >
                {dyn.status.mode === "mpc" ? "MPC" : dyn.status.mode === "eoa-fallback" ? "Demo" : "—"}
              </span>
            ) : null}
          </div>
        </div>

        {/* errors */}
        {(credits.error || walletUsdc.error) && (
          <div className="px-3 pb-3">
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">{credits.error ?? (walletUsdc.error as Error)?.message ?? "Balance unavailable"}</span>
              <button
                type="button"
                onClick={() => {
                  void credits.refresh();
                  void walletUsdc.refetch?.();
                }}
                className="shrink-0 rounded-full border border-red-500/20 bg-[#0A0A0A] px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/10 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="px-3 pb-2.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>Top up credits for instant vocalize.</span>
          <span className="text-gray-600">·</span>
          <span>
            Or send <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px] text-gray-300">X-DYNAMIC-WALLET: 1</code> on vocalize.
          </span>
          <a href="https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview" target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
            How self-pay works <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <CreditDepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        agentRegistryAddress={agentRegistryAddress}
        onSuccess={handleDeposited}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Buyer strip — compact single-row variant for /marketplace
// ---------------------------------------------------------------------------

export function BuyerCreditsStrip({ agentRegistryAddress }: { agentRegistryAddress?: string }) {
  const { address, isConnected } = useAccount();
  const credits = useAgentCredits(address as string | undefined);
  const [depositOpen, setDepositOpen] = useState(false);

  if (!isConnected || !address) return null;
  if (credits.isLoading && !credits.balance) {
    return (
      <div className="rounded-xl border border-[#2A2A2A] bg-[#0F0F0F]/60 px-3 py-2.5 flex items-center gap-3 animate-pulse">
        <div className="h-7 w-7 rounded-lg bg-[#1A1A1A]" />
        <div className="flex-1 h-3 rounded bg-[#1A1A1A] max-w-[14ch]" />
      </div>
    );
  }
  if (credits.error) return null;

  const low = (() => {
    try {
      return credits.balance ? BigInt(credits.balance.usdcBalance) < 500_000n : false; // < $0.50
    } catch {
      return false;
    }
  })();

  return (
    <>
      <div className="rounded-xl border border-[#2A2A2A] bg-[#0F0F0F]/70 backdrop-blur-sm px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`grid h-7 w-7 place-items-center rounded-lg border ${low ? "bg-amber-500/15 border-amber-500/20 text-amber-300" : "bg-[#7C5DFA]/15 border-[#7C5DFA]/20 text-[#9C88FF]"}`}>
            <Coins className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white leading-tight" title={credits.balanceWei ?? undefined}>
              {credits.balanceFormatted ?? "$0"} <span className="font-normal text-gray-500">credits</span>
            </div>
            <div className="text-xs text-gray-500 leading-tight">
              {credits.quote?.discountPercent ? <span className="text-emerald-300/80">Tier −{credits.quote.discountPercent}% · </span> : null}
              {credits.quote ? "used automatically on vocalize" : "for voice generation"}
            </div>
          </div>
          {low ? <span className="ml-1 rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-amber-300">Low</span> : null}
        </div>
        {agentRegistryAddress ? (
          <button
            type="button"
            onClick={() => setDepositOpen(true)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${low ? "bg-white text-black hover:bg-gray-100" : "bg-[#1A1A1A] border border-[#2A2A2A] text-gray-300 hover:text-white hover:border-[#3A3A3A]"}`}
          >
            <Plus className="h-3.5 w-3.5" /> Top up
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void credits.refresh()}
          className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] p-1.5 text-gray-500 hover:text-white transition-colors"
          aria-label="Refresh credits"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${credits.isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      {agentRegistryAddress ? (
        <CreditDepositModal
          isOpen={depositOpen}
          onClose={() => setDepositOpen(false)}
          agentRegistryAddress={agentRegistryAddress}
          onSuccess={() => void credits.refresh()}
        />
      ) : null}
    </>
  );
}

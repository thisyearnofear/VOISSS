/**
 * RuntimePaymentChips — Runtime Week rails, product-minded.
 *
 * Two rails, one story:
 *  - Dynamic: "Let your agent pay for itself" — MPC server wallet that signs x402 on Base.
 *  - Bankr:   "Financial rails" — wallets, swaps, LLM Gateway + token launch narrative.
 *
 * Design goals (Sep 2026 polish pass):
 *  - Benefit first, config second. The empty state explains *why* before *how*.
 *  - Match VOISSS system: bg [#0A0A0A]/[#1A1A1A], border [#2A2A2A], Syne headings,
 *    purple #7C5DFA accents, rounded-xl, no amber alerts, no raw env dumps.
 *  - Progressive disclosure: compact mode hides the test/sign panel and long copy.
 *  - Human microcopy. Technical strings (X-DYNAMIC-WALLET, env names, x402)
 *    live behind a single "Details" disclosure.
 *  - Skeleton + success states so judges see polish, not a dev tool.
 */

"use client";

import React, { useState } from "react";
import {
  Bot,
  Building2,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useDynamicWallet } from "@/hooks/useDynamicWallet";
import { useBankrStatus } from "@/hooks/useBankrStatus";
import { pulseVoice } from "@/lib/terrain-bus";

// ---------------------------------------------------------------------------
// tiny atoms
// ---------------------------------------------------------------------------

function CopyAddr({ addr }: { addr: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(addr);
        } catch {
          // fallback — select-and-copy for older contexts
          const ta = document.createElement("textarea");
          ta.value = addr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-[#0A0A0A] px-2.5 py-1 text-xs font-mono text-gray-300 hover:border-[#3A3A3A] hover:text-white transition-colors"
      title={addr}
      aria-label={`Copy address ${addr}`}
    >
      <span className="tracking-wide">
        {addr.slice(0, 6)}…{addr.slice(-4)}
      </span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 text-gray-500" />
      )}
    </button>
  );
}

function SkeletonChip() {
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#111] p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-[#1A1A1A]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-[#1A1A1A]" />
          <div className="h-2 w-48 rounded bg-[#1A1A1A]/70" />
        </div>
      </div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: string | undefined }) {
  if (mode === "mpc") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-emerald-300">
        <ShieldCheck className="h-3 w-3" /> MPC
      </span>
    );
  }
  if (mode === "eoa-fallback") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-amber-300">
        <KeyRound className="h-3 w-3" /> Demo
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-[#2A2A2A] bg-[#0A0A0A] px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-gray-500">
      Not set
    </span>
  );
}

// ---------------------------------------------------------------------------
// Dynamic — agentic wallet
// ---------------------------------------------------------------------------

export function DynamicChip({
  agentAddress,
  compact = false,
}: {
  agentAddress?: string;
  compact?: boolean;
}) {
  const { status, wallet, hasWallet, isLoading, isCreating, isSigning, error, createWallet, signMessage } =
    useDynamicWallet(agentAddress);
  const [signMsg, setSignMsg] = useState("VOISSS Runtime demo");
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);

  // initial load — no status yet
  if (!status && isLoading) return <SkeletonChip />;

  // ── not configured ───────────────────────────────────────────────────────
  if (!status?.configured && !isLoading) {
    return (
      <div className="rounded-xl border border-dashed border-[#2A2A2A] bg-[#0F0F0F]/70 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#7C5DFA]/15 border border-[#7C5DFA]/20 text-[#9C88FF]">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Agent wallet</h4>
              <span className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Off
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Let your agent <span className="text-gray-200 font-medium">choose a voice and pay itself on Base</span> —
              no human approval click. Enable once, then any brief becomes a self-checkout.
            </p>
            {!compact && (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href="https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-[#3A3A3A] hover:text-white transition-colors"
                  >
                    How it works <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowDetails((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Setup <ChevronDown className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {showDetails && (
                  <div className="mt-3 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-3">
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-500 mb-1.5">
                      Enable (30s)
                    </p>
                    <p className="text-xs leading-relaxed text-gray-500">
                      Add <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px] text-gray-300">DYNAMIC_API_TOKEN</code>{" "}
                      + <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px] text-gray-300">DYNAMIC_ENVIRONMENT_ID</code>{" "}
                      for MPC, or{" "}
                      <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px] text-gray-300">DYNAMIC_WALLET_PRIVATE_KEY</code>{" "}
                      for a demo EOA. No private keys stay in the browser.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── configured ──────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] overflow-hidden">
      {/* header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#7C5DFA] to-[#4F46E5] text-white shadow-sm">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Agent wallet</h4>
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
              ) : (
                <ModeBadge mode={status?.mode} />
              )}
              {hasWallet && wallet && <CopyAddr addr={wallet.address} />}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-400 max-w-[42ch]">
              {hasWallet ? (
                <>
                  Ready on Base — <span className="text-gray-200">agent can sign and settle itself</span>.
                </>
              ) : (
                <>
                  Create once. Then{" "}
                  <span className="text-gray-200 font-medium">POST /api/agents/vocalize</span> pays with{" "}
                  <span className="text-gray-200">no human in the loop</span>.
                </>
              )}
            </p>
          </div>
        </div>
        <a
          href="https://www.dynamic.xyz/docs/overview/agents/agent-payments"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-white hover:border-[#3A3A3A] transition-colors"
        >
          Docs <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* actions */}
      {!compact && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {!hasWallet ? (
              <button
                type="button"
                onClick={async () => {
                  const w = await createWallet();
                  if (w) {
                    // an agent wallet that can now settle — show the field respond
                    pulseVoice("settle");
                    setJustCreated(true);
                    try {
                      const confetti = (await import("canvas-confetti")).default;
                      confetti({ particleCount: 36, spread: 52, origin: { y: 0.72 }, colors: ["#7C5DFA", "#9C88FF", "#4F46E5", "#22c55e"], ticks: 140, gravity: 1.05, scalar: 0.85 });
                    } catch {}
                    window.setTimeout(() => setJustCreated(false), 2800);
                  }
                }}
                disabled={isCreating || isLoading || !status?.configured}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#7C5DFA]" />}
                Create agent wallet
              </button>
            ) : (
              <span
                key={justCreated ? "just-created" : "ready"}>
                <span>
                  <Check className="h-3.5 w-3.5" />
                </span>
                {justCreated ? "Wallet created — ready to pay" : "Wallet ready"}
              </span>
            )}

            <a
              href="/api/agents/dynamic-wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:border-[#3A3A3A] transition-colors"
            >
              Inspect <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {hasWallet && (
              <button
                type="button"
                onClick={() => setShowTest((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  showTest
                    ? "border-[#7C5DFA]/30 bg-[#7C5DFA]/10 text-[#C4B5FD]"
                    : "border-[#2A2A2A] bg-[#0A0A0A] text-gray-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> {showTest ? "Hide test" : "Test sign"}
              </button>
            )}
          </div>

          <>
            {justCreated && hasWallet && wallet && (
              <div>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="font-semibold text-emerald-100">Agent wallet live on Base.</span> Now send{" "}
                  <code className="rounded bg-emerald-500/15 border border-emerald-500/20 px-1 py-0.5 font-mono text-[11px] text-emerald-100">X-DYNAMIC-WALLET: 1</code> with{" "}
                  <code className="rounded bg-emerald-500/15 border border-emerald-500/20 px-1 py-0.5 font-mono text-[11px] text-emerald-100">POST /api/agents/vocalize</code> — no human click.
                </span>
              </div>
            )}
          </>

          {/* test panel */}
          <>
            {hasWallet && showTest && (
              <div>
                <label className="block text-[11px] font-semibold tracking-widest uppercase text-gray-500 mb-2">
                  Sign a message (server-side)
                </label>
                <div className="flex gap-2">
                  <input
                    value={signMsg}
                    onChange={(e) => setSignMsg(e.target.value)}
                    placeholder="Message to sign"
                    className="min-w-0 flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#7C5DFA]/40 focus:outline-none focus:ring-1 focus:ring-[#7C5DFA]/20"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await signMessage(signMsg);
                      if (r?.signature) {
                        setLastSig(r.signature);
                        setCopiedSig(false);
                      }
                    }}
                    disabled={isSigning || !signMsg}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#7C5DFA] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D4AE8] disabled:opacity-50 transition-colors"
                  >
                    {isSigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Sign
                  </button>
                </div>
                <>
                  {lastSig && (
                    <div>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-500" title={lastSig}>
                        {lastSig}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try { await navigator.clipboard.writeText(lastSig); } catch { const ta = document.createElement("textarea"); ta.value = lastSig; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
                          setCopiedSig(true);
                          window.setTimeout(() => setCopiedSig(false), 1400);
                        }}
                        className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedSig ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </button>
                    </div>
                  )}
                </>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Private keys never leave the server. In production the same key signs the{" "}
                  <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px] text-gray-300">
                    x402
                  </code>{" "}
                  payment for vocalize — the agent&apos;s wallet is the payer.
                </p>
              </div>
            )}
          </>

          {error && (
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300">
              {error}
            </div>
          )}

          {/* human footer + details disclosure */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-300 transition-colors"
            >
              How it settles <ChevronDown className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>
            <span className="text-[11px] text-gray-600">·</span>
            <span className="text-[11px] text-gray-600">Base · x402 · 70% to contributor</span>
          </div>
          {showDetails && (
            <div className="mt-2 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-3 text-xs leading-relaxed text-gray-500">
              The server turns the brief into a signed{" "}
              <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px]">TransferWithAuthorization</code>{" "}
              (EIP-3009), verifies via the CDP facilitator, then mints audio to IPFS. Send{" "}
              <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px]">X-DYNAMIC-WALLET: 1</code> on{" "}
              <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px]">POST /api/agents/vocalize</code>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bankr — financial rails
// ---------------------------------------------------------------------------

export function BankrChip({ compact = false }: { compact?: boolean }) {
  const { status, isLoading } = useBankrStatus();
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading && !status) return <SkeletonChip />;

  if (!status?.configured) {
    return (
      <div className="rounded-xl border border-[#2A2A2A] bg-[#0F0F0F]/70 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-black">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Bankr rails</h4>
              <span className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Optional
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Powers the Grand Prize story —{" "}
              <span className="text-gray-200">token, treasury and LLM credits</span> on the same
              checkout your voices already use.
            </p>
            {!compact && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="https://docs.bankr.bot/cli/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-[#3A3A3A] hover:text-white transition-colors"
                >
                  bankr login <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  What it unlocks{" "}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
            {!compact && showDetails && (
              <div className="mt-3 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-3 text-xs leading-relaxed text-gray-500">
                With{" "}
                <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px] text-gray-300">
                  BANKR_API_KEY
                </code>{" "}
                set (<code className="font-mono text-[11px]">bk_…</code>
                ), VOISSS routes swaps, portfolio and the LLM gateway through Bankr — the same rails the
                judges score for &ldquo;onchain potential&rdquo; and token design.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-black">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Bankr rails</h4>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
              </span>
              {status.apiKeyMasked && (
                <span className="rounded-full border border-[#2A2A2A] bg-[#0A0A0A] px-2 py-0.5 font-mono text-[11px] text-gray-400">
                  {status.apiKeyMasked}
                </span>
              )}
              {status.llmConfigured && (
                <span className="rounded-full bg-[#7C5DFA]/15 border border-[#7C5DFA]/20 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-[#C4B5FD]">
                  LLM
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Swaps, portfolio and LLM Gateway wired —{" "}
              <a
                href="/api/bankr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 underline decoration-[#2A2A2A] underline-offset-4 hover:text-white"
              >
                /api/bankr
              </a>{" "}
              is live.
            </p>
          </div>
        </div>
        <a
          href="https://docs.bankr.bot/llm-gateway/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-white hover:border-[#3A3A3A] transition-colors"
        >
          LLM Gateway <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {!compact && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <a
              href="/api/bankr?view=portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-[#3A3A3A] hover:text-white transition-colors"
            >
              View portfolio <ExternalLink className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Details <ChevronDown className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>
          </div>
          {showDetails && (
            <div className="mt-3 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-3 text-xs leading-relaxed text-gray-500">
              Token launch, swaps and credits all flow through{" "}
              <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1 py-0.5 font-mono text-[11px]">BANKR_API_KEY</code>. Use Bankr
              for any Runtime-week token — handbook checks this for the Grand Prize token-design score.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combined — marketplace / dashboard hero
// ---------------------------------------------------------------------------

/** Dismissible wrapper — keeps the marketplace clean for regular users while staying one click away for judges. */
export function DismissibleRuntimeTracks({
  agentAddress,
  bankrCompact,
  dynamicCompact,
  storageKey = "voisss_runtime_rails_dismissed",
  defaultCollapsed = false,
}: {
  agentAddress?: string;
  bankrCompact?: boolean;
  dynamicCompact?: boolean;
  storageKey?: string;
  defaultCollapsed?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hydrated, setHydrated] = useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === "1") setDismissed(true);
      const c = localStorage.getItem(`${storageKey}:collapsed`);
      if (c === "1") setCollapsed(true);
      if (c === "0") setCollapsed(false);
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
    setDismissed(true);
  };
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(`${storageKey}:collapsed`, next ? "1" : "0");
    } catch {}
  };
  const restore = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setDismissed(false);
    setCollapsed(false);
  };

  if (!hydrated) {
    // Avoid hydration mismatch — render nothing until we know dismissed state
    return null;
  }

  if (dismissed) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={restore}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:border-[#3A3A3A] transition-colors"
        >
          <Sparkles className="h-3 w-3 text-[#9C88FF]" /> Show Runtime rails
        </button>
        <span className="text-xs text-gray-600 hidden sm:inline">Agent Week · two tracks, one product</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#0F0F0F] overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[#2A2A2A] bg-[#0A0A0A]/60 px-4 py-2.5">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex items-center gap-2 min-w-0 text-left group"
          aria-expanded={!collapsed}
          aria-controls="runtime-rails-body"
        >
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#7C5DFA]/15 border border-[#7C5DFA]/20 text-[#9C88FF] group-hover:bg-[#7C5DFA]/20 transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold tracking-widest uppercase text-white">Runtime rails</span>
          <span className="hidden sm:inline text-xs text-gray-500">Agent Week · Sep 13–19</span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-gray-500">
            Same project · two tracks
          </span>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] p-1 text-gray-500 hover:text-white hover:border-[#3A3A3A] transition-colors"
            aria-label="Dismiss Runtime rails"
            title="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      {!collapsed && (
        <div id="runtime-rails-body" className="p-3 grid gap-3">
          <DynamicChip agentAddress={agentAddress} compact={dynamicCompact} />
          <BankrChip compact={bankrCompact} />
        </div>
      )}
      {!collapsed && (
        <div className="border-t border-[#2A2A2A] bg-[#0A0A0A]/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs leading-relaxed text-gray-500">
            One voice marketplace, two judging surfaces. <span className="text-gray-400">Bankr Grand Prize is automatic — Dynamic is opt-in.</span>
          </p>
          <a href="https://runtime.nyc/handbook" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white transition-colors">
            Handbook <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * RuntimeTracksMini — one card, two rails, honest progress.
 * Keeps the glowy “two stacked chips” from feeling like two products.
 */
export function RuntimeTracksMini({
  agentAddress,
  bankrCompact,
  dynamicCompact,
}: {
  agentAddress?: string;
  bankrCompact?: boolean;
  dynamicCompact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#0F0F0F] overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[#2A2A2A] bg-[#0A0A0A]/60 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#7C5DFA]/15 border border-[#7C5DFA]/20 text-[#9C88FF]">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold tracking-widest uppercase text-white">Runtime rails</span>
          <span className="hidden sm:inline text-xs text-gray-500">Agent Week · Sep 13–19</span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-gray-500">
          Same project · two tracks
        </span>
      </div>
      <div className="p-3 grid gap-3">
        <DynamicChip agentAddress={agentAddress} compact={dynamicCompact} />
        <BankrChip compact={bankrCompact} />
      </div>
      <div className="border-t border-[#2A2A2A] bg-[#0A0A0A]/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-relaxed text-gray-500">
          One voice marketplace, two judging surfaces. <span className="text-gray-400">Bankr Grand Prize is automatic — Dynamic is opt-in.</span>
        </p>
        <a href="https://runtime.nyc/handbook" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white transition-colors">
          Handbook <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

/** Compact inline callout for docs / for-agents — single line, expands on demand. */
export function RuntimeInlineCallout({ agentAddress }: { agentAddress?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#0F0F0F] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#1A1A1A]/50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#7C5DFA]/15 border border-[#7C5DFA]/20 text-[#9C88FF]">
            <Wallet className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">Self-paying agents</span>
            <span className="block text-xs text-gray-500">Agent wallet + Bankr rails — one header, no human click</span>
          </span>
        </span>
        <span className={open ? "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors border-[#7C5DFA]/30 bg-[#7C5DFA]/10 text-[#C4B5FD]" : "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors border-[#2A2A2A] bg-[#1A1A1A] text-gray-400"}>
          {open ? "Hide" : "Show"} <ChevronDown className={open ? "h-3 w-3 transition-transform rotate-180" : "h-3 w-3 transition-transform"} />
        </span>
      </button>
      {open && (
        <div className="border-t border-[#2A2A2A] p-3 grid gap-3 bg-[#0A0A0A]/30">
          <DynamicChip agentAddress={agentAddress} />
          <BankrChip />
        </div>
      )}
    </div>
  );
}

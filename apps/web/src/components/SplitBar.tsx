/**
 * SplitBar — the revenue split, drawn permanently instead of described.
 *
 * Every competitor claims "fair pay"; the claim is only credible if you show
 * the proportion. Both regimes below are real on-chain constants, not
 * marketing copy — the tooltip cites the source so anyone can verify:
 *
 *  - license (default): VoiceLicenseMarket.sol → platformFeeBps = 3000 →
 *    70% contributor / 30% platform, split at license purchase time.
 *  - x402: VoiceRecords.sol → platformFeePercent = 5 → 95% creator /
 *    5% platform on paywalled recording sales. The BETTER deal for creators.
 *
 * The bar draws itself in when its `[data-reveal]` ancestor reveals (CSS only,
 * no JS). Under reduced motion it is simply drawn at rest.
 */

export type SplitVariant = "license" | "x402";

const VARIANTS: Record<
  SplitVariant,
  { contributorPct: number; who: string; label: string }
> = {
  license: {
    contributorPct: 70,
    who: "contributor",
    label:
      "70% to the voice contributor on license purchases, 30% to the platform. VoiceLicenseMarket.sol sets platformFeeBps = 3000 (30%), so the contributor always receives the remainder — split on-chain at purchase time.",
  },
  x402: {
    contributorPct: 95,
    who: "creator",
    label:
      "95% to the creator on x402 recording sales, 5% to the platform. VoiceRecords.sol sets platformFeePercent = 5 — the creator keeps 95% of every access payment.",
  },
};

export function SplitBar({
  variant = "license",
  compact = false,
  showLegend = true,
  className = "",
}: {
  variant?: SplitVariant;
  compact?: boolean;
  showLegend?: boolean;
  className?: string;
}) {
  const v = VARIANTS[variant];

  return (
    <div className={className}>
      {/* the proportion itself */}
      <div
        className={`voisss-split-track relative w-full overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.03] ${
          compact ? "h-1.5" : "h-2"
        }`}
        role="img"
        aria-label={v.label}
        title={v.label}
      >
        <div
          className="absolute inset-y-0 left-0 voisss-split-fill bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF]"
          style={{ width: `${v.contributorPct}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 voisss-split-fill voisss-split-fill-late bg-cyan-500/45"
          style={{ width: `${100 - v.contributorPct}%` }}
        />
        {/* the split line — where the money actually divides */}
        <span
          className="absolute inset-y-0 w-px bg-white/35"
          style={{ left: `${v.contributorPct}%` }}
          aria-hidden
        />
      </div>

      {showLegend ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9C88FF]" aria-hidden />
            <span className="voisss-number-detail text-white/85">{v.contributorPct}%</span>
            {v.who}
          </span>
          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70" aria-hidden />
            <span className="voisss-number-detail text-white/60">{100 - v.contributorPct}%</span>
            platform
          </span>
          <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.12em] text-white/25">
            {variant === "license" ? "platformFeeBps 3000" : "platformFeePercent 5"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default SplitBar;

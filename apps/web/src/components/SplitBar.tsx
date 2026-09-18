/**
 * SplitBar — the 70/30 split, drawn permanently instead of described.
 *
 * Every competitor claims "fair pay"; the claim is only credible if you show
 * the proportion. This is the actual on-chain constant, not marketing copy:
 * `VoiceLicenseMarket.sol` → `platformFeeBps = 3000` → 70% contributor,
 * 30% platform. The tooltip cites the source so anyone can verify it.
 *
 * The bar draws itself in when its `[data-reveal]` ancestor reveals (CSS only,
 * no JS). Under reduced motion it is simply drawn at rest.
 */

export function SplitBar({
  compact = false,
  showLegend = true,
  className = "",
}: {
  compact?: boolean;
  showLegend?: boolean;
  className?: string;
}) {
  const label =
    "70% to the voice contributor, 30% to the platform. VoiceLicenseMarket.sol sets platformFeeBps = 3000 (30%), so the contributor always receives the remainder.";

  return (
    <div className={className}>
      {/* the proportion itself */}
      <div
        className={`voisss-split-track relative w-full overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.03] ${
          compact ? "h-1.5" : "h-2"
        }`}
        role="img"
        aria-label={label}
        title={label}
      >
        <div className="absolute inset-y-0 left-0 w-[70%] voisss-split-fill bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF]" />
        <div className="absolute inset-y-0 right-0 w-[30%] voisss-split-fill voisss-split-fill-late bg-cyan-500/45" />
        {/* the split line — where the money actually divides */}
        <span
          className="absolute inset-y-0 left-[70%] w-px bg-white/35"
          aria-hidden
        />
      </div>

      {showLegend ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9C88FF]" aria-hidden />
            <span className="voisss-number-detail text-white/85">70%</span>
            contributor
          </span>
          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70" aria-hidden />
            <span className="voisss-number-detail text-white/60">30%</span>
            platform
          </span>
          <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.12em] text-white/25">
            platformFeeBps 3000
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default SplitBar;

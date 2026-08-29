/* ──────────────────────────────────────────────────────────────────────────────
 * VOISSS MASCOT MARK — the static brand mascot ("Halo Orb")
 *
 * A purple headphone-wearing character used as the brand mark / hero / avatar.
 * This is the still, illustrated version (served from /public/voiss-mascot.svg).
 * For the in-app animated, mood-reactive avatar use `VoissMascot` instead.
 * ────────────────────────────────────────────────────────────────────────────── */

export type MascotMarkSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<MascotMarkSize, number> = {
  xs: 28,
  sm: 48,
  md: 80,
  lg: 120,
  xl: 160,
};

export interface VoissMascotMarkProps {
  size?: MascotMarkSize | number;
  className?: string;
  /** Accessible label; set to "" to mark decorative. */
  alt?: string;
  priority?: boolean;
  /**
   * "full" (default): transparent full-body illustration, sits on any surface.
   * "square": framed version with the muted-lavender background square.
   * "head": transparent head-only orb — best for small inline use (nav, avatars).
   */
  variant?: "full" | "square" | "head";
}

const SRC_MAP: Record<NonNullable<VoissMascotMarkProps["variant"]>, string> = {
  full: "/voiss-mascot-full.svg",
  square: "/voiss-mascot.svg",
  head: "/voiss-mascot-head.svg",
};

export default function VoissMascotMark({
  size = "md",
  className = "",
  alt = "VOISSS mascot",
  priority = false,
  variant = "full",
}: VoissMascotMarkProps) {
  const dim = typeof size === "number" ? size : SIZE_MAP[size];
  const src = SRC_MAP[variant];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={dim}
      height={dim}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`inline-block select-none ${className}`}
      draggable={false}
    />
  );
}

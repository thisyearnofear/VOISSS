import React from "react";

/**
 * Progressive disclosure primitive.
 *
 * variant="section"  — tier-1 page content: bordered strip, display-type
 *                      summary, padded muted body (`.lr-details`).
 * variant="inline"   — inline "why?" links inside cards/rows: quiet small
 *                      summary, children render unwrapped (`.lr-inline-details`).
 *
 * Pass `name` to make a group of disclosures mutually exclusive
 * (native <details name> accordion). Pass `id` for deep-linking —
 * browsers auto-open a details element targeted by its hash.
 */
export interface DisclosureProps
  extends Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, "title"> {
  title: React.ReactNode;
  variant?: "section" | "inline";
  children: React.ReactNode;
}

export function Disclosure({
  title,
  variant = "section",
  className,
  children,
  ...rest
}: DisclosureProps) {
  return (
    <details
      className={[
        variant === "inline" ? "lr-inline-details" : "lr-details",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <summary>{title}</summary>
      {variant === "section" ? (
        <div className="lr-details-body">{children}</div>
      ) : (
        children
      )}
    </details>
  );
}

import React from "react";

/** Small outlined status/metadata pill (`.lr-badge`). */
export function Badge({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={["lr-badge", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

import React from "react";

/** Pill-shaped secondary action (`.lr-chip`). Defaults to type="button". */
export function Chip({
  className,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={["lr-chip", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

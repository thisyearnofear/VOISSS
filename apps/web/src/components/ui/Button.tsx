import React from "react";

/**
 * Primary/ghost button (`.lr-btn`). For links, use
 * className="lr-btn lr-btn-primary" or "lr-btn lr-btn-ghost" on next/link.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={["lr-btn", `lr-btn-${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

import React from "react";

/**
 * Bordered inline status/empty-state block (`.lr-notice`).
 * tone="error" switches text to the error color; announces via role="status".
 */
export interface NoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "error";
}

export function Notice({
  tone = "default",
  className,
  role = "status",
  ...rest
}: NoticeProps) {
  return (
    <div
      role={role}
      className={[
        "lr-notice",
        tone === "error" ? "lr-error-text" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

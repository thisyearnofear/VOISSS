import type { ReactNode } from "react";
import VoissMascotMark from "./VoissMascotMark";

/* Reusable empty-state block with the mascot head, a title, an optional
 * description and an optional call-to-action. */

export interface MascotEmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function MascotEmptyState({
  title,
  description,
  action,
  className = "",
}: MascotEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-12 rounded-xl border border-[#2A2A2A] bg-[#121212]/60 ${className}`}
    >
      <VoissMascotMark variant="head" size={72} alt="" className="w-16 h-16 mb-4 opacity-90" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <div className="text-sm text-gray-400 max-w-md mx-auto">{description}</div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

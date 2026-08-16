import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SearchX } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────
export interface EmptyStateProps {
  /** Icon to display — defaults to SearchX */
  icon?: ReactNode;
  /** Main heading */
  title: string;
  /** Optional supporting description */
  description?: string;
  /** Optional CTA button or link */
  action?: ReactNode;
  /** Additional className for the wrapper */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      {/* Icon container */}
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        {icon ?? <SearchX className="w-7 h-7 text-gray-400" />}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-800 mb-1.5">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">
          {description}
        </p>
      )}

      {/* CTA */}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

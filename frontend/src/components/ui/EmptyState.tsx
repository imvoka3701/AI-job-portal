import { type ReactNode } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-3xl border border-dashed border-slate-200/90 bg-slate-50/40",
        className
      )}
      data-testid="empty-state"
    >
      {/* Icon container */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-100 to-emerald-50 text-emerald-600 border border-emerald-100/70 shadow-xs flex items-center justify-center mb-4">
        {icon ?? <SearchX className="w-7 h-7 text-slate-400" />}
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 mb-1.5">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4 font-medium">
          {description}
        </p>
      )}

      {/* CTA Action */}
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ErrorStateProps {
  /** Error heading — defaults to a generic message */
  title?: string;
  /** Descriptive message */
  message?: string;
  /** Retry handler — renders a "Thử lại" button when provided */
  onRetry?: () => void;
  /** Additional className for the wrapper */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ErrorState({
  title = "Không thể tải dữ liệu",
  message = "Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-3xl border border-rose-100/90 bg-rose-50/30",
        className
      )}
      role="alert"
      data-testid="error-state"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-50 to-red-100 text-rose-500 border border-rose-200/80 shadow-xs flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-rose-500" />
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 mb-1.5">
        {title}
      </h3>

      {/* Message */}
      {message && (
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4 font-medium">
          {message}
        </p>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      )}
    </motion.div>
  );
}

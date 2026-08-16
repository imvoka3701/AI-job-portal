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
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
      role="alert"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-800 mb-1.5">
        {title}
      </h3>

      {/* Message */}
      {message && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">
          {message}
        </p>
      )}

      {/* Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Thử lại
        </button>
      )}
    </div>
  );
}

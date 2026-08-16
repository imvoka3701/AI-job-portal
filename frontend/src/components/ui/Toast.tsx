import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
  duration?: number;
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: "border-primary/25 bg-white text-primary",
  error: "border-red-200 bg-white text-red-600",
  info: "border-gray-200 bg-white text-gray-600",
};

export function Toast({ message, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, onDismiss]);

  const variant = message?.variant ?? "success";
  const Icon = ICONS[variant];

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[90] w-[min(380px,calc(100vw-2.5rem))]" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message.id}
            role={variant === "error" ? "alert" : "status"}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={cn("pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg", STYLES[variant])}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{message.title}</p>
              {message.description && <p className="mt-0.5 text-sm text-gray-500">{message.description}</p>}
            </div>
            <button type="button" onClick={onDismiss} aria-label="Đóng thông báo" className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

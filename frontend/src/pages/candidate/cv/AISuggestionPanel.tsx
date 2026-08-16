import { motion } from "framer-motion";
import { AlertCircle, Check, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui";

export interface AISuggestionValue {
  text: string;
  rationale: string;
}

interface AISuggestionPanelProps {
  error: string | null;
  suggestion: AISuggestionValue | null;
  onAccept: () => void;
  onDismiss: () => void;
  onRetry: () => void;
}

export function AISuggestionPanel({
  error,
  suggestion,
  onAccept,
  onDismiss,
  onRetry,
}: AISuggestionPanelProps) {
  if (!error && !suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      aria-live="polite"
    >
      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-700">Không thể tạo gợi ý</p>
              <p className="mt-1 text-xs text-red-700">{error}</p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={onRetry}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      ) : suggestion ? (
        <div className="rounded-lg border border-primary/20 bg-primary-light p-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase">Bản nháp từ AI</p>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-800">
            {suggestion.text}
          </p>
          {suggestion.rationale && (
            <p className="mt-2 text-xs text-gray-600">{suggestion.rationale}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={onAccept} leftIcon={<Check className="h-3.5 w-3.5" />}>
              Chèn vào CV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onRetry}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Tạo lại
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss} leftIcon={<X className="h-3.5 w-3.5" />}>
              Bỏ qua
            </Button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

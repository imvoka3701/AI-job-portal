import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, Loader2, Circle } from "lucide-react";

export interface AIProgressiveLoaderProps {
  title?: string;
  subtitle?: string;
  stages?: string[];
  activeStage?: number;
  autoAdvance?: boolean;
  intervalMs?: number;
  className?: string;
}

const DEFAULT_STAGES = [
  "Trích xuất dữ liệu CV và yêu cầu công việc",
  "So khớp vector ngữ nghĩa đa chiều qua AI",
  "Phân tích thế mạnh và các kỹ năng còn thiếu",
  "Tổng hợp điểm tương thích và khuyến nghị",
];

export function AIProgressiveLoader({
  title = "AI đang phân tích dữ liệu...",
  subtitle = "Hệ thống đang đối soát dữ liệu qua mạng neural embedding",
  stages = DEFAULT_STAGES,
  activeStage: controlledStage,
  autoAdvance = true,
  intervalMs = 900,
  className = "",
}: AIProgressiveLoaderProps) {
  const [internalStage, setInternalStage] = useState(0);

  const currentStage = controlledStage !== undefined ? controlledStage : internalStage;

  useEffect(() => {
    if (!autoAdvance || controlledStage !== undefined) return;
    const timer = setInterval(() => {
      setInternalStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoAdvance, controlledStage, intervalMs, stages.length]);

  const progressPercent = Math.min(
    95,
    Math.round(((currentStage + 1) / (stages.length + 0.5)) * 100)
  );

  return (
    <div
      data-testid="ai-progressive-loader"
      className={`p-6 rounded-2xl bg-white/95 border border-indigo-100 shadow-sm space-y-5 ${className}`}
    >
      {/* Header with animated sparkles */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        </div>
        <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
          {progressPercent}%
        </span>
      </div>

      {/* Animated Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full"
          initial={{ width: "10%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Multi-stage Checklist */}
      <div className="space-y-2.5 pt-1">
        {stages.map((stage, idx) => {
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;

          return (
            <AnimatePresence key={stage} mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className={`flex items-center gap-3 text-xs p-2 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-indigo-50/70 border border-indigo-200/80 text-indigo-950 font-semibold shadow-2xs"
                    : isDone
                    ? "text-slate-700 font-medium"
                    : "text-slate-400 opacity-60"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span className="truncate">{stage}</span>
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}

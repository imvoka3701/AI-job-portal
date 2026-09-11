/**
 * SkillGapPanel — UI/UX Architect Component (Direction 3)
 * Displays AI-powered Skill Gap analysis for a candidate vs. a job.
 * Shows:
 *  - Overall fit badge + score ring
 *  - 3 skill buckets: Have ✅ | Needs Improvement ⚡ | Missing ❌
 *  - Learning Path ordered steps
 *  - Vietnamese executive summary
 *  - Loading skeleton & error states
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  RefreshCw,
  Brain,
} from "lucide-react";
import { analyseSkillGap } from "@/lib/api/ai";
import type { SkillGapResult, SkillGapItem } from "@/lib/api/ai";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────
interface SkillGapPanelProps {
  jobId: number;
  resumeId?: number;
  cvDocumentId?: number;
  /** Auto-fetch on mount when true */
  autoFetch?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FIT_CONFIG: Record<string, { color: string; bg: string; ring: string }> = {
  "Rất phù hợp":  { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", ring: "stroke-emerald-500" },
  "Phù hợp tốt":  { color: "text-teal-700",    bg: "bg-teal-50 border-teal-200",      ring: "stroke-teal-500"   },
  "Cần cải thiện": { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",    ring: "stroke-amber-500"  },
  "Không phù hợp": { color: "text-rose-700",    bg: "bg-rose-50 border-rose-200",      ring: "stroke-rose-500"   },
};

const PRIORITY_BADGE: Record<string, string> = {
  critical:      "bg-rose-50 text-rose-700 border-rose-200",
  recommended:   "bg-amber-50 text-amber-700 border-amber-200",
  nice_to_have:  "bg-slate-50 text-slate-600 border-slate-200",
};

const PRIORITY_LABEL: Record<string, string> = {
  critical:     "Bắt buộc",
  recommended:  "Nên có",
  nice_to_have: "Tốt nếu có",
};

function SkillBucket({
  label,
  icon,
  color,
  items,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  items: SkillGapItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className={cn("flex items-center gap-1.5 text-xs font-bold", color)}>
        {icon}
        {label} ({items.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <motion.div
            key={s.name + i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            title={s.note ?? undefined}
            className={cn(
              "group relative px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-default",
              color === "text-emerald-700"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : color === "text-amber-700"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            )}
          >
            {s.name}
            {s.priority && (
              <span
                className={cn(
                  "ml-1.5 px-1 py-0.5 rounded-md text-[9px] font-black border",
                  PRIORITY_BADGE[s.priority] ?? PRIORITY_BADGE.recommended
                )}
              >
                {PRIORITY_LABEL[s.priority] ?? s.priority}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 rounded-2xl bg-slate-100" />
      <div className="h-4 w-2/3 rounded-full bg-slate-100" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-7 w-20 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-4 w-1/2 rounded-full bg-slate-100" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-24 rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SkillGapPanel({
  jobId,
  resumeId,
  cvDocumentId,
  autoFetch = false,
  className,
}: SkillGapPanelProps) {
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(autoFetch);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setHasFetched(true);
    try {
      const res = await analyseSkillGap({
        job_id: jobId,
        resume_id: resumeId,
        cv_document_id: cvDocumentId,
      });
      setResult(res);
    } catch {
      setError("Không thể phân tích Skill Gap lúc này. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount
  if (autoFetch && !hasFetched) {
    void runAnalysis();
  }

  const fitConfig = result ? (FIT_CONFIG[result.overall_fit] ?? FIT_CONFIG["Cần cải thiện"]) : null;
  const haveSkills = result?.skills.filter((s) => s.category === "have") ?? [];
  const improveSkills = result?.skills.filter((s) => s.category === "needs_improvement") ?? [];
  const missingSkills = result?.skills.filter((s) => s.category === "missing") ?? [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-violet-50 border border-violet-200">
            <Brain size={14} className="text-violet-600" />
          </div>
          <span className="text-xs font-black text-slate-900">Phân tích Skill Gap (AI)</span>
        </div>
        <button
          type="button"
          onClick={() => void runAnalysis()}
          disabled={isLoading}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:text-violet-900 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
          {hasFetched ? "Phân tích lại" : "Phân tích ngay"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {isLoading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSkeleton />
          </motion.div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Empty state — not yet run */}
        {!isLoading && !error && !result && !hasFetched && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3"
          >
            <Zap size={24} className="text-violet-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Nhấn "Phân tích ngay" để AI so sánh kỹ năng ứng viên với yêu cầu công việc.
            </p>
            <button
              type="button"
              onClick={() => void runAnalysis()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors cursor-pointer"
            >
              <Brain size={13} />
              Bắt đầu phân tích
            </button>
          </motion.div>
        )}

        {/* Results */}
        {!isLoading && result && fitConfig && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Overall Fit Banner */}
            <div className={cn("p-4 rounded-2xl border flex items-center justify-between gap-3", fitConfig.bg)}>
              <div>
                <p className={cn("text-xs font-black", fitConfig.color)}>{result.overall_fit}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{result.job_title}</p>
              </div>
              {/* Score Arc */}
              <div className="relative w-12 h-12 shrink-0">
                <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    className={fitConfig.ring}
                    strokeWidth="3"
                    strokeDasharray={`${result.overall_score} ${100 - result.overall_score}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={cn("absolute inset-0 flex items-center justify-center text-[11px] font-black", fitConfig.color)}>
                  {Math.round(result.overall_score)}%
                </span>
              </div>
            </div>

            {/* Summary */}
            {result.summary && (
              <p className="text-xs text-slate-600 leading-relaxed font-normal border-l-2 border-violet-200 pl-3">
                {result.summary}
              </p>
            )}

            {/* Skill Buckets */}
            <div className="space-y-3">
              <SkillBucket
                label="Đã có"
                icon={<CheckCircle2 size={13} />}
                color="text-emerald-700"
                items={haveSkills}
              />
              <SkillBucket
                label="Cần cải thiện"
                icon={<AlertCircle size={13} />}
                color="text-amber-700"
                items={improveSkills}
              />
              <SkillBucket
                label="Còn thiếu"
                icon={<XCircle size={13} />}
                color="text-rose-700"
                items={missingSkills}
              />
            </div>

            {/* Learning Path */}
            {result.learning_path.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <BookOpen size={13} className="text-violet-600" />
                  Lộ trình phát triển đề xuất
                </div>
                <ol className="space-y-1.5">
                  {result.learning_path.map((step, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-2 text-[11px] text-slate-700"
                    >
                      <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

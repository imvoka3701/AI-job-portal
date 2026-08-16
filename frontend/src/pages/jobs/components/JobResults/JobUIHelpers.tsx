import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, Sparkles, SearchX, Info, X } from "lucide-react";
import { useJobStore, useApplyStatus } from "@/stores/jobStore";

/** Renders the AI Match badge & popover tooltip based on score tier */
export function AIMatchBadge({ score }: { score: number }) {
  const [isOpen, setIsOpen] = useState(false);

  // Match score level label
  const getScoreLabel = (s: number) => {
    if (s >= 90) return "Rất phù hợp";
    if (s >= 75) return "Phù hợp cao";
    if (s >= 60) return "Phù hợp";
    return "Tiềm năng";
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="Xem giải thích độ phù hợp AI Match"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-xs bg-white border border-emerald-100 text-[#00995C] shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Radial Progress */}
        <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="text-emerald-100" />
            <motion.circle 
              cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"
              className="text-[#00B86B]"
              strokeDasharray="62.83"
              initial={{ strokeDashoffset: 62.83 }}
              animate={{ strokeDashoffset: 62.83 - (62.83 * score) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            />
          </svg>
        </div>

        <span className="relative z-10">{score.toFixed(0)}% MATCH</span>
        <Info className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5 relative z-10" />
      </button>

      {/* Popover Tooltip Breakdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 bottom-full mb-2.5 z-40 w-64 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-200/80 shadow-xl shadow-slate-900/10 text-xs text-[#0F172A]"
          >
            <div className="flex items-center justify-between font-bold border-b border-slate-100 pb-2 mb-2 text-sm">
              <span className="flex items-center gap-1.5 text-[#00B86B]">
                <Sparkles className="w-4 h-4" /> AI Match Explanation
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-emerald-700">
                <span>✓ Kỹ năng chính</span>
                <span className="font-semibold">Khớp tốt</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span>✓ Kinh nghiệm</span>
                <span className="font-semibold">Đạt yêu cầu</span>
              </div>
              <div className="flex items-center justify-between text-amber-600">
                <span>△ Địa điểm / Loại hình</span>
                <span className="font-semibold">Phù hợp</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-slate-700">
              <span>Mức độ phù hợp:</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#00995C] text-[11px]">
                {getScoreLabel(score)} ({score.toFixed(0)}%)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Apply button — manages loading / success / error states internally */
export function ApplyButton({ jobId }: { jobId: number }) {
  const applyToJob = useJobStore((s) => s.applyToJob);
  const status = useApplyStatus(jobId);

  if (status === "success") {
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ECFDF5] border border-emerald-200 text-[#00995C] text-[13px] font-bold">
        <Check className="w-4 h-4" /> Đã ứng tuyển
      </div>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={() => applyToJob(jobId)}
        aria-label="Thử lại ứng tuyển"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-bold hover:bg-red-100 transition-colors"
      >
        <AlertCircle className="w-4 h-4" /> Thử lại
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => applyToJob(jobId)}
      disabled={status === "loading"}
      aria-label="Ứng tuyển công việc"
      className="relative flex items-center gap-1.5 px-5 py-2 bg-[#00B86B] hover:bg-[#00995C] text-white text-[13.5px] font-semibold rounded-xl disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group shadow-xs"
      whileHover={status === "idle" ? { scale: 1.03, y: -1 } : undefined}
      whileTap={status === "idle" ? { scale: 0.97 } : undefined}
    >
      {status === "loading" ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Đang xử lý...
        </>
      ) : (
        <>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700" />
          <motion.div
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-4 h-4 text-emerald-100 group-hover:text-white transition-colors" />
          </motion.div>
          Ứng tuyển
        </>
      )}
    </motion.button>
  );
}

/** Skeleton placeholder for a single Job Card during loading */
export function JobCardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-2xs animate-pulse space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-3 bg-slate-200 rounded w-24" />
        <div className="h-3 bg-slate-200 rounded w-20" />
        <div className="h-3 bg-slate-200 rounded w-16" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-slate-100 rounded-full w-16" />
        <div className="h-6 bg-slate-100 rounded-full w-20" />
        <div className="h-6 bg-slate-100 rounded-full w-14" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
        <div className="h-6 bg-emerald-50 rounded-full w-28" />
        <div className="h-9 bg-slate-200 rounded-xl w-24" />
      </div>
    </div>
  );
}

/** Empty state when no jobs match current filters */
export function EmptyJobsState() {
  const setFilters = useJobStore((s) => s.setFilters);

  const handleReset = () => {
    setFilters({
      keyword: undefined,
      locations: undefined,
      job_type: undefined,
      experience_level: undefined,
      salary_min: undefined,
      salary_max: undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-[#E2E8F0] rounded-[20px] text-center shadow-xs"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] text-[#00B86B] flex items-center justify-center mb-4 shadow-xs">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-[#0F172A] mb-1.5">Không tìm thấy công việc phù hợp</h3>
      <p className="text-[14px] text-[#64748B] max-w-sm leading-relaxed mb-5">
        Hiện chưa có công việc nào thỏa mãn tiêu chí tìm kiếm của bạn. Hãy thử thay đổi hoặc xóa bớt bộ lọc.
      </p>
      <button
        type="button"
        onClick={handleReset}
        className="px-5 py-2.5 bg-[#00B86B] hover:bg-[#00995C] text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors"
      >
        Xóa bộ lọc
      </button>
    </motion.div>
  );
}

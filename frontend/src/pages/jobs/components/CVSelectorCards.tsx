/**
 * CVSelectorCards — UI/UX Architect Component
 * Card-based CV selector to replace the plain <select> dropdown in the apply modal.
 * Displays CV Builder docs (teal) and PDF resumes (violet) as interactive cards
 * with AI Match Score badge, selected state, and Framer Motion micro-animations.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { Resume } from "@/types/resume";
import type { CvDocument } from "@/types/cvDocument";

interface CVSelectorCardsProps {
  resumes: Resume[];
  cvDocuments: CvDocument[];
  selectedDocument: string;
  onChange: (value: string) => void;
  aiScore?: number | null;
  isMatchingLoading?: boolean;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : score >= 60
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-rose-100 text-rose-800 border-rose-300";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${color}`}
    >
      <Zap size={9} />
      {score}%
    </span>
  );
}

export function CVSelectorCards({
  resumes,
  cvDocuments,
  selectedDocument,
  onChange,
  aiScore,
  isMatchingLoading,
}: CVSelectorCardsProps) {
  const hasAnyCv = resumes.length > 0 || cvDocuments.length > 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.25 },
    }),
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">
          Chọn hồ sơ CV đính kèm:
        </label>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {isMatchingLoading ? (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <RefreshCw size={11} className="animate-spin" />
              Đang tính điểm...
            </span>
          ) : aiScore != null ? (
            <span className="flex items-center gap-1 font-semibold">
              Điểm khớp:&nbsp;
              <ScoreBadge score={aiScore} />
            </span>
          ) : null}
        </div>
      </div>

      {!hasAnyCv ? (
        /* Empty state */
        <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
          <FileText size={24} className="text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Bạn chưa có hồ sơ CV nào.
          </p>
          <Link
            to="/cv"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
          >
            <Plus size={13} />
            Tạo CV mới với AI Builder
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-0.5">
          {/* CV Builder documents */}
          {cvDocuments.map((cv, i) => {
            const value = `builder:${cv.id}`;
            const isSelected = selectedDocument === value;
            return (
              <motion.button
                key={`builder-${cv.id}`}
                type="button"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => onChange(value)}
                className={`relative w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer group ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-50/80 shadow-sm shadow-emerald-100"
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50"
                }`}
              >
                {/* Type badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black">
                    <Sparkles size={9} className="text-teal-600" />
                    CV Builder
                  </span>
                  {isSelected && (
                    <CheckCircle2
                      size={16}
                      className="text-emerald-600 shrink-0"
                    />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {cv.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Cập nhật: {formatDate(cv.updated_at)}
                </p>
                {/* Skills preview */}
                {cv.content_json?.skills?.length > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    {cv.content_json.skills.slice(0, 3).join(", ")}
                    {cv.content_json.skills.length > 3 ? "..." : ""}
                  </p>
                )}
              </motion.button>
            );
          })}

          {/* PDF Resume uploads */}
          {resumes.map((resume, i) => {
            const value = `resume:${resume.id}`;
            const isSelected = selectedDocument === value;
            return (
              <motion.button
                key={`resume-${resume.id}`}
                type="button"
                custom={cvDocuments.length + i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => onChange(value)}
                className={`relative w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer group ${
                  isSelected
                    ? "border-violet-400 bg-violet-50/80 shadow-sm shadow-violet-100"
                    : "border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-[10px] font-black">
                    <FileText size={9} className="text-violet-600" />
                    PDF Upload
                  </span>
                  {isSelected && (
                    <CheckCircle2
                      size={16}
                      className="text-violet-600 shrink-0"
                    />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {resume.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tải lên: {formatDate(resume.created_at)}
                </p>
                {resume.is_validated && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                    ✓ Đã xác thực bởi AI
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Footer: create new CV CTA */}
      {hasAnyCv && (
        <div className="flex items-center justify-between pt-1">
          <Link
            to="/cv"
            className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <Plus size={12} />
            Tạo CV mới với AI Builder
          </Link>
          <span className="text-[11px] text-slate-400">
            {resumes.length + cvDocuments.length} hồ sơ sẵn có
          </span>
        </div>
      )}
    </div>
  );
}

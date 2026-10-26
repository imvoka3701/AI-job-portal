import { motion } from "framer-motion";
import {
  X,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Code2,
  Briefcase,
  TrendingUp,
  Cpu,
  Award,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CandidateCompareResponse } from "@/lib/api/rag";

interface CandidateContrastModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CandidateCompareResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function CandidateContrastModal({
  isOpen,
  onClose,
  data,
  isLoading,
  error,
  onRetry,
}: CandidateContrastModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Bàn Cân Đối Chiếu Ứng Viên AI (Live Candidate Contrast)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  pgvector 384-dim
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {data ? (
                  <>
                    Vị trí đối chiếu: <strong className="text-slate-800">{data.job_title}</strong> (Cấp bậc: {data.job_level || "Tất cả"})
                  </>
                ) : (
                  "Đang phân tích dữ liệu đa chiều từ CSDL..."
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Loading Skeleton State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Spinner size="lg" className="text-indigo-600" />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">Đang thực thi phép tính Cosine Similarity & Phân tích khoảng cách kỹ năng...</p>
                <p className="text-xs text-slate-500 mt-1">Truy vấn PostgreSQL pgvector và trích xuất vector embeddings 384 chiều</p>
              </div>
            </div>
          )}

          {/* 2. Error State */}
          {!isLoading && error && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-sm font-bold text-rose-800">{error}</p>
              <Button size="sm" onClick={onRetry} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs">
                Thử lại phân tích
              </Button>
            </div>
          )}

          {/* 3. Ideal State: Dual Column Contrast */}
          {!isLoading && !error && data && (
            <>
              {/* Comparative AI Verdict Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-50 border border-indigo-100/90 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Nhận định so sánh tổng quan từ AI Engine:</span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-semibold">
                  {data.verdict_summary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-indigo-100/60 text-xs text-slate-700">
                  {data.verdict_breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-indigo-50">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dual Candidates Side-by-Side Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                {/* Visual VS Badge in the center for desktop */}
                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs items-center justify-center shadow-lg border-2 border-white">
                  VS
                </div>

                {/* Candidate 1 Column */}
                <CandidateColumn
                  profile={data.candidate_1}
                  isWinner={data.candidate_1.total_match_score >= data.candidate_2.total_match_score}
                  accentColor="indigo"
                />

                {/* Candidate 2 Column */}
                <CandidateColumn
                  profile={data.candidate_2}
                  isWinner={data.candidate_2.total_match_score >= data.candidate_1.total_match_score}
                  accentColor="purple"
                />
              </div>

              {/* 4. Mathematical Explainability & Vector Telemetry Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Căn Cứ Toán Học & Hạ Tầng Vector Minh Bạch (Zero-Hallucination)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    Model: {data.formula_metadata.model_name}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                    <span className="text-slate-400 font-medium">1. Vector Cosine (35%)</span>
                    <p className="text-sm font-black text-white font-mono">
                      S_cos = cos(θ) × 100
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tính toán độ tương tự cosin 384 chiều giữa Job Embedding và CV Embedding.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                    <span className="text-slate-400 font-medium">2. Hard Skills Match (40%)</span>
                    <p className="text-sm font-black text-white font-mono">
                      Score = |S_job ∩ S_cv| / |S_job|
                    </p>
                    <p className="text-[11px] text-slate-400">
                      So khớp tập hợp từ khóa kỹ năng cốt lõi trích xuất trực tiếp từ văn bản CV.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                    <span className="text-slate-400 font-medium">3. Experience Delta (25%)</span>
                    <p className="text-sm font-black text-white font-mono">
                      Cap = 60.0% if Deal-breaker
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Áp trần tối đa 60% nếu thiếu kỹ năng bắt buộc hoặc số năm kinh nghiệm cách biệt lớn.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end bg-slate-50/60 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-100"
          >
            Đóng bảng đối chiếu
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sub-component: Candidate Column ──────────────────────────────────────────
function CandidateColumn({
  profile,
  isWinner,
  accentColor,
}: {
  profile: CandidateCompareResponse["candidate_1"];
  isWinner: boolean;
  accentColor: "indigo" | "purple";
}) {
  const initials =
    profile.candidate_name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "UV";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 space-y-4 transition-all duration-200 bg-white",
        isWinner
          ? "border-emerald-300 shadow-sm ring-1 ring-emerald-200/60"
          : "border-slate-200 shadow-2xs"
      )}
    >
      {/* Candidate Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-11 h-11 rounded-xl text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs",
              accentColor === "indigo"
                ? "bg-gradient-to-tr from-indigo-600 to-indigo-700"
                : "bg-gradient-to-tr from-purple-600 to-purple-700"
            )}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-900 truncate">
                {profile.candidate_name}
              </h4>
              {isWinner && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-600" />
                  Ưu thế hơn
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {profile.candidate_email || "Hồ sơ đã nộp"} • {profile.document_type === "resume" ? "PDF đính kèm" : "CV Builder"}
            </p>
          </div>
        </div>

        {/* Total Match Big Score Badge */}
        <div className="text-right shrink-0">
          <div
            className={cn(
              "text-2xl font-black font-mono",
              profile.total_match_score >= 70
                ? "text-emerald-600"
                : profile.total_match_score >= 50
                ? "text-amber-600"
                : "text-rose-600"
            )}
          >
            {profile.total_match_score}%
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Độ tương thích
          </span>
        </div>
      </div>

      {/* Progress Bars for 3 Weighted Criteria */}
      <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-600 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              Ngữ nghĩa Vector (Cosine):
            </span>
            <strong className="text-slate-900 font-mono">{profile.vector_cosine_score}%</strong>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${profile.vector_cosine_score}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-600 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-emerald-600" />
              Khớp kỹ năng chuyên môn:
            </span>
            <strong className="text-slate-900 font-mono">{profile.skills_score}%</strong>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${profile.skills_score}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-600 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-purple-600" />
              Thâm niên kinh nghiệm ({Math.round(profile.years_of_experience)} năm):
            </span>
            <strong className="text-slate-900 font-mono">{profile.experience_score}%</strong>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${profile.experience_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Skills Overlap & Missing breakdown */}
      <div className="space-y-2.5">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Kỹ năng đạt chuẩn ({profile.matched_skills.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {profile.matched_skills.length > 0 ? (
              profile.matched_skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Không trùng khớp kỹ năng cốt lõi</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Kỹ năng còn thiếu ({profile.missing_skills.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {profile.missing_skills.length > 0 ? (
              profile.missing_skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-emerald-600 font-semibold">Đầy đủ toàn bộ kỹ năng yêu cầu</span>
            )}
          </div>
        </div>
      </div>

      {/* Deal Breakers Warnings if any */}
      {profile.deal_breakers.length > 0 && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
          <span className="font-bold flex items-center gap-1 text-rose-900">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Cảnh báo tiêu chuẩn bắt buộc:
          </span>
          {profile.deal_breakers.map((d, idx) => (
            <p key={idx} className="text-[11px] leading-snug">• {d}</p>
          ))}
        </div>
      )}

      {/* Micro-vector sparkline sample (8 float values) */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>pgvector 8-dim sample:</span>
          <span className="font-mono">dim[0..7]</span>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {profile.vector_sample.map((val, idx) => (
            <div
              key={idx}
              title={`dim[${idx}]: ${val}`}
              className="h-5 rounded bg-slate-100 flex items-center justify-center text-[9px] font-mono text-slate-600 border border-slate-200 overflow-hidden"
            >
              {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

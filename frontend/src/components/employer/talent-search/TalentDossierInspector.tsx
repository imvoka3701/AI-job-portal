import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Eye,
  Copy,
  Check,
  Briefcase,
  Code2,
  Wrench,
  FileText,
  GraduationCap,
  Layers,
  ArrowUpRight,
  Target,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CandidateGroup } from "./CandidateDossierCard";

interface TalentDossierInspectorProps {
  candidate: CandidateGroup | null;
  activeChunkIndex: number;
  onSelectChunk: (chunkIdx: number) => void;
  onCopyContent: (content: string, chunkId: number) => void;
  copiedChunkId: number | null;
  onOpenDocPreview: (candidate: CandidateGroup) => void;
  isPreviewLoading: boolean;
  onOpenCopilot: (candidate: CandidateGroup) => void;
}

const getSectionBadge = (sectionType: string) => {
  switch (sectionType) {
    case "experience":
      return { label: "Kinh nghiệm làm việc", icon: Briefcase, color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "project":
      return { label: "Dự án thực tế", icon: Code2, color: "bg-purple-50 text-purple-700 border-purple-200" };
    case "skills":
      return { label: "Kỹ năng chuyên môn", icon: Wrench, color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "education":
      return { label: "Học vấn", icon: GraduationCap, color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "summary":
      return { label: "Tóm tắt & Mục tiêu", icon: FileText, color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    default:
      return { label: sectionType, icon: FileText, color: "bg-slate-50 text-slate-700 border-slate-200" };
  }
};

const getApplicationStatusBadge = (status?: string | null) => {
  switch (status) {
    case "pending":
      return { label: "Chờ duyệt", color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "reviewed":
      return { label: "Đã xem hồ sơ", color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "shortlisted":
      return { label: "Phù hợp (Shortlisted)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "interview":
      return { label: "Mời phỏng vấn", color: "bg-purple-50 text-purple-700 border-purple-200" };
    case "accepted":
      return { label: "Đã trúng tuyển", color: "bg-teal-50 text-teal-700 border-teal-200" };
    case "rejected":
      return { label: "Đã từ chối", color: "bg-rose-50 text-rose-700 border-rose-200" };
    default:
      return { label: "Đã ứng tuyển", color: "bg-slate-50 text-slate-700 border-slate-200" };
  }
};

export function TalentDossierInspector({
  candidate,
  activeChunkIndex,
  onSelectChunk,
  onCopyContent,
  copiedChunkId,
  onOpenDocPreview,
  isPreviewLoading,
  onOpenCopilot,
}: TalentDossierInspectorProps) {
  if (!candidate) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
          <Target className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">Chọn một ứng viên từ danh sách</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          Nhấp vào bất kỳ ứng viên nào ở cột bên trái để xem hồ sơ năng lực chi tiết và các đoạn trích dẫn AI xác thực.
        </p>
      </div>
    );
  }

  const isPdf = candidate.documentType === "resume";
  const initials =
    candidate.candidateName
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "UV";

  const statusBadge = getApplicationStatusBadge(candidate.applicationStatus);
  const matchPct = Math.round(candidate.maxHybridScore * 100);
  const densePct = Math.round((candidate.maxDenseScore || 0) * 100);
  const sparsePct = Math.round((candidate.maxSparseScore || 0) * 100);

  const activeChunk = candidate.chunks[activeChunkIndex] || candidate.chunks[0];
  const secBadge = getSectionBadge(activeChunk.section_type);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden sticky top-6">
      {/* ── 1. Inspector Header & Action Bar ── */}
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          {/* Candidate Identity */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-indigo-100">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {candidate.candidateName}
                </h3>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                    statusBadge.color
                  )}
                >
                  {statusBadge.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                  {isPdf ? "PDF Đính kèm" : "CV Builder"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                {candidate.candidateEmail && (
                  <span className="truncate">{candidate.candidateEmail}</span>
                )}
                {candidate.appliedJobTitle && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="truncate font-medium text-slate-700">
                      Ứng tuyển: {candidate.appliedJobTitle}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDocPreview(candidate)}
              disabled={isPreviewLoading}
              className="h-8 px-3 rounded-lg text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              {isPreviewLoading ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              )}
              <span>Xem CV</span>
            </Button>

            <Button
              size="sm"
              onClick={() => onOpenCopilot(candidate)}
              className="h-8 px-3 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xs cursor-pointer border-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
              <span>AI Copilot</span>
            </Button>
          </div>
        </div>

        {/* ── 2. AI Hybrid Match Visual Breakdown ── */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                AI Semantic Match Score
              </span>
            </div>
            <div className="text-xs font-black text-indigo-700">
              {matchPct}% Phù hợp tổng thể
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 rounded-full"
              style={{ width: `${matchPct}%` }}
            />
          </div>

          {/* Micro Metrics: Dense (Vector) & Sparse (BM25) */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="flex items-center justify-between px-2.5 py-1 rounded-md bg-white border border-slate-200/60">
              <span className="text-slate-500">Ngữ nghĩa chuyên sâu (Dense):</span>
              <strong className="text-slate-800">{densePct}%</strong>
            </div>
            <div className="flex items-center justify-between px-2.5 py-1 rounded-md bg-white border border-slate-200/60">
              <span className="text-slate-500">Từ khóa chính xác (BM25):</span>
              <strong className="text-slate-800">{sparsePct}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Evidence Chunks Navigator ── */}
      <div className="p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bằng chứng trích xuất từ hồ sơ ({candidate.chunks.length})</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            Chọn tab để xem đối chiếu
          </span>
        </div>

        {/* Chunks Segmented Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          {candidate.chunks.map((chunk, cIdx) => {
            const badge = getSectionBadge(chunk.section_type);
            const Icon = badge.icon;
            const isTabActive = activeChunkIndex === cIdx;
            const chunkScore = Math.round(chunk.hybrid_score * 100);

            return (
              <button
                key={chunk.chunk_id}
                type="button"
                onClick={() => onSelectChunk(cIdx)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  isTabActive
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{badge.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isTabActive ? "bg-indigo-50 text-indigo-700" : "bg-slate-200/70 text-slate-500"
                  )}
                >
                  {chunkScore}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Chunk Content Block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChunk.chunk_id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3"
          >
            {/* Chunk Card Topbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border",
                    secBadge.color
                  )}
                >
                  <secBadge.icon className="w-3 h-3" />
                  {secBadge.label}
                </span>
                <span className="text-[11px] text-slate-400">
                  Phân đoạn #{activeChunk.chunk_id}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onCopyContent(activeChunk.content, activeChunk.chunk_id)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 px-2 py-1 rounded-md transition-all cursor-pointer shadow-2xs"
              >
                {copiedChunkId === activeChunk.chunk_id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép trích đoạn</span>
                  </>
                )}
              </button>
            </div>

            {/* Chunk Quote Text */}
            <div className="p-3.5 rounded-lg bg-white border-l-4 border-indigo-500 border-r border-t border-b border-slate-200 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line select-text">
              {activeChunk.content}
            </div>

            {/* Chunk Specific Skills Detected */}
            {((activeChunk.metadata?.skills as string[]) || []).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kỹ năng trích xuất:
                </span>
                {((activeChunk.metadata?.skills as string[]) || []).map((sk, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 4. Comprehensive Skill Inventory ── */}
      {candidate.allSkills.length > 0 && (
        <div className="p-5 space-y-2.5 bg-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tổng hợp kỹ năng trong hồ sơ ({candidate.allSkills.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {candidate.allSkills.map((skill, skIdx) => (
              <span
                key={skIdx}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/70"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Bottom Navigation / Application Link ── */}
      {candidate.applicationId && (
        <div className="p-4 bg-slate-50/70 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Mã đơn tuyển dụng: <strong>#{candidate.applicationId}</strong>
          </span>
          <Link
            to={`/employer/applications/${candidate.applicationId}`}
            className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>Mở Pipeline tuyển dụng</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

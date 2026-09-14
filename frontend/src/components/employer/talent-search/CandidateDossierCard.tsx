import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Code2,
  Wrench,
  FileText,
  GraduationCap,
  Sparkles,
  Layers,
  Copy,
  Check,
  Eye,
  Bot,
  ArrowUpRight,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RAGSearchResult } from "@/lib/api/rag";

export interface CandidateGroup {
  id: string;
  candidateName: string;
  candidateEmail?: string | null;
  userId?: number | null;
  documentType: "resume" | "cv_document" | string;
  documentId: number;
  documentTitle?: string | null;
  appliedJobId?: number | null;
  appliedJobTitle?: string | null;
  applicationStatus?: string | null;
  applicationId?: number | null;
  appliedAt?: string | null;
  maxHybridScore: number;
  maxDenseScore: number;
  maxSparseScore: number;
  chunks: RAGSearchResult[];
  allSkills: string[];
}

interface CandidateDossierCardProps {
  candidate: CandidateGroup;
  index: number;
  activeChunkIndex: number;
  onSelectChunk: (candidateId: string, chunkIdx: number) => void;
  onCopyContent: (content: string, chunkId: number) => void;
  copiedChunkId: number | null;
  onOpenDocPreview: (candidate: CandidateGroup) => void;
  isPreviewLoading: boolean;
  onOpenCopilot: (candidate: CandidateGroup) => void;
}

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

const getScoreTier = (score: number) => {
  const pct = Math.round(score * 100);
  if (pct >= 80) {
    return {
      label: "Rất phù hợp ⭐",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      textColor: "text-emerald-700",
      barColor: "bg-emerald-500",
    };
  }
  if (pct >= 60) {
    return {
      label: "Phù hợp cao",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      textColor: "text-indigo-700",
      barColor: "bg-indigo-600",
    };
  }
  return {
    label: "Tiềm năng",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    textColor: "text-amber-800",
    barColor: "bg-amber-500",
  };
};

export function CandidateDossierCard({
  candidate,
  index,
  activeChunkIndex,
  onSelectChunk,
  onCopyContent,
  copiedChunkId,
  onOpenDocPreview,
  isPreviewLoading,
  onOpenCopilot,
}: CandidateDossierCardProps) {
  const isPdf = candidate.documentType === "resume";
  const initials =
    candidate.candidateName
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "UV";

  const statusBadge = getApplicationStatusBadge(candidate.applicationStatus);
  const scoreTier = getScoreTier(candidate.maxHybridScore);
  const matchPct = Math.round(candidate.maxHybridScore * 100);

  const activeChunk = candidate.chunks[activeChunkIndex] || candidate.chunks[0];
  const secBadge = getSectionBadge(activeChunk.section_type);
  const SecIcon = secBadge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all space-y-5 group"
    >
      {/* ── Top Header: Candidate Identity & Score Gauge ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          {/* Avatar Initials */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 shadow-sm shadow-indigo-100 shrink-0 mt-0.5">
            {initials}
          </div>

          {/* Candidate Profile Details */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                {candidate.candidateName}
              </h3>
              {candidate.candidateEmail && (
                <span className="text-xs text-slate-400 font-medium">
                  ({candidate.candidateEmail})
                </span>
              )}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  isPdf
                    ? "bg-amber-50 text-amber-800 border-amber-200/80"
                    : "bg-teal-50 text-teal-800 border-teal-200/80"
                )}
              >
                {isPdf ? "PDF Đính kèm" : "CV Builder"}
              </span>
            </div>

            {/* Target Job Badge, Status & Date */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {candidate.appliedJobTitle ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
                  <Briefcase className="w-3 h-3 text-indigo-500" />
                  <span>Vị trí: <strong>{candidate.appliedJobTitle}</strong></span>
                </div>
              ) : (
                <span className="text-slate-400 text-xs">
                  {candidate.documentTitle || "Hồ sơ ứng viên"}
                </span>
              )}

              {candidate.applicationStatus && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] font-bold border",
                    statusBadge.color
                  )}
                >
                  {statusBadge.label}
                </span>
              )}

              {candidate.appliedAt && (
                <span className="text-slate-400 text-[11px]">
                  • Nộp {new Date(candidate.appliedAt).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Match Score KPI Gauge */}
        <div className="flex items-center gap-3.5 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200/80 shrink-0 self-start md:self-auto">
          <div className="text-right">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border",
                scoreTier.badgeColor
              )}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {scoreTier.label}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 justify-end">
              <span className={cn("text-2xl font-black leading-tight", scoreTier.textColor)}>
                {matchPct}%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[10px] text-slate-400 border-l border-slate-200 pl-3">
            <span className="text-slate-600 font-medium">
              Ngữ nghĩa: <strong>{Math.round(candidate.maxDenseScore * 100)}%</strong>
            </span>
            <span className="text-slate-500 font-medium">
              Từ khóa: <strong>{Math.round(candidate.maxSparseScore * 100)}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Matched Evidence Section: Multi-chunk Tabs & Snippet ── */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Bằng chứng đối chiếu:
            </span>

            {/* Evidence Tabs if multiple chunks */}
            {candidate.chunks.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                {candidate.chunks.map((chk, chkIdx) => {
                  const b = getSectionBadge(chk.section_type);
                  const isSelected = activeChunkIndex === chkIdx;
                  return (
                    <button
                      key={chk.chunk_id}
                      type="button"
                      onClick={() => onSelectChunk(candidate.id, chkIdx)}
                      className={cn(
                        "px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                        isSelected
                          ? "bg-white text-indigo-700 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      {b.label} ({Math.round(chk.hybrid_score * 100)}%)
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Copy Chunk Button */}
          <button
            type="button"
            onClick={() => onCopyContent(activeChunk.content, activeChunk.chunk_id)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-all cursor-pointer shrink-0"
            title="Sao chép đoạn trích dẫn này"
          >
            {copiedChunkId === activeChunk.chunk_id ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Sao chép dẫn chứng</span>
              </>
            )}
          </button>
        </div>

        {/* Active Snippet Container with Accent Border */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 border-l-4 border-l-indigo-500 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border",
                secBadge.color
              )}
            >
              <SecIcon className="w-3 h-3" />
              {secBadge.label} (Mã #{activeChunk.chunk_id})
            </span>
            {activeChunk.metadata?.role && (
              <span className="text-xs text-slate-700 font-bold">
                {String(activeChunk.metadata.role)}
                {activeChunk.metadata?.company_name
                  ? ` tại ${String(activeChunk.metadata.company_name)}`
                  : ""}
              </span>
            )}
            {activeChunk.metadata?.period && (
              <span className="text-xs text-slate-400 font-medium">
                • {String(activeChunk.metadata.period)}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
            {activeChunk.content}
          </p>
        </div>
      </div>

      {/* ── Skills Cloud & Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
        {/* Skills Extracted */}
        <div className="flex flex-wrap items-center gap-1.5 max-w-xl">
          {candidate.allSkills.slice(0, 8).map((sk, skIdx) => (
            <span
              key={skIdx}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/70"
            >
              {sk}
            </span>
          ))}
          {candidate.allSkills.length > 8 && (
            <span className="text-[11px] text-slate-400 font-medium">
              +{candidate.allSkills.length - 8} kỹ năng khác
            </span>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Full CV */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpenDocPreview(candidate)}
            disabled={isPreviewLoading}
            className="h-8.5 px-3 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-200 cursor-pointer"
          >
            {isPreviewLoading ? (
              <Spinner size="sm" className="mr-1" />
            ) : (
              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
            )}
            Xem CV
          </Button>

          {/* Ask AI Copilot */}
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenCopilot(candidate)}
            className="h-8.5 px-3 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/90 shadow-2xs cursor-pointer transition-colors"
          >
            <Bot className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Hỏi AI Copilot
          </Button>

          {/* Pipeline Link */}
          <Link to="/employer/candidates">
            <Button
              type="button"
              size="sm"
              className="h-8.5 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs cursor-pointer transition-colors"
            >
              <span>Hồ sơ tuyển dụng</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-indigo-200" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

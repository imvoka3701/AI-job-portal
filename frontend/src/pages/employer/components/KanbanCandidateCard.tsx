/**
 * KanbanCandidateCard — UI/UX Architect Component (Hướng 2 Lần 1)
 * Premium candidate card for the ATS Kanban board.
 * Features: colorful avatar initials, AI score arc badge, drag handle,
 * quick-action buttons (CV / Chat / Move Next), Framer Motion lift effect.
 */
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Calendar,
  Zap,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { ApplicationStatus, EmployerApplication } from "@/types/application";
import type { RoundItem } from "@/lib/api/rounds";

// ─── Avatar color palette (hash by name) ────────────────────────────────────
const AVATAR_PALETTES = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-700",
  "from-cyan-500 to-sky-600",
  "from-fuchsia-500 to-purple-700",
];

function getAvatarGradient(name: string): string {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[sum % AVATAR_PALETTES.length];
}

// ─── AI Score badge ──────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null)
    return (
      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
        Chưa tính
      </span>
    );
  const rounded = Math.round(score);
  const cls =
    rounded >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : rounded >= 60
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md border", cls)}>
      <Sparkles className="w-2.5 h-2.5" />
      {rounded}%
    </span>
  );
}

// ─── Round indicator ─────────────────────────────────────────────────────────
const ROUND_TYPE_NAMES: Record<string, string> = {
  cv_screen: "CV", tech: "Tech", hr: "HR", final: "Final", custom: "PV",
};

// ─── Props ───────────────────────────────────────────────────────────────────
export interface KanbanCandidateCardProps {
  app: EmployerApplication;
  rounds: RoundItem[];
  isSelected: boolean;
  isBusy: boolean;
  isDragging: boolean;
  canManagePipeline: boolean;
  nextStatus?: ApplicationStatus;
  nextLabel?: string;
  onSelect: () => void;
  onStatusChange: (appId: number, status: ApplicationStatus) => Promise<void>;
  onPreviewResume: (url: string) => void;
  onPreviewBuilder: (app: EmployerApplication) => void;
  onOpenChat?: (app: EmployerApplication) => void;
  onSkillGap?: (app: EmployerApplication) => void;
  onDragStart: (appId: number) => void;
}

export function KanbanCandidateCard({
  app,
  rounds,
  isSelected,
  isBusy,
  isDragging,
  canManagePipeline,
  nextStatus,
  nextLabel,
  onSelect,
  onStatusChange,
  onPreviewResume,
  onPreviewBuilder,
  onOpenChat,
  onSkillGap,
  onDragStart,
}: KanbanCandidateCardProps) {
  const candidateName = app.candidate?.full_name ?? "Ứng viên";
  const initials = getInitials(candidateName);
  const gradient = getAvatarGradient(candidateName);

  const activeRound =
    rounds.find((r) => r.status === "in_progress") ||
    rounds.find((r) => r.status === "pending") ||
    rounds[rounds.length - 1];

  const handleNextStage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextStatus || isBusy) return;
    await onStatusChange(app.id, nextStatus);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0, scale: isDragging ? 0.97 : 1 }}
      transition={{ duration: 0.18 }}
      draggable={canManagePipeline}
      onDragStart={() => onDragStart(app.id)}
      onClick={onSelect}
      className={cn(
        "group rounded-xl border p-3.5 bg-white text-left cursor-grab active:cursor-grabbing transition-all duration-150 shadow-xs select-none",
        isSelected
          ? "border-emerald-400 ring-2 ring-emerald-300/30 bg-emerald-50/30 shadow-sm"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
        isBusy && "opacity-50 pointer-events-none"
      )}
      data-testid="kanban-card"
    >
      {/* Header: Colored Avatar + Name */}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div
          className={cn(
            "w-9 h-9 rounded-xl bg-gradient-to-br text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm",
            gradient
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-emerald-700 transition-colors">
            {candidateName}
          </h4>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {app.candidate?.email ?? "N/A"}
          </p>
        </div>
      </div>

      {/* Middle: AI Score + Active Round */}
      <div className="flex items-center justify-between gap-1 mb-3">
        <ScoreBadge score={app.ai_matching_score} />
        {activeRound && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md">
            <Calendar className="w-2.5 h-2.5 text-indigo-400" />
            V{activeRound.round_number}:{" "}
            {ROUND_TYPE_NAMES[activeRound.round_type] ?? activeRound.round_type}
          </span>
        )}
      </div>

      {/* Footer: Quick Actions */}
      <div className="flex items-center justify-between gap-1.5 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {/* CV Preview */}
          {app.resume_id && app.resume?.file_url ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreviewResume(`/resumes/${app.resume_id}/content`); }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
              title="Xem PDF CV"
            >
              <FileText className="w-3 h-3" /> PDF
            </button>
          ) : app.cv_document ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreviewBuilder(app); }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
              title="Xem CV Builder"
            >
              <FileText className="w-3 h-3" /> Builder
            </button>
          ) : (
            <span className="text-[11px] text-slate-300 italic">Không có CV</span>
          )}

          {/* Chat */}
          {onOpenChat && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenChat(app); }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
              title="Nhắn tin"
            >
              <MessageSquare className="w-3 h-3" /> Chat
            </button>
          )}

          {/* Skill Gap Analysis */}
          {onSkillGap && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSkillGap(app); }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
              title="Phân tích khoảng cách kỹ năng (Skill Gap)"
            >
              <Zap className="w-3 h-3 text-amber-500" /> Gap
            </button>
          )}
        </div>

        {/* Move to Next Stage */}
        {canManagePipeline && nextStatus && (
          <button
            type="button"
            onClick={handleNextStage}
            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-2 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
            title={`Chuyển sang: ${nextLabel}`}
          >
            {nextLabel} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

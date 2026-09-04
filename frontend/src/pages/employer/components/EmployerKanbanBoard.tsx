import { useState } from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  Eye,
  Star,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Sparkles,
  ChevronRight,
  UserRound,
} from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import type { ApplicationStatus, EmployerApplication } from "@/types/application";
import type { RoundItem } from "@/lib/api/rounds";

export interface EmployerKanbanBoardProps {
  applications: EmployerApplication[];
  roundsMap: Record<number, RoundItem[]>;
  selectedApplicationId: number | null;
  onSelectApplication: (id: number) => void;
  onStatusChange: (applicationId: number, status: ApplicationStatus) => Promise<void>;
  onPreviewResume: (url: string) => void;
  onPreviewBuilder: (application: EmployerApplication) => void;
  canManagePipeline: boolean;
}

interface KanbanColumnConfig {
  id: ApplicationStatus;
  title: string;
  icon: typeof Inbox;
  badgeStyle: string;
  dotColor: string;
  nextStatus?: ApplicationStatus;
  nextLabel?: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "pending",
    title: "Chờ duyệt",
    icon: Inbox,
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
    nextStatus: "reviewed",
    nextLabel: "Duyệt CV",
  },
  {
    id: "reviewed",
    title: "Đang xem xét",
    icon: Eye,
    badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dotColor: "bg-indigo-500",
    nextStatus: "shortlisted",
    nextLabel: "Chọn lọc",
  },
  {
    id: "shortlisted",
    title: "Hồ sơ chọn lọc",
    icon: Star,
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    nextStatus: "interview",
    nextLabel: "Phỏng vấn",
  },
  {
    id: "interview",
    title: "Vòng phỏng vấn",
    icon: CalendarCheck,
    badgeStyle: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
    nextStatus: "accepted",
    nextLabel: "Trúng tuyển",
  },
  {
    id: "accepted",
    title: "Đã trúng tuyển",
    icon: CheckCircle2,
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  {
    id: "rejected",
    title: "Từ chối",
    icon: XCircle,
    badgeStyle: "bg-slate-50 text-slate-600 border-slate-200",
    dotColor: "bg-slate-400",
  },
];

function getMatchScoreBadge(score: number | null | undefined) {
  if (score == null) {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
        Chưa tính match
      </span>
    );
  }
  const rounded = Math.round(score);
  if (rounded >= 80) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Sparkles className="w-2.5 h-2.5" />
        {rounded}% MATCH
      </span>
    );
  }
  if (rounded >= 50) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        {rounded}% MATCH
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
      {rounded}% MATCH
    </span>
  );
}

export function EmployerKanbanBoard({
  applications,
  roundsMap,
  selectedApplicationId,
  onSelectApplication,
  onStatusChange,
  onPreviewResume,
  onPreviewBuilder,
  canManagePipeline,
}: EmployerKanbanBoardProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleQuickNextStage = async (
    e: React.MouseEvent,
    appId: number,
    nextStatus?: ApplicationStatus
  ) => {
    e.stopPropagation();
    if (!nextStatus || updatingId !== null) return;
    try {
      setUpdatingId(appId);
      await onStatusChange(appId, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div
      className="overflow-x-auto pb-6 pt-2"
      data-testid="employer-kanban-board"
    >
      <div className="flex gap-3.5 min-w-[1140px] w-full px-2">
        {KANBAN_COLUMNS.map((column) => {
          const colApps = applications.filter((app) => app.status === column.id);
          const ColumnIcon = column.icon;

          return (
            <div
              key={column.id}
              className="flex-1 flex flex-col bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 min-w-[220px] max-w-[340px] shadow-xs"
              data-testid={`kanban-column-${column.id}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("p-1.5 rounded-lg border", column.badgeStyle)}>
                    <ColumnIcon className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {column.title}
                  </span>
                </div>
                <span className="inline-flex items-center justify-center h-5 px-2 rounded-full text-[11px] font-bold bg-white text-slate-600 border border-slate-200/80 shadow-2xs">
                  {colApps.length}
                </span>
              </div>

              {/* Column Content / Cards */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[620px] pr-1">
                {colApps.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-200/70 rounded-xl bg-white/50">
                    <UserRound className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                    <p className="text-[11px] font-medium text-slate-400">Trống</p>
                  </div>
                ) : (
                  colApps.map((app) => {
                    const isSelected = app.id === selectedApplicationId;
                    const candidateName = app.candidate?.full_name ?? "Ứng viên";
                    const initials = getInitials(candidateName);
                    const rounds = roundsMap[app.id] ?? [];
                    const isBusy = updatingId === app.id;

                    return (
                      <motion.div
                        key={app.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onSelectApplication(app.id)}
                        className={cn(
                          "group rounded-xl border p-3.5 bg-white text-left cursor-pointer transition-all duration-200 shadow-xs",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-400/20 bg-emerald-50/20 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
                          isBusy && "opacity-60 pointer-events-none"
                        )}
                        data-testid="kanban-card"
                      >
                        {/* Header: Avatar, Name & Detail preview */}
                        <div className="flex items-start gap-2.5 mb-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200/80 shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-emerald-700 transition-colors">
                              {candidateName}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {app.candidate?.email ?? "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Middle: AI Match Badge & Rounds count */}
                        <div className="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
                          {getMatchScoreBadge(app.ai_matching_score)}
                          {rounds.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                              <Calendar className="w-2.5 h-2.5" />
                              {rounds.length} vòng
                            </span>
                          )}
                        </div>

                        {/* Footer: CV actions & Quick Stage advance */}
                        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                          {/* CV preview link */}
                          {app.resume?.file_url ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreviewResume(app.resume!.file_url!);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Xem file PDF CV"
                            >
                              <FileText className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" />
                              <span>CV</span>
                            </button>
                          ) : app.cv_document ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreviewBuilder(app);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Xem CV Builder"
                            >
                              <FileText className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" />
                              <span>Builder</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Không có CV</span>
                          )}

                          {/* Quick next stage button */}
                          {canManagePipeline && column.nextStatus && (
                            <button
                              type="button"
                              onClick={(e) =>
                                handleQuickNextStage(e, app.id, column.nextStatus)
                              }
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-2 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                              title={`Chuyển sang: ${column.nextLabel}`}
                            >
                              <span>{column.nextLabel}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

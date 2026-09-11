/**
 * EmployerKanbanBoard — Hướng 2 Lần 2: HTML5 Drag & Drop ATS Kanban Board
 * Uses native HTML5 drag events (no external DnD library) to move candidates
 * between pipeline stages. Drop zones highlight on dragover.
 */
import { useState } from "react";
import {
  Inbox,
  Eye,
  Star,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanCandidateCard } from "./KanbanCandidateCard";
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
  onOpenChat?: (application: EmployerApplication) => void;
  onSkillGap?: (application: EmployerApplication) => void;
  canManagePipeline: boolean;
}

interface KanbanColumnConfig {
  id: ApplicationStatus;
  title: string;
  icon: typeof Inbox;
  badgeStyle: string;
  headerBg: string;
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
    headerBg: "bg-blue-50/60",
    dotColor: "bg-blue-500",
    nextStatus: "reviewed",
    nextLabel: "Duyệt CV",
  },
  {
    id: "reviewed",
    title: "Đang xem xét",
    icon: Eye,
    badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
    headerBg: "bg-indigo-50/60",
    dotColor: "bg-indigo-500",
    nextStatus: "shortlisted",
    nextLabel: "Chọn lọc",
  },
  {
    id: "shortlisted",
    title: "Hồ sơ chọn lọc",
    icon: Star,
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
    headerBg: "bg-amber-50/60",
    dotColor: "bg-amber-500",
    nextStatus: "interview",
    nextLabel: "Phỏng vấn",
  },
  {
    id: "interview",
    title: "Vòng phỏng vấn",
    icon: CalendarCheck,
    badgeStyle: "bg-purple-50 text-purple-700 border-purple-200",
    headerBg: "bg-purple-50/60",
    dotColor: "bg-purple-500",
    nextStatus: "accepted",
    nextLabel: "Trúng tuyển",
  },
  {
    id: "accepted",
    title: "Đã trúng tuyển",
    icon: CheckCircle2,
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    headerBg: "bg-emerald-50/60",
    dotColor: "bg-emerald-500",
  },
  {
    id: "rejected",
    title: "Từ chối",
    icon: XCircle,
    badgeStyle: "bg-slate-50 text-slate-600 border-slate-200",
    headerBg: "bg-slate-50/60",
    dotColor: "bg-slate-400",
  },
];

export function EmployerKanbanBoard({
  applications,
  roundsMap,
  selectedApplicationId,
  onSelectApplication,
  onStatusChange,
  onPreviewResume,
  onPreviewBuilder,
  onOpenChat,
  onSkillGap,
  canManagePipeline,
}: EmployerKanbanBoardProps) {
  // ── Drag & Drop state ────────────────────────────────────────────────────
  const [draggingAppId, setDraggingAppId] = useState<number | null>(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState<ApplicationStatus | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleDragStart = (appId: number) => {
    setDraggingAppId(appId);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    columnId: ApplicationStatus
  ) => {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
    if (dropTargetColumnId !== columnId) {
      setDropTargetColumnId(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if leaving the column container entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTargetColumnId(null);
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    columnId: ApplicationStatus
  ) => {
    e.preventDefault();
    setDropTargetColumnId(null);

    if (draggingAppId == null || updatingId != null) {
      setDraggingAppId(null);
      return;
    }

    // Find current status of dragged app
    const draggedApp = applications.find((a) => a.id === draggingAppId);
    if (!draggedApp || draggedApp.status === columnId) {
      setDraggingAppId(null);
      return;
    }

    try {
      setUpdatingId(draggingAppId);
      await onStatusChange(draggingAppId, columnId);
    } finally {
      setUpdatingId(null);
      setDraggingAppId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingAppId(null);
    setDropTargetColumnId(null);
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
          const isDropTarget = dropTargetColumnId === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex-1 flex flex-col rounded-2xl border p-3 min-w-[220px] max-w-[340px] shadow-xs transition-all duration-150",
                isDropTarget
                  ? "border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-300/30 scale-[1.01]"
                  : "border-slate-200/80 bg-slate-50/70"
              )}
              data-testid={`kanban-column-${column.id}`}
            >
              {/* Column Header */}
              <div className={cn("flex items-center justify-between gap-2 px-1 py-2 mb-2 rounded-xl", column.headerBg)}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("p-1.5 rounded-lg border", column.badgeStyle)}>
                    <ColumnIcon className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {column.title}
                  </span>
                </div>
                <span className="inline-flex items-center justify-center h-5 px-2 rounded-full text-[11px] font-bold bg-white text-slate-600 border border-slate-200/80 shadow-2xs shrink-0">
                  {colApps.length}
                </span>
              </div>

              {/* Drop zone hint when dragging */}
              {isDropTarget && draggingAppId != null && (
                <div className="mb-2 px-2 py-1.5 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 text-center text-[10px] font-bold text-emerald-600">
                  Thả vào đây →
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                {colApps.length === 0 ? (
                  <div className={cn(
                    "py-8 text-center border-2 border-dashed rounded-xl transition-colors",
                    isDropTarget
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-slate-200/70 bg-white/50"
                  )}>
                    <UserRound className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                    <p className="text-[11px] font-medium text-slate-400">
                      {isDropTarget ? "Thả ứng viên vào đây" : "Trống"}
                    </p>
                  </div>
                ) : (
                  colApps.map((app) => (
                    <KanbanCandidateCard
                      key={app.id}
                      app={app}
                      rounds={roundsMap[app.id] ?? []}
                      isSelected={app.id === selectedApplicationId}
                      isBusy={updatingId === app.id}
                      isDragging={draggingAppId === app.id}
                      canManagePipeline={canManagePipeline}
                      nextStatus={column.nextStatus}
                      nextLabel={column.nextLabel}
                      onSelect={() => onSelectApplication(app.id)}
                      onStatusChange={onStatusChange}
                      onPreviewResume={onPreviewResume}
                      onPreviewBuilder={onPreviewBuilder}
                      onOpenChat={onOpenChat}
                      onSkillGap={onSkillGap}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

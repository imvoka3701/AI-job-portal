import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  HelpCircle,
  History,
  Mail,
  MessageSquare,
  Search,
  SearchX,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  XCircle,
  Copy,
  Phone,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, ErrorState, PipelineStepper } from "@/components/ui";
import { getInitials, cn } from "@/lib/utils";
import type { Job } from "@/types/job";
import type { ApplicationStatus, EmployerApplication } from "@/types/application";
import type { RoundItem } from "@/lib/api/rounds";
import { EmployerAIActionMenu } from "./EmployerAIActionMenu";
import { EmployerCandidateRadarChart } from "./EmployerCandidateRadarChart";

export type SortMode = "match_score" | "submitted_date" | "status_priority" | "name_asc";
export type FilterStatus = ApplicationStatus | "all";
export type FilterRound = "all" | "cv_screen" | "tech" | "hr" | "final" | "custom" | "no_rounds";

interface EmployerApplicationListProps {
  jobs: Job[];
  selectedJobId: number | null;
  selectedJobTitle: string;
  jobsLoading: boolean;
  jobsError: string | null;
  applications: EmployerApplication[];
  appsLoading: boolean;
  appsError: string | null;
  roundsMap: Record<number, RoundItem[]>;
  onSelectJob: (job: { id: number; title: string }) => void;
  onPreviewResume: (url: string) => void;
  onPreviewBuilder: (application: EmployerApplication) => void;
  onSummarize: (app: EmployerApplication) => void;
  onGenerateQuestions: (app: EmployerApplication) => void;
  onGenerateEmail: (app: EmployerApplication) => void;
  onEvaluate: (app: EmployerApplication) => void;
  onOpenRounds: (app: EmployerApplication) => void;
  canManagePipeline: boolean;
  canRecommend: boolean;
  onStatusChange: (applicationId: number, status: ApplicationStatus, decisionReason?: string) => Promise<void>;
  onRecommendationChange: (applicationId: number, recommendation: "recommended" | "not_recommended" | "needs_more_review", note?: string) => Promise<void>;
}

function getMatchLabel(score: number): { label: string; variant: "success" | "warning" | "danger" } {
  if (score >= 80) return { label: "Rất phù hợp", variant: "success" };
  if (score >= 50) return { label: "Phù hợp một phần", variant: "warning" };
  return { label: "Ít phù hợp", variant: "danger" };
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Đang chờ duyệt",
  reviewed: "Đã duyệt CV",
  shortlisted: "Danh sách ngắn",
  interview: "Đang phỏng vấn",
  accepted: "Trúng tuyển",
  rejected: "Đã từ chối",
};

export function EmployerApplicationList({
  jobs,
  selectedJobId,
  selectedJobTitle,
  jobsLoading,
  jobsError,
  applications,
  appsLoading,
  appsError,
  roundsMap,
  onSelectJob,
  onPreviewResume,
  onPreviewBuilder,
  onSummarize,
  onGenerateQuestions,
  onGenerateEmail,
  onEvaluate,
  onOpenRounds,
  canManagePipeline,
  canRecommend,
  onStatusChange,
  onRecommendationChange,
}: EmployerApplicationListProps) {
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Filters and sorting
  const [urlParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState(() => urlParams.get("search") ?? "");
  const [sortMode, setSortMode] = useState<SortMode>("match_score");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterRound, setFilterRound] = useState<FilterRound>("all");
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "internal_notes">("overview");

  // Sync URL ?search= param → local filter
  useEffect(() => {
    const q = urlParams.get("search") ?? "";
    if (q) {
      setSearchKeyword(q);
      setShowFilters(true); // auto-expand filter panel so user can see the active search
    }
  }, [urlParams]);

  useEffect(() => {
    if (applications.length === 0) {
      setSelectedApplicationId(null);
      return;
    }
    if (!selectedApplicationId || !applications.some((app) => app.id === selectedApplicationId)) {
      setSelectedApplicationId(applications[0].id);
    }
  }, [applications, selectedApplicationId]);

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let result = [...applications];

    // Keyword search (name, email, phone, note, reason, feedback)
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      result = result.filter((app) => {
        const name = (app.candidate?.full_name ?? "").toLowerCase();
        const email = (app.candidate?.email ?? "").toLowerCase();
        const phone = (app.candidate?.phone ?? "").toLowerCase();
        const note = (app.recommendation_note ?? "").toLowerCase();
        const reason = (app.decision_reason ?? "").toLowerCase();
        const feedback = (app.ai_feedback ?? "").toLowerCase();
        const cover = (app.cover_letter ?? "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          note.includes(q) ||
          reason.includes(q) ||
          feedback.includes(q) ||
          cover.includes(q)
        );
      });
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((app) => app.status === filterStatus);
    }

    // Round filter
    if (filterRound !== "all") {
      result = result.filter((app) => {
        const appRounds = roundsMap[app.id] ?? [];
        if (filterRound === "no_rounds") {
          return appRounds.length === 0;
        }
        return appRounds.some((r) => r.round_type === filterRound);
      });
    }

    // Score filter
    if (filterMinScore > 0) {
      result = result.filter((app) => (app.ai_matching_score ?? 0) >= filterMinScore);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortMode === "match_score") {
        return (b.ai_matching_score ?? 0) - (a.ai_matching_score ?? 0);
      } else if (sortMode === "submitted_date") {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      } else if (sortMode === "status_priority") {
        const statusPriority: Record<ApplicationStatus, number> = {
          pending: 1,
          reviewed: 2,
          shortlisted: 3,
          interview: 4,
          accepted: 5,
          rejected: 6,
        };
        return (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
      } else if (sortMode === "name_asc") {
        const nameA = a.candidate?.full_name ?? "";
        const nameB = b.candidate?.full_name ?? "";
        return nameA.localeCompare(nameB, "vi");
      }
      return 0;
    });

    return result;
  }, [applications, searchKeyword, filterStatus, filterRound, filterMinScore, sortMode, roundsMap]);

  const selectedApplication = useMemo(
    () => applications.find((app) => app.id === selectedApplicationId) ?? null,
    [applications, selectedApplicationId],
  );

  const parsedSkillAnalysis = useMemo(() => {
    if (!selectedApplication?.resume) return null;
    if (selectedApplication.resume.ai_evaluation_json) {
      try {
        const raw = typeof selectedApplication.resume.ai_evaluation_json === "string"
          ? JSON.parse(selectedApplication.resume.ai_evaluation_json)
          : selectedApplication.resume.ai_evaluation_json;
        if (raw?.skill_analysis) return raw.skill_analysis;
      } catch {
        // ignore
      }
    }
    if (selectedApplication.resume.parsed_skills) {
      try {
        const skills = typeof selectedApplication.resume.parsed_skills === "string"
          ? JSON.parse(selectedApplication.resume.parsed_skills)
          : selectedApplication.resume.parsed_skills;
        if (Array.isArray(skills) && skills.length > 0) {
          const dict: Record<string, number> = {};
          skills.slice(0, 6).forEach((s: string, idx: number) => {
            dict[s] = Math.max(7, 9.5 - idx * 0.4);
          });
          return dict;
        }
      } catch {
        // ignore
      }
    }
    return null;
  }, [selectedApplication]);

  useEffect(() => {
    setInternalNoteDraft(selectedApplication?.recommendation_note ?? "");
    setDecisionReason(selectedApplication?.decision_reason ?? "");
    setActionError(null);
    setActionSuccess(null);
  }, [
    selectedApplication?.id,
    selectedApplication?.decision_reason,
    selectedApplication?.recommendation_note,
  ]);

  const runAction = async (action: () => Promise<void>, successMessage?: string) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await action();
      if (successMessage) {
        setActionSuccess(successMessage);
        setTimeout(() => setActionSuccess(null), 3500);
      }
    } catch {
      setActionError("Không thể cập nhật. Vui lòng kiểm tra quyền và thử lại.");
    } finally {
      setActionLoading(false);
    }
  };

  const activeFiltersCount =
    (searchKeyword.trim() ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0) +
    (filterRound !== "all" ? 1 : 0) +
    (filterMinScore > 0 ? 1 : 0);

  return (
    <Card className="border-gray-200 shadow-sm overflow-hidden font-sans">
      <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="border-b border-gray-200 bg-bg-secondary lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Tuyển dụng đang mở</h2>
            <p className="text-sm text-gray-500">Chọn một job để xem ứng viên theo pipeline.</p>
          </div>
          <div className="max-h-[640px] overflow-y-auto p-3">
            {jobsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : jobsError ? (
              <ErrorState title="Không tải được danh sách job" message={jobsError} className="py-10" />
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="w-7 h-7 text-gray-400" />}
                title="Chưa có tin đang hoạt động"
                description="Hãy đăng ít nhất một job để bắt đầu xem pipeline ứng viên."
                action={
                  <Button variant="primary" size="sm" onClick={() => window.location.assign("/employer/jobs/new")}>
                    Đăng tin mới
                  </Button>
                }
                className="py-10"
              />
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onSelectJob({ id: job.id, title: job.title })}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                      selectedJobId === job.id
                        ? "border-primary bg-primary-light/40"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{job.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {job.job_type.replace("_", "-")} · {job.location || "Toàn quốc"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 bg-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedJobId ? `Ứng viên: ${selectedJobTitle}` : "Chọn một job để xem ứng viên"}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredAndSortedApplications.length} ứng viên hiển thị {applications.length !== filteredAndSortedApplications.length && `(${applications.length} tổng hồ sơ)`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters || activeFiltersCount > 0 ? "border-primary text-primary bg-primary-light/20" : ""}
                >
                  Bộ lọc & Tìm kiếm {activeFiltersCount > 0 && <Badge variant="primary" size="sm" className="ml-1.5">{activeFiltersCount}</Badge>}
                </Button>
                {selectedApplication && (
                  <EmployerAIActionMenu
                    application={selectedApplication}
                    onSummarize={onSummarize}
                    onGenerateQuestions={onGenerateQuestions}
                    onGenerateEmail={onGenerateEmail}
                    onEvaluate={onEvaluate}
                  />
                )}
              </div>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid gap-3 pt-3 border-t border-gray-100 sm:grid-cols-2 lg:grid-cols-4"
              >
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Tìm kiếm</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tên hoặc email ứng viên..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Trạng thái hồ sơ</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Đang chờ duyệt</option>
                    <option value="reviewed">Đã duyệt CV</option>
                    <option value="shortlisted">Danh sách ngắn</option>
                    <option value="interview">Đang phỏng vấn</option>
                    <option value="accepted">Trúng tuyển</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Vòng phỏng vấn</label>
                  <select
                    value={filterRound}
                    onChange={(e) => setFilterRound(e.target.value as FilterRound)}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">Tất cả các vòng</option>
                    <option value="cv_screen">Duyệt CV</option>
                    <option value="tech">PV Kỹ thuật</option>
                    <option value="hr">PV Nhân sự</option>
                    <option value="final">Vòng cuối</option>
                    <option value="custom">Khác</option>
                    <option value="no_rounds">Chưa thiết lập vòng</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Sắp xếp theo</label>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="match_score">Điểm AI cao nhất</option>
                    <option value="submitted_date">Ngày nộp mới nhất</option>
                    <option value="status_priority">Ưu tiên trạng thái</option>
                    <option value="name_asc">Tên ứng viên (A - Z)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-700">Điểm AI tối thiểu:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={filterMinScore}
                      onChange={(e) => setFilterMinScore(Number(e.target.value))}
                      className="w-28 sm:w-36 accent-primary"
                    />
                    <span className="text-xs font-semibold text-primary">{filterMinScore}%</span>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchKeyword("");
                        setFilterStatus("all");
                        setFilterRound("all");
                        setFilterMinScore(0);
                        setSortMode("match_score");
                      }}
                    >
                      Đặt lại bộ lọc
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <div className="grid gap-0 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="border-b border-gray-200 xl:border-b-0 xl:border-r">
              <div className="max-h-[640px] overflow-y-auto p-4">
                {appsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-24 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                  </div>
                ) : appsError ? (
                  <ErrorState title="Không tải được ứng viên" message={appsError} className="py-10" />
                ) : !selectedJobId ? (
                  <EmptyState
                    icon={<SearchX className="w-7 h-7 text-gray-400" />}
                    title="Chưa chọn job"
                    description="Chọn một tin tuyển dụng bên trái để xem danh sách ứng viên."
                    className="py-10"
                  />
                ) : filteredAndSortedApplications.length === 0 && applications.length > 0 ? (
                  <EmptyState
                    icon={<Filter className="w-7 h-7 text-gray-400" />}
                    title="Không có ứng viên phù hợp"
                    description="Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc để tìm kiếm."
                    action={
                      <Button variant="outline" size="sm" onClick={() => {
                        setSearchKeyword("");
                        setFilterStatus("all");
                        setFilterRound("all");
                        setFilterMinScore(0);
                      }}>
                        Xóa bộ lọc
                      </Button>
                    }
                    className="py-10"
                  />
                ) : filteredAndSortedApplications.length === 0 ? (
                  <EmptyState
                    icon={<UserRound className="w-7 h-7 text-gray-400" />}
                    title="Chưa có ứng viên"
                    description="Ứng viên sẽ xuất hiện tại đây sau khi họ ứng tuyển vào job này."
                    className="py-10"
                  />
                ) : (
                  <div className="space-y-2.5">
                    {filteredAndSortedApplications.map((app, index) => {
                      const isSelected = app.id === selectedApplicationId;
                      const tier = app.ai_matching_score != null ? getMatchLabel(app.ai_matching_score) : null;
                      const appRounds = roundsMap[app.id] ?? [];

                      return (
                        <motion.div
                          key={app.id}
                          data-testid="application-row"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "w-full rounded-lg border p-4 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary-light/30 shadow-xs"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                          )}
                        >
                          <button
                            type="button"
                            aria-label={`Chọn ứng viên ${app.candidate?.full_name ?? app.id}`}
                            onClick={() => setSelectedApplicationId(app.id)}
                            className="flex w-full items-center gap-3 text-left"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                              {index + 1}
                            </div>
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary-light text-primary flex items-center justify-center border border-primary/10">
                              {app.candidate?.avatar_url ? (
                                <img src={app.candidate.avatar_url} alt={app.candidate.full_name} className="h-full w-full object-cover" />
                              ) : (
                                getInitials(app.candidate?.full_name ?? "?")
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {app.candidate?.full_name ?? `Ứng viên #${app.id}`}
                              </p>
                              <p className="truncate text-xs text-gray-500">{app.candidate?.email ?? "Chưa có email"}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              {tier ? (
                                <Badge variant={tier.variant} size="sm">
                                  {app.ai_matching_score!.toFixed(0)}% · {tier.label}
                                </Badge>
                              ) : (
                                <Badge variant="default" size="sm">Chưa chấm</Badge>
                              )}
                              <span className="text-[10px] font-medium text-gray-500">
                                {STATUS_LABELS[app.status] ?? app.status}
                              </span>
                            </div>
                          </button>
                          <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-2.5">
                            <PipelineStepper rounds={appRounds} loading={appsLoading} />
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenRounds(app);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                            >
                              Chi tiết ({appRounds.length} vòng)
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 bg-bg-secondary">
              <div className="max-h-[640px] overflow-y-auto p-4">
                {!selectedApplication ? (
                  <EmptyState
                    icon={<FileText className="w-7 h-7 text-gray-400" />}
                    title="Chọn một ứng viên để xem chi tiết"
                    description="Mở một ứng viên từ danh sách bên trái để xem hồ sơ, CV, AI actions và pipeline."
                    className="py-16"
                  />
                ) : (
                  <div className="space-y-4">
                    <Card className="border-gray-200 shadow-sm">
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-primary-light text-primary flex items-center justify-center border border-primary/10 text-lg font-bold">
                            {selectedApplication.candidate?.avatar_url ? (
                              <img
                                src={selectedApplication.candidate.avatar_url}
                                alt={selectedApplication.candidate.full_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitials(selectedApplication.candidate?.full_name ?? "?")
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">
                                {selectedApplication.candidate?.full_name ?? `Ứng viên #${selectedApplication.id}`}
                              </h3>
                              {selectedApplication.ai_matching_score != null && (
                                <Badge variant={getMatchLabel(selectedApplication.ai_matching_score).variant} size="sm">
                                  {selectedApplication.ai_matching_score.toFixed(0)}% phù hợp
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                              {selectedApplication.candidate?.email && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyEmail(selectedApplication.candidate!.email)}
                                  className="inline-flex items-center gap-1 hover:text-primary transition-colors text-gray-500 hover:bg-gray-100 px-1.5 py-0.5 rounded"
                                  title="Nhấp để sao chép email"
                                >
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{selectedApplication.candidate.email}</span>
                                  {copiedEmail ? (
                                    <span className="text-[10px] text-green-600 font-medium ml-1">✓ Đã chép</span>
                                  ) : (
                                    <Copy className="w-3 h-3 text-gray-400 opacity-60" />
                                  )}
                                </button>
                              )}
                              {selectedApplication.candidate?.phone && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyPhone(selectedApplication.candidate!.phone!)}
                                  className="inline-flex items-center gap-1 hover:text-primary transition-colors text-gray-500 hover:bg-gray-100 px-1.5 py-0.5 rounded"
                                  title="Nhấp để sao chép số điện thoại"
                                >
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{selectedApplication.candidate.phone}</span>
                                  {copiedPhone ? (
                                    <span className="text-[10px] text-green-600 font-medium ml-1">✓ Đã chép</span>
                                  ) : (
                                    <Copy className="w-3 h-3 text-gray-400 opacity-60" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <p className="text-xs text-gray-500">Trạng thái hiện tại</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {STATUS_LABELS[selectedApplication.status] ?? selectedApplication.status}
                            </p>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <p className="text-xs text-gray-500">Ngày nộp hồ sơ</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(selectedApplication.applied_at).toLocaleDateString("vi-VN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <div className="flex border-b border-gray-200 bg-white rounded-lg px-2 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className={cn(
                          "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors",
                          activeTab === "overview"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-900",
                        )}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Tổng quan & Pipeline
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("internal_notes")}
                        className={cn(
                          "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors",
                          activeTab === "internal_notes"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-900",
                        )}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Nhận xét nội bộ
                        {selectedApplication.recommendation_note && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("timeline")}
                        className={cn(
                          "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors",
                          activeTab === "timeline"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-900",
                        )}
                      >
                        <History className="w-3.5 h-3.5" />
                        Lịch sử chuyển trạng thái
                      </button>
                    </div>

                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        <Card className="border-gray-200 shadow-sm">
                          <div className="p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">Pipeline tuyển dụng</h4>
                                <p className="text-xs text-gray-500">Theo dõi tiến độ phỏng vấn của ứng viên.</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => onOpenRounds(selectedApplication)}>
                                Mở timeline
                              </Button>
                            </div>
                            <div className="mt-4">
                              <PipelineStepper rounds={roundsMap[selectedApplication.id] ?? null} loading={appsLoading} />
                            </div>
                          </div>
                        </Card>

                        <Card className="border-gray-200 shadow-sm">
                          <div className="p-5 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900">Hành động hồ sơ & AI</h4>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (selectedApplication.resume?.file_url) onPreviewResume(selectedApplication.resume.file_url);
                                  else if (selectedApplication.cv_document) onPreviewBuilder(selectedApplication);
                                }}
                                disabled={!selectedApplication.resume?.file_url && !selectedApplication.cv_document}
                              >
                                Xem CV
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEvaluate(selectedApplication)}
                                disabled={!selectedApplication.resume_id}
                              >
                                Đánh giá CV
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSummarize(selectedApplication)}
                                disabled={!selectedApplication.resume_id}
                              >
                                Tóm tắt
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onGenerateQuestions(selectedApplication)}
                                disabled={!selectedApplication.resume_id}
                              >
                                Câu hỏi
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Mail className="w-3.5 h-3.5" />}
                                onClick={() => onGenerateEmail(selectedApplication)}
                                disabled={!selectedApplication.resume_id}
                              >
                                Email
                              </Button>
                            </div>
                          </div>
                        </Card>

                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          <EmployerCandidateRadarChart
                            skillAnalysis={parsedSkillAnalysis}
                            jobRequirements={jobs.find((j) => j.id === selectedJobId)?.requirements ?? null}
                            jobTitle={selectedJobTitle}
                          />
                        </div>

                        {canManagePipeline && (
                          <Card className="border-gray-200 shadow-sm">
                            <div className="p-5 space-y-3">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">Quyết định của Nhân sự (HR)</h4>
                                <p className="text-xs text-gray-500">Chuyển trạng thái tuyển dụng và ghi nhận lý do quyết định.</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(["reviewed", "shortlisted", "interview"] as ApplicationStatus[]).map((status) => (
                                  <Button
                                    key={status}
                                    size="sm"
                                    variant={selectedApplication.status === status ? "primary" : "outline"}
                                    disabled={actionLoading}
                                    onClick={() => void runAction(() => onStatusChange(selectedApplication.id, status), `Đã chuyển trạng thái sang "${STATUS_LABELS[status]}"`)}
                                  >
                                    {STATUS_LABELS[status]}
                                  </Button>
                                ))}
                              </div>
                              <textarea
                                value={decisionReason}
                                onChange={(event) => setDecisionReason(event.target.value)}
                                placeholder="Lý do quyết định hoặc căn cứ tuyển dụng..."
                                aria-label="Lý do quyết định tuyển dụng"
                                className="min-h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                                  isLoading={actionLoading}
                                  onClick={() => void runAction(() => onStatusChange(selectedApplication.id, "accepted", decisionReason), "Đã xác nhận trúng tuyển ứng viên!")}
                                >
                                  Xác nhận trúng tuyển
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  leftIcon={<XCircle className="h-4 w-4" />}
                                  disabled={actionLoading}
                                  onClick={() => void runAction(() => onStatusChange(selectedApplication.id, "rejected", decisionReason), "Đã ghi nhận từ chối ứng viên")}
                                >
                                  Từ chối
                                </Button>
                              </div>

                              {selectedApplication.status === "interview" && (
                                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 space-y-2.5 shadow-xs">
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold text-blue-900">Gợi ý tác vụ tuyển dụng</p>
                                      <p className="text-xs text-blue-700 leading-relaxed mt-0.5">
                                        Ứng viên đang ở vòng phỏng vấn. Bạn có muốn lên lịch hoặc gửi email mời ngay?
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/60">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 min-w-[120px] text-xs bg-white hover:bg-blue-50"
                                      onClick={() => onOpenRounds(selectedApplication)}
                                      leftIcon={<Calendar className="w-3.5 h-3.5" />}
                                    >
                                      Lên lịch PV
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      className="flex-1 min-w-[120px] text-xs shadow-xs"
                                      onClick={() => onGenerateEmail(selectedApplication)}
                                      leftIcon={<Mail className="w-3.5 h-3.5" />}
                                    >
                                      Soạn thư mời
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {selectedApplication.status === "accepted" && (
                                <div className="mt-3 rounded-xl border border-green-200 bg-green-50/90 p-3.5 space-y-2.5 shadow-xs">
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                      <Sparkles className="w-3.5 h-3.5 text-green-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold text-green-900">Ứng viên đã Trúng tuyển 🎉</p>
                                      <p className="text-xs text-green-700 leading-relaxed mt-0.5">
                                        Chúc mừng! Hãy soạn thư mời nhận việc (Offer Letter) chính thức cho ứng viên.
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    className="w-full text-xs shadow-xs"
                                    onClick={() => onGenerateEmail(selectedApplication)}
                                    leftIcon={<Mail className="w-3.5 h-3.5" />}
                                  >
                                    Soạn Offer Letter
                                  </Button>
                                </div>
                              )}

                              {selectedApplication.status === "rejected" && (
                                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/90 p-3.5 space-y-2.5 shadow-xs">
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                                      <Mail className="w-3.5 h-3.5 text-gray-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold text-gray-900">Thông báo từ chối lịch sự</p>
                                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                                        Gửi email phản hồi khéo léo để duy trì hình ảnh thương hiệu nhà tuyển dụng.
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs bg-white hover:bg-gray-100"
                                    onClick={() => onGenerateEmail(selectedApplication)}
                                    leftIcon={<Mail className="w-3.5 h-3.5" />}
                                  >
                                    Soạn thư từ chối
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Internal Notes & Team Recommendations */}
                    {activeTab === "internal_notes" && (
                      <div className="space-y-4">
                        <Card className="border-gray-200 shadow-sm">
                          <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">Ghi chú & Đánh giá nội bộ</h4>
                                <p className="text-xs text-gray-500">Nhận xét chỉ lưu hành nội bộ hội đồng tuyển dụng, ứng viên không thấy.</p>
                              </div>
                              {selectedApplication.hiring_recommendation && (
                                <Badge
                                  variant={
                                    selectedApplication.hiring_recommendation === "recommended"
                                      ? "success"
                                      : selectedApplication.hiring_recommendation === "not_recommended"
                                        ? "danger"
                                        : "warning"
                                  }
                                >
                                  {selectedApplication.hiring_recommendation === "recommended"
                                    ? "Đề xuất tuyển"
                                    : selectedApplication.hiring_recommendation === "not_recommended"
                                      ? "Không đề xuất"
                                      : "Cần đánh giá thêm"}
                                </Badge>
                              )}
                            </div>

                            <textarea
                              value={internalNoteDraft}
                              onChange={(e) => setInternalNoteDraft(e.target.value)}
                              placeholder="Nhập ghi chú đánh giá chuyên môn, ưu nhược điểm của ứng viên..."
                              rows={4}
                              className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />

                            {canRecommend && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-600">Đánh giá khuyến nghị của Trưởng bộ phận:</p>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<ThumbsUp className="h-4 w-4 text-green-600" />}
                                    isLoading={actionLoading}
                                    onClick={() =>
                                      void runAction(
                                        () => onRecommendationChange(selectedApplication.id, "recommended", internalNoteDraft),
                                        "Đã lưu nhận xét và đề xuất tuyển!",
                                      )
                                    }
                                  >
                                    Đề xuất tuyển
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<HelpCircle className="h-4 w-4 text-amber-600" />}
                                    disabled={actionLoading}
                                    onClick={() =>
                                      void runAction(
                                        () => onRecommendationChange(selectedApplication.id, "needs_more_review", internalNoteDraft),
                                        "Đã lưu nhận xét: Cần đánh giá thêm",
                                      )
                                    }
                                  >
                                    Cần đánh giá thêm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<ThumbsDown className="h-4 w-4 text-red-600" />}
                                    disabled={actionLoading}
                                    onClick={() =>
                                      void runAction(
                                        () => onRecommendationChange(selectedApplication.id, "not_recommended", internalNoteDraft),
                                        "Đã lưu nhận xét: Không đề xuất",
                                      )
                                    }
                                  >
                                    Không đề xuất
                                  </Button>
                                </div>
                              </div>
                            )}

                            {!canRecommend && (
                              <Button
                                size="sm"
                                variant="primary"
                                isLoading={actionLoading}
                                onClick={() =>
                                  void runAction(
                                    () =>
                                      onRecommendationChange(
                                        selectedApplication.id,
                                        selectedApplication.hiring_recommendation ?? "needs_more_review",
                                        internalNoteDraft,
                                      ),
                                    "Đã cập nhật nhận xét nội bộ!",
                                  )
                                }
                              >
                                Lưu nhận xét
                              </Button>
                            )}

                            {selectedApplication.recommendation_note && (
                              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Ghi chú đã lưu:
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedApplication.recommendation_note}</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    )}

                    {/* Tab 3: Status Transition History & Audit Trail */}
                    {activeTab === "timeline" && (
                      <div className="space-y-4">
                        <Card className="border-gray-200 shadow-sm">
                          <div className="p-5 space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Lịch sử chuyển trạng thái</h4>
                              <p className="text-xs text-gray-500">Toàn bộ diễn biến xử lý và mốc thời gian của hồ sơ.</p>
                            </div>

                            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                              {/* Step 1: Submission */}
                              <div className="relative">
                                <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white bg-primary shadow-xs" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-900">Ứng tuyển vào vị trí</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(selectedApplication.applied_at).toLocaleString("vi-VN")}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-600">
                                    Ứng viên nộp hồ sơ ban đầu qua hệ thống.
                                  </p>
                                </div>
                              </div>

                              {/* Step 2: Recommendation if any */}
                              {selectedApplication.hiring_recommendation && (
                                <div className="relative">
                                  <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white bg-amber-500 shadow-xs" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-semibold text-gray-900">Đánh giá của Trưởng bộ phận</p>
                                      <Badge size="sm" variant={selectedApplication.hiring_recommendation === "recommended" ? "success" : "warning"}>
                                        {selectedApplication.hiring_recommendation === "recommended" ? "Đề xuất" : "Đánh giá thêm"}
                                      </Badge>
                                    </div>
                                    {selectedApplication.recommendation_note && (
                                      <p className="mt-1 text-xs text-gray-600 italic bg-gray-50 p-2 rounded-md">
                                        "{selectedApplication.recommendation_note}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Step 3: Current Status */}
                              <div className="relative">
                                <div className={cn(
                                  "absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white shadow-xs",
                                  selectedApplication.status === "accepted"
                                    ? "bg-green-600"
                                    : selectedApplication.status === "rejected"
                                      ? "bg-red-600"
                                      : "bg-blue-600"
                                )} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-900">Trạng thái hiện tại</p>
                                    <Badge size="sm" variant={selectedApplication.status === "accepted" ? "success" : selectedApplication.status === "rejected" ? "danger" : "primary"}>
                                      {STATUS_LABELS[selectedApplication.status] ?? selectedApplication.status}
                                    </Badge>
                                  </div>
                                  {selectedApplication.decision_reason && (
                                    <p className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                                      <span className="font-semibold text-gray-700">Lý do quyết định: </span>
                                      {selectedApplication.decision_reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}

                    {/* Action Alerts */}
                    {actionSuccess && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                        {actionSuccess}
                      </div>
                    )}
                    {actionError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                        {actionError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

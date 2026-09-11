import { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getMyApplications, withdrawApplication } from "@/lib/api/applications";
import { getRounds, getCalendarLinks, downloadIcsFile, type RoundItem } from "@/lib/api/rounds";
import { uploadResume, getMyResumes, deleteResume, evaluateResume } from "@/lib/api/resumes";
import { getCvDocuments, deleteCvDocument } from "@/lib/api/cvDocuments";
import { uploadAvatar } from "@/lib/api/users";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage, apiClient } from "@/lib/axios";
import { Button, Card, CardHeader, CardContent, Spinner, ApplicationStatusBadge, EmptyState, ErrorState, PipelineStepper, ConfirmDialog } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/axios";
import type { Application } from "@/types/application";
import type { Resume } from "@/types/resume";
import type { CvDocument } from "@/types/cvDocument";
import {
  Briefcase,
  FileText,
  UploadCloud,
  ArrowRight,
  Target,
  CheckCircle,
  Clock,
  Camera,
  FileCheck,
  Calendar,
  CalendarPlus,
  Download,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Bot,
  Video,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  Plus,
  AlertTriangle,
  MessageSquare,
  Eye,
  Trash2,
} from "lucide-react";
import { CVCard } from "./components/CVCard";
import { CVPreviewModal } from "./components/CVPreviewModal";
import { AICVReviewModal, type CVEvaluationResponse } from "./components/AICVReviewModal";
import { RadarChartWidget } from "./components/RadarChartWidget";
import { RecommendedJobs } from "./components/RecommendedJobs";
import { ProfileStrengthWidget } from "./components/ProfileStrengthWidget";
import { AIQuickTipsWidget } from "./components/AIQuickTipsWidget";
import { ApplicationDetailDrawer } from "./components/ApplicationDetailDrawer";
import { DirectChatModal } from "@/components/chat/DirectChatModal";

// ─── Constants ──────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["application/pdf"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadState = "idle" | "uploading" | "success" | "error";
type FilterTab = "all" | "pending" | "reviewed" | "shortlisted" | "interview" | "accepted" | "rejected";
type CvStudioTab = "builder" | "pdf";

export const CandidateDashboard = () => {
  const user = useUser();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appRoundsMap, setAppRoundsMap] = useState<Record<number, RoundItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>("all");
  const [cvActiveTab, setCvActiveTab] = useState<CvStudioTab>("builder");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ── Resume & CV Document state ───────────────────────────────────────────
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [cvDocuments, setCvDocuments] = useState<CvDocument[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [evaluatingResumeId, setEvaluatingResumeId] = useState<number | null>(null);
  const [reviewModalData, setReviewModalData] = useState<CVEvaluationResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewResumeId, setPreviewResumeId] = useState<number | null>(null);
  const [previewResumeTitle, setPreviewResumeTitle] = useState<string>("");
  const [chatTargetApp, setChatTargetApp] = useState<Application | null>(null);
  const [selectedDetailApp, setSelectedDetailApp] = useState<Application | null>(null);
  const [activeInterviewIndex, setActiveInterviewIndex] = useState(0);
  const [appPage, setAppPage] = useState(1);
  const APPS_PER_PAGE = 5;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleWithdrawApplication = async (appId: number) => {
    try {
      await withdrawApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      alert("Không thể rút đơn ứng tuyển: " + getApiErrorMessage(err));
    }
  };

  const getInterviewCountdown = (scheduledAt: string) => {
    const diffMs = new Date(scheduledAt).getTime() - Date.now();
    if (diffMs <= 0) return { label: "Đang diễn ra", isUrgent: true };
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const remainHours = diffHours % 24;
      return { label: `Còn ${diffDays} ngày ${remainHours}h`, isUrgent: false };
    }
    if (diffHours > 0) {
      const remainMins = diffMins % 60;
      return { label: `Bắt đầu sau ${diffHours}h ${remainMins}p`, isUrgent: true };
    }
    return { label: `Bắt đầu sau ${diffMins} phút`, isUrgent: true };
  };

  // ── Interview banner ──────────────────────────────────────────────────────
  const [interviews, setInterviews] = useState<Array<{
    round_id: number;
    scheduled_at: string;
    location: string | null;
    round_name: string;
    job_title: string;
    company_name: string;
    status: string;
  }>>([]);
  const [calendarActionLoading, setCalendarActionLoading] = useState(false);

  const handleGoogleCalendar = async (roundId: number) => {
    try {
      setCalendarActionLoading(true);
      const links = await getCalendarLinks(roundId);
      if (links.google_calendar_url) {
        window.open(links.google_calendar_url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // ignore
    } finally {
      setCalendarActionLoading(false);
    }
  };

  const handleDownloadIcs = async (roundId: number) => {
    try {
      setCalendarActionLoading(true);
      await downloadIcsFile(roundId);
    } catch {
      // ignore
    } finally {
      setCalendarActionLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    apiClient
      .get("/applications/me/interviews")
      .then(({ data }) => setInterviews(data))
      .catch(() => {});
  }, [user]);

  // ── Fetch applications ────────────────────────────────────────────────────
  const fetchApplications = useCallback(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => setIsLoading(false));
      return;
    }
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getMyApplications()
      .then((data) => {
        setApplications(data);
        data.forEach((app) => {
          getRounds(app.id)
            .then((rounds) => {
              if (rounds && rounds.length > 0) {
                setAppRoundsMap((prev) => ({ ...prev, [app.id]: rounds }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => {
        setError("Không thể tải danh sách ứng tuyển. Vui lòng thử lại.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ── Fetch resumes ────────────────────────────────────────────────────────
  const fetchResumes = useCallback(() => {
    if (!user) return;
    let isCancelled = false;
    setResumesLoading(true);
    getMyResumes()
      .then((data) => {
        if (!isCancelled) setResumes(data);
      })
      .catch(() => {
        if (!isCancelled) setUploadError("Không thể tải danh sách CV.");
      })
      .finally(() => {
        if (!isCancelled) setResumesLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const cancel = fetchResumes();
    return cancel;
  }, [fetchResumes]);

  useEffect(() => {
    if (!user) return;
    let isCancelled = false;
    getCvDocuments()
      .then((docs) => {
        if (!isCancelled) setCvDocuments(docs);
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [user]);


  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUploadFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadState("error");
      setUploadError("Định dạng file không hợp lệ. Chỉ chấp nhận file PDF.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setUploadState("error");
      setUploadError(`File quá lớn. Dung lượng tối đa là ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploadState("uploading");
    setUploadError(null);

    try {
      await uploadResume(file);
      setUploadState("success");
      fetchResumes();
      setCvActiveTab("pdf");
      setTimeout(() => setUploadState("idle"), 2500);
    } catch (err) {
      setUploadState("error");
      setUploadError(getApiErrorMessage(err));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUploadFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleDeleteResume = async (resumeId: number) => {
    try {
      await deleteResume(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      setUploadState("idle");
    } catch (err) {
      alert(getApiErrorMessage(err) || "Không thể xoá CV. Vui lòng thử lại.");
    }
  };

  const [deleteCvDocTarget, setDeleteCvDocTarget] = useState<{ id: number; title: string } | null>(null);

  const confirmDeleteCvDocument = async () => {
    if (!deleteCvDocTarget) return;
    try {
      await deleteCvDocument(deleteCvDocTarget.id);
      setCvDocuments((prev) => prev.filter((d) => d.id !== deleteCvDocTarget.id));
      setDeleteCvDocTarget(null);
    } catch (err) {
      alert("Không thể xóa bản CV: " + getApiErrorMessage(err));
    }
  };

  const handlePreview = (resumeId: number) => {
    const resume = resumes.find((r) => r.id === resumeId);
    setPreviewResumeId(resumeId);
    setPreviewResumeTitle(resume?.title ?? "");
    setPreviewUrl(`/resumes/${resumeId}/content`);
  };

  const handleEvaluateResume = async (resumeId: number) => {
    try {
      setEvaluatingResumeId(resumeId);
      const updatedResume = await evaluateResume(resumeId);
      setResumes((prev) => prev.map((r) => (r.id === resumeId ? updatedResume : r)));

      if (updatedResume.ai_evaluation_json) {
        setReviewModalData(JSON.parse(updatedResume.ai_evaluation_json));
      }
    } catch (err) {
      alert("Lỗi khi phân tích CV: " + getApiErrorMessage(err));
    } finally {
      setEvaluatingResumeId(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh hợp lệ (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh quá lớn. Kích thước tối đa là 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      await fetchMe();
    } catch (err) {
      alert("Cập nhật ảnh đại diện thất bại: " + getApiErrorMessage(err));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] font-sans flex items-center justify-center p-4">
        <Card className="p-8 sm:p-10 text-center border-slate-200 shadow-sm max-w-md w-full rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#00B86B] flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Bàn Làm Việc Ứng Viên</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Đăng nhập để theo dõi trạng thái các đơn ứng tuyển, quản lý hồ sơ CV và nhận gợi ý việc làm AI.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/login" className="w-full">
              <Button className="w-full bg-[#00B86B] hover:bg-[#00995C] text-white font-bold rounded-full py-3 shadow-md shadow-emerald-600/20">
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ── Derived stats ──────────────────────────────────────────────────────
  const totalCVs = resumes.length + cvDocuments.length;
  const totalApplications = applications.length;
  const validScores = applications.filter((a) => a.ai_matching_score && a.ai_matching_score > 0);
  const avgAIScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, a) => acc + (a.ai_matching_score || 0), 0) / validScores.length)
      : totalCVs > 0 ? 88 : 0;

  // Filtered Applications by Tab & Pagination
  const filteredApplications = applications.filter((app) => {
    if (activeFilterTab === "all") return true;
    return app.status === activeFilterTab;
  });

  const totalAppPages = Math.ceil(filteredApplications.length / APPS_PER_PAGE) || 1;
  const paginatedApplications = filteredApplications.slice(
    (appPage - 1) * APPS_PER_PAGE,
    appPage * APPS_PER_PAGE
  );

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const reviewedCount = applications.filter((a) => a.status === "reviewed").length;
  const shortlistedCount = applications.filter((a) => a.status === "shortlisted").length;
  const interviewCount = applications.filter((a) => a.status === "interview").length;
  const acceptedCount = applications.filter((a) => a.status === "accepted").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans pb-16 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── 1. HERO COMMAND BAR & KPI ROW ────────────────────────────── */}
        <section className="rounded-[32px] bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* User Profile Overview */}
            <div className="flex items-center gap-5">
              <div className="relative group w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-700 flex items-center justify-center border-4 border-white shadow-md shadow-emerald-500/20 overflow-hidden ring-2 ring-emerald-400/30">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Hover overlay on whole avatar */}
                <label className="absolute inset-0 bg-slate-900/60 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploadingAvatar ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-[10px] font-semibold">Đổi ảnh</span>
                    </>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>

                {/* Permanent Floating Camera Badge at bottom-right */}
                <label
                  title="Tải ảnh đại diện dùng cho Messenger & Hồ sơ"
                  className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-emerald-500 text-emerald-600 shadow-md flex items-center justify-center hover:bg-emerald-50 hover:scale-110 active:scale-95 transition-all cursor-pointer z-10 ring-2 ring-white"
                >
                  {isUploadingAvatar ? (
                    <Spinner size="xs" color="green" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B] animate-pulse" />
                    Ứng viên đang tìm việc
                  </span>
                  <span className="text-xs text-slate-400">ID: #{user.id}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Xin chào, {user.full_name}!
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {user.email} • Trung tâm điều hành nghề nghiệp & ứng tuyển
                </p>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/jobs">
                <Button className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-full px-5 py-2.5 shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5">
                  <Briefcase size={14} />
                  <span>Tìm Việc Làm</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>

              <Link to="/cv">
                <Button variant="outline" className="rounded-full text-xs font-bold px-4 py-2.5 bg-white hover:bg-slate-50 border-slate-200 cursor-pointer flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#00B86B]" />
                  <span>Tạo CV Mới</span>
                </Button>
              </Link>

              <Link to="/ai/roadmap">
                <Button variant="outline" className="rounded-full text-xs font-bold px-4 py-2.5 bg-white hover:bg-slate-50 border-slate-200 cursor-pointer flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-600" />
                  <span>Lộ Trình AI</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* 4-Column KPI Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => document.getElementById("cv-studio-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-300 flex items-center gap-3.5 transition-all text-left cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-100 group-hover:bg-purple-200 text-purple-700 flex items-center justify-center font-black shrink-0 transition-colors">
                <FileText size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 group-hover:text-purple-900 leading-none transition-colors">{totalCVs}</span>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider group-hover:text-purple-700">Hồ sơ CV ↓</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => document.getElementById("applications-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 flex items-center gap-3.5 transition-all text-left cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 group-hover:bg-blue-200 text-blue-700 flex items-center justify-center font-black shrink-0 transition-colors">
                <Briefcase size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 group-hover:text-blue-900 leading-none transition-colors">{totalApplications}</span>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider group-hover:text-blue-700">Đơn Ứng Tuyển ↓</p>
              </div>
            </button>

            <Link to="/ai/matching" className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 flex items-center gap-3.5 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 text-[#00B86B] flex items-center justify-center font-black shrink-0 transition-colors">
                <Target size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 leading-none transition-colors">{avgAIScore}%</span>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Điểm AI Khớp TB →</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("interview-alert-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                  setActiveFilterTab("interview");
                  document.getElementById("applications-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 flex items-center gap-3.5 transition-all text-left cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-100 group-hover:bg-amber-200 text-amber-700 flex items-center justify-center font-black shrink-0 transition-colors">
                <Calendar size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 group-hover:text-amber-900 leading-none transition-colors">{interviews.length}</span>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider group-hover:text-amber-700">Lịch Phỏng Vấn {interviews.length > 0 ? "🔔" : ""}</p>
              </div>
            </button>
          </div>
        </section>

        {/* ── 2. UPCOMING INTERVIEW ALERT (IF ANY) ──────────────────── */}
        {interviews.length > 0 && (() => {
          const safeIndex = Math.min(activeInterviewIndex, interviews.length - 1);
          const curr = interviews[safeIndex] || interviews[0];
          const countdown = getInterviewCountdown(curr.scheduled_at);

          return (
            <section id="interview-alert-section" className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-[#1E1B4B] to-slate-950 text-white border border-indigo-500/30 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                    <Video size={22} className="animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                        Lịch hẹn phỏng vấn sắp tới
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
                        <Clock size={11} className="animate-pulse" />
                        <span>{countdown.label}</span>
                      </span>
                      {interviews.length > 1 && (
                        <span className="text-[11px] text-indigo-300/80 font-bold ml-1">
                          (Lịch {safeIndex + 1}/{interviews.length})
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-white">
                      {curr.job_title} tại {curr.company_name}
                    </h3>
                    <p className="text-xs text-indigo-200 flex items-center gap-2">
                      <Clock size={13} /> {new Date(curr.scheduled_at).toLocaleString("vi-VN")} • Vòng: <strong>{curr.round_name}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {interviews.length > 1 && (
                    <div className="flex items-center gap-1 mr-1 bg-white/10 p-1 rounded-xl border border-white/15">
                      <button
                        type="button"
                        onClick={() => setActiveInterviewIndex((prev) => (prev > 0 ? prev - 1 : interviews.length - 1))}
                        className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Lịch hẹn trước"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-[10px] font-bold px-1.5 text-indigo-200">
                        {safeIndex + 1}/{interviews.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveInterviewIndex((prev) => (prev < interviews.length - 1 ? prev + 1 : 0))}
                        className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Lịch hẹn tiếp theo"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={calendarActionLoading}
                    onClick={() => handleGoogleCalendar(curr.round_id)}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full border border-white/20 cursor-pointer"
                    title="Thêm vào Google Calendar"
                  >
                    <CalendarPlus size={14} className="mr-1.5 text-amber-300" />
                    Google Cal
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={calendarActionLoading}
                    onClick={() => handleDownloadIcs(curr.round_id)}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full border border-white/20 cursor-pointer"
                    title="Tải file iCalendar (.ics) cho Outlook / Apple Calendar"
                  >
                    <Download size={14} className="mr-1.5 text-sky-300" />
                    Tải .ICS
                  </Button>

                  <Link to="/ai/roadmap">
                    <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full border border-white/20">
                      <Bot size={14} className="mr-1 text-emerald-400" />
                      Ôn Luyện
                    </Button>
                  </Link>
                  {curr.location && (
                    <a href={curr.location} target="_blank" rel="noreferrer">
                      <Button size="sm" className="bg-[#00B86B] hover:bg-[#00995C] text-white text-xs font-black rounded-full shadow-md shadow-emerald-600/30">
                        Vào Phòng Họp <ArrowUpRight size={14} className="ml-1" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </section>
          );
        })()}

        {/* ── 3. MAIN 2-COLUMN LAYOUT ────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
          
          {/* ── LEFT: APPLICATIONS & CV STUDIO ─────────────────────── */}
          <div className="space-y-8">
            
            {/* APPLICATION KANBAN PIPELINE */}
            <Card id="applications-section" className="rounded-[32px] border-slate-200/90 bg-white shadow-xs overflow-hidden">
              <CardHeader className="p-6 sm:p-7 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">Quy Trình Ứng Tuyển</h2>
                      <p className="text-xs text-slate-500 font-medium">Theo dõi tiến độ hồ sơ thời gian thực ({applications.length} đơn)</p>
                    </div>
                  </div>

                  <Link to="/jobs">
                    <Button variant="outline" size="sm" className="rounded-full text-xs font-bold border-slate-200 bg-white hover:bg-slate-50">
                      Ứng tuyển thêm
                    </Button>
                  </Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  {[
                    { key: "all", label: "Tất cả", count: applications.length },
                    { key: "pending", label: "Đang chờ", count: pendingCount },
                    { key: "reviewed", label: "Đã xem", count: reviewedCount },
                    { key: "shortlisted", label: "Tiềm năng", count: shortlistedCount },
                    { key: "interview", label: "Phỏng vấn", count: interviewCount },
                    { key: "accepted", label: "Trúng tuyển", count: acceptedCount },
                    { key: "rejected", label: "Từ chối", count: rejectedCount },
                  ].map((tab) => {
                    const isActive = activeFilterTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveFilterTab(tab.key as FilterTab);
                          setAppPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center space-y-3">
                    <Spinner size="md" />
                    <p className="text-xs text-slate-500">Đang tải danh sách hồ sơ ứng tuyển...</p>
                  </div>
                ) : error ? (
                  <div className="p-6">
                    <ErrorState
                      title="Không thể tải danh sách ứng tuyển"
                      message={error}
                      onRetry={fetchApplications}
                    />
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={<FileCheck className="w-7 h-7 text-emerald-600" />}
                      title="Không có đơn ứng tuyển nào ở mục này"
                      description="Khám phá các vị trí tuyển dụng phù hợp với hồ sơ kỹ thuật của bạn và gửi đơn ngay."
                      action={
                        <Link to="/jobs">
                          <Button size="sm" className="bg-[#00B86B] hover:bg-[#00995C] text-white font-bold rounded-full px-6 shadow-sm">
                            Tìm việc làm IT ngay
                          </Button>
                        </Link>
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <div className="divide-y divide-slate-100">
                      {paginatedApplications.map((app) => (
                        <div
                          key={app.id}
                          className="p-5 sm:p-6 hover:bg-emerald-50/15 transition-colors flex flex-col gap-3.5 group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 truncate max-w-[150px]">
                                  {app.job?.employer?.company_name || app.job?.employer?.full_name || "Doanh nghiệp đối tác"}
                                </span>
                                <ApplicationStatusBadge status={app.status} size="sm" />
                                {app.ai_matching_score ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs shrink-0">
                                    <Sparkles size={10} className="text-[#00B86B]" />
                                    <span>{app.ai_matching_score}% Khớp AI</span>
                                  </span>
                                ) : null}
                              </div>

                              <Link
                                to={`/jobs/${app.job_id}`}
                                className="font-black text-base text-slate-900 group-hover:text-emerald-700 transition-colors block break-words"
                              >
                                {app.job?.title || `Vị trí tuyển dụng #${app.job_id}`}
                              </Link>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock size={13} className="shrink-0 text-slate-400" />
                                  <span>Nộp ngày: {new Date(app.applied_at).toLocaleDateString("vi-VN")}</span>
                                </span>
                                {appRoundsMap[app.id] && appRoundsMap[app.id].length > 0 && (
                                  <div className="flex items-center gap-2 pl-2.5 border-l border-slate-200">
                                    <span className="text-[11px] font-medium text-slate-600">Tiến trình ({appRoundsMap[app.id].length} vòng):</span>
                                    <PipelineStepper rounds={appRoundsMap[app.id]} />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0 sm:pl-3">
                              <Button
                                size="sm"
                                onClick={() => setSelectedDetailApp(app)}
                                className="rounded-full text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 whitespace-nowrap px-3 h-8 gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                                title="Xem chi tiết tiến trình các vòng phỏng vấn & hồ sơ"
                              >
                                <Eye size={13} className="text-indigo-600" />
                                <span>Tiến trình</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setChatTargetApp(app)}
                                className="rounded-full text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap px-3 h-8 gap-1.5 shrink-0 cursor-pointer"
                                title="Nhắn tin trực tiếp với nhà tuyển dụng"
                              >
                                <MessageSquare size={13} className="text-emerald-600" />
                                <span>Nhắn tin HR</span>
                              </Button>

                              <Link to={`/jobs/${app.job_id}`} className="shrink-0">
                                <Button size="sm" variant="outline" className="rounded-full text-xs font-bold border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 whitespace-nowrap px-3 h-8 cursor-pointer">
                                  <span>Xem JD</span>
                                  <ChevronRight size={13} className="ml-0.5 shrink-0" />
                                </Button>
                              </Link>
                            </div>
                          </div>

                          {/* Hộp thoại lịch hẹn phỏng vấn sắp tới (Thiết kế lại cân đối, sang trọng, đầy đủ không gian) */}
                          {appRoundsMap[app.id] && (() => {
                            const upcoming = appRoundsMap[app.id].find((r) => (r.status === "in_progress" || r.status === "pending") && r.scheduled_at);
                            if (!upcoming) return null;
                            return (
                              <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-blue-50/40 to-slate-50 border border-indigo-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Video size={13} className="animate-pulse" />
                                  </div>
                                  <div className="text-xs text-indigo-950 truncate">
                                    <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider mr-1.5">
                                      Lịch hẹn phỏng vấn:
                                    </span>
                                    <strong className="font-extrabold text-slate-900 mr-1.5">
                                      {upcoming.round_name || "Vòng phỏng vấn"}
                                    </strong>
                                    <span className="text-indigo-800/80 font-medium">
                                      ({new Date(upcoming.scheduled_at!).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })})
                                    </span>
                                    {upcoming.location && !upcoming.location.startsWith("http") && (
                                      <span className="ml-2 text-[11px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                                        📍 {upcoming.location}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                  {upcoming.location && upcoming.location.startsWith("http") && (
                                    <a
                                      href={upcoming.location}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black shadow-xs transition-colors"
                                    >
                                      <span>Vào họp online</span>
                                      <ArrowUpRight size={12} />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDetailApp(app)}
                                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline px-1 cursor-pointer"
                                  >
                                    Chi tiết vòng →
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>

                    {/* Pagination for Applications */}
                    {totalAppPages > 1 && (
                      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
                        <span>
                          Hiển thị <strong>{(appPage - 1) * APPS_PER_PAGE + 1} - {Math.min(appPage * APPS_PER_PAGE, filteredApplications.length)}</strong> trên tổng số <strong>{filteredApplications.length}</strong> đơn
                        </span>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={appPage <= 1}
                            onClick={() => setAppPage((p) => p - 1)}
                            className="h-7 px-2.5 text-xs font-bold rounded-xl border-slate-200 cursor-pointer"
                          >
                            <ChevronLeft size={12} className="mr-0.5" /> Trước
                          </Button>
                          <span className="px-1.5 font-bold text-slate-700">Trang {appPage} / {totalAppPages}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={appPage >= totalAppPages}
                            onClick={() => setAppPage((p) => p + 1)}
                            className="h-7 px-2.5 text-xs font-bold rounded-xl border-slate-200 cursor-pointer"
                          >
                            Sau <ChevronRight size={12} className="ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CV MANAGEMENT & AI AUDIT STUDIO */}
            <Card id="cv-studio-section" className="rounded-[32px] border-slate-200/90 bg-white shadow-xs overflow-hidden">
              <CardHeader className="p-6 sm:p-7 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Trung Tâm Hồ Sơ (CV Studio)</h2>
                    <p className="text-xs text-slate-500 font-medium">Tải lên & phân tích ATS tự động bằng AI</p>
                  </div>
                </div>

                <Link to="/cv">
                  <Button size="sm" className="bg-[#00B86B] hover:bg-[#00995C] text-white rounded-full font-bold text-xs px-4 shadow-sm flex items-center gap-1.5">
                    <Plus size={14} />
                    <span>Tạo CV mới</span>
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="p-6 sm:p-7 space-y-6">
                {/* Upload Dropzone */}
                <div
                  id="cv-upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`rounded-3xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer group space-y-3 ${
                    isDraggingOver
                      ? "border-emerald-500 bg-emerald-100/70 scale-[1.01] ring-4 ring-emerald-400/20 shadow-md"
                      : "border-emerald-300/80 bg-emerald-50/30 hover:bg-emerald-50/70 hover:border-emerald-400 shadow-2xs"
                  }`}
                >
                  {uploadState === "idle" && (
                    <>
                      <div
                        className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto transition-transform duration-300 border ${
                          isDraggingOver
                            ? "scale-125 border-emerald-300 rotate-6 shadow-md"
                            : "group-hover:scale-110 border-emerald-100"
                        }`}
                      >
                        <UploadCloud className={`w-7 h-7 transition-colors ${isDraggingOver ? "text-emerald-700" : "text-[#00B86B]"}`} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          {isDraggingOver ? "Thả file PDF vào đây ngay để tải lên!" : "Kéo thả hoặc nhấn vào đây để tải lên CV mới"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">Định dạng hỗ trợ: PDF (Dung lượng tối đa 5MB)</p>
                      </div>
                    </>
                  )}

                  {uploadState === "uploading" && (
                    <div className="py-3 space-y-2">
                      <Spinner size="md" />
                      <p className="text-xs font-bold text-[#00B86B] animate-pulse">
                        Đang tải lên và trích xuất dữ liệu bằng AI...
                      </p>
                    </div>
                  )}

                  {uploadState === "success" && (
                    <div className="py-3 space-y-2 text-emerald-700">
                      <CheckCircle className="w-10 h-10 mx-auto text-[#00B86B]" />
                      <p className="text-xs font-black">Tải lên CV thành công!</p>
                    </div>
                  )}

                  {uploadState === "error" && (
                    <div className="py-4 px-5 rounded-2xl bg-rose-50 border border-rose-200 text-left space-y-2.5">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Hồ sơ không hợp lệ hoặc sai định dạng CV chuẩn</span>
                      </div>
                      <p className="text-xs text-rose-700 leading-relaxed font-medium">
                        {uploadError}
                      </p>
                      <div className="pt-2 border-t border-rose-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-[11px] text-rose-600 font-medium">
                          💡 Format chuẩn: Họ tên & Liên hệ, Kinh nghiệm/Dự án hoặc Học vấn, và Kỹ năng
                        </span>
                        <Link
                          to="/cv"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00B86B] hover:text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs whitespace-nowrap"
                        >
                          <Sparkles size={13} />
                          <span>Dùng CV Builder tạo CV chuẩn ATS</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Sub-Tabs: CV Trực Tuyến (Builder) vs File CV PDF */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setCvActiveTab("builder")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      cvActiveTab === "builder"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles size={14} className={cvActiveTab === "builder" ? "text-[#00B86B]" : "text-slate-400"} />
                    <span>CV Trực Tuyến (Builder)</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        cvActiveTab === "builder" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {cvDocuments.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCvActiveTab("pdf")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      cvActiveTab === "pdf"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText size={14} className={cvActiveTab === "pdf" ? "text-purple-600" : "text-slate-400"} />
                    <span>File CV Đã Tải Lên (PDF)</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        cvActiveTab === "pdf" ? "bg-purple-100 text-purple-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {resumes.length}
                    </span>
                  </button>
                </div>

                {/* CV Content Section based on selected tab */}
                {resumesLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      {/* Tab 1: CV Builder Documents */}
                      {cvActiveTab === "builder" ? (
                        <motion.div
                          key="tab-builder"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={14} className="text-[#00B86B]" />
                              <span>Danh sách CV Trực Tuyến · {cvDocuments.length}</span>
                            </h4>
                            <Link
                              to="/cv/new"
                              className="text-xs font-bold text-[#00B86B] hover:text-emerald-700 flex items-center gap-1"
                            >
                              <Plus size={13} />
                              <span>Tạo thêm</span>
                            </Link>
                          </div>

                          {cvDocuments.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                              <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                              <div>
                                <p className="text-xs font-bold text-slate-800">Chưa có bản CV trực tuyến nào</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Tạo CV chuẩn ATS với AI hỗ trợ gợi ý nội dung và chuẩn hóa format.
                                </p>
                              </div>
                              <Link to="/cv/new">
                                <Button size="sm" className="bg-[#00B86B] hover:bg-[#00995C] text-white rounded-full font-bold text-xs px-5">
                                  Tạo CV Builder ngay
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {cvDocuments.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-[#00B86B] flex items-center justify-center shrink-0">
                                      <FileText size={18} />
                                    </div>
                                    <div className="min-w-0 space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-black text-slate-900 truncate">
                                          {doc.title || "Hồ Sơ CV Chưa Đặt Tên"}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                          {doc.template_key}
                                        </span>
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            doc.status === "published"
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : "bg-amber-50 text-amber-700 border-amber-200"
                                          }`}
                                        >
                                          {doc.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-400">
                                        Cập nhật: {new Date(doc.updated_at).toLocaleDateString("vi-VN")}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <Link to={`/cv/${doc.id}/preview`}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl text-xs font-bold h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-50"
                                      >
                                        Xem
                                      </Button>
                                    </Link>
                                    <Link to={`/cv/${doc.id}/edit`}>
                                      <Button
                                        size="sm"
                                        className="rounded-xl text-xs font-bold h-8 px-3 bg-[#00B86B] hover:bg-[#00995C] text-white shadow-2xs"
                                      >
                                        Sửa CV
                                      </Button>
                                    </Link>
                                    <Link to={`/ai/matching`}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl text-xs font-bold h-8 px-3 border-emerald-200 text-[#00B86B] bg-emerald-50/50 hover:bg-emerald-100"
                                      >
                                        <Sparkles size={12} className="mr-1" />
                                        So khớp AI
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDeleteCvDocTarget({ id: doc.id, title: doc.title || "Hồ Sơ CV Chưa Đặt Tên" })}
                                      className="rounded-xl text-xs font-bold h-8 px-2.5 border-rose-200 text-rose-600 bg-rose-50/40 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer"
                                      title="Xóa bản CV này"
                                    >
                                      <Trash2 size={13} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        /* Tab 2: Uploaded Resumes (PDF) */
                        <motion.div
                          key="tab-pdf"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <FileText size={14} className="text-purple-600" />
                              <span>Danh sách CV Đã Tải Lên (PDF) · {resumes.length}</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs font-bold text-[#00B86B] hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={13} />
                              <span>Tải thêm PDF</span>
                            </button>
                          </div>

                          {resumes.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                              <UploadCloud className="w-8 h-8 text-purple-400 mx-auto" />
                              <div>
                                <p className="text-xs font-bold text-slate-800">Chưa có file PDF CV nào</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Kéo thả file PDF vào khung bên trên để hệ thống quét và đánh giá ATS tự động.
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-xs px-5"
                              >
                                Tải lên file PDF ngay
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {resumes.map((resume) => (
                                <CVCard
                                  key={resume.id}
                                  resume={resume}
                                  onDelete={handleDeleteResume}
                                  onPreview={() => handlePreview(resume.id)}
                                  onEvaluate={handleEvaluateResume}
                                  isEvaluating={evaluatingResumeId === resume.id}
                                />
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ── RIGHT: SMART WIDGETS & RECOMMENDATIONS ────────────────── */}
          <aside className="space-y-6">
            
            {/* 1. Profile Completeness Widget */}
            <ProfileStrengthWidget
              hasAvatar={Boolean(user.avatar_url)}
              hasCvOnline={cvDocuments.length > 0}
              hasCvPdf={resumes.length > 0}
              hasApplications={applications.length > 0}
              onUploadAvatarClick={() => avatarInputRef.current?.click()}
              onScrollToCvUpload={() => {
                setCvActiveTab("pdf");
                document.getElementById("cv-upload-dropzone")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />

            {/* 2. Technical Radar Chart Widget */}
            <div className="rounded-[32px] overflow-hidden">
              <RadarChartWidget />
            </div>

            {/* 3. AI Recommended Jobs & Fallback */}
            <RecommendedJobs
              resumeId={resumes.length > 0 ? resumes[0].id : null}
              cvDocumentId={cvDocuments.length > 0 ? cvDocuments[0].id : null}
              isValidated={(resumes.length > 0 && resumes[0].is_validated) || cvDocuments.length > 0}
            />

            {/* 4. Quick AI Interview Tips Widget */}
            <AIQuickTipsWidget />
          </aside>
        </div>
      </main>

      {/* CV Preview Modal */}
      {previewUrl && (
        <CVPreviewModal
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
          resumeId={previewResumeId ?? undefined}
          resumeTitle={previewResumeTitle}
        />
      )}

      {/* AI CV Evaluation Review Modal */}
      {reviewModalData && (
        <AICVReviewModal
          evaluation={reviewModalData}
          onClose={() => setReviewModalData(null)}
        />
      )}

      {/* Direct Chat with Employer */}
      <DirectChatModal
        isOpen={chatTargetApp !== null}
        onClose={() => setChatTargetApp(null)}
        applicationId={chatTargetApp?.id}
        title={chatTargetApp?.job?.employer?.company_name || chatTargetApp?.job?.employer?.full_name || "Nhà tuyển dụng"}
        jobTitle={chatTargetApp?.job?.title}
      />

      {/* Application Detail & Interview Pipeline Drawer */}
      <ApplicationDetailDrawer
        isOpen={selectedDetailApp !== null}
        onClose={() => setSelectedDetailApp(null)}
        application={selectedDetailApp}
        rounds={selectedDetailApp ? appRoundsMap[selectedDetailApp.id] || [] : []}
        onWithdraw={handleWithdrawApplication}
        onOpenChat={(app) => setChatTargetApp(app)}
        onPreviewResume={(resumeId) => handlePreview(resumeId)}
      />

      {/* Confirm Delete CV Document Dialog */}
      <ConfirmDialog
        isOpen={!!deleteCvDocTarget}
        title="Xác nhận xóa bản CV"
        description={`Bạn có chắc chắn muốn xóa bản CV "${deleteCvDocTarget?.title}"? Thao tác này sẽ xóa vĩnh viễn dữ liệu CV này và không thể hoàn tác.`}
        confirmLabel="Xóa CV"
        cancelLabel="Hủy"
        variant="destructive"
        onClose={() => setDeleteCvDocTarget(null)}
        onConfirm={confirmDeleteCvDocument}
      />
    </div>
  );
};

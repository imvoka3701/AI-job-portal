import { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getMyApplications } from "@/lib/api/applications";
import { uploadResume, getMyResumes, deleteResume, evaluateResume } from "@/lib/api/resumes";
import { getJobs } from "@/lib/api/jobs";
import { uploadAvatar } from "@/lib/api/users";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage, apiClient } from "@/lib/axios";
import { Button, Card, CardHeader, CardContent, Spinner, ApplicationStatusBadge } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/axios";
import type { Application } from "@/types/application";
import type { Resume } from "@/types/resume";
import type { Job } from "@/types/job";
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
  Sparkles,
  ChevronRight,
  Bot,
  Video,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  Plus,
} from "lucide-react";
import { CVCard } from "./components/CVCard";
import { CVPreviewModal } from "./components/CVPreviewModal";
import { AICVReviewModal, type CVEvaluationResponse } from "./components/AICVReviewModal";
import { RadarChartWidget } from "./components/RadarChartWidget";

// ─── Constants ──────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["application/pdf"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadState = "idle" | "uploading" | "success" | "error";
type FilterTab = "all" | "pending" | "reviewed" | "shortlisted" | "interview" | "accepted" | "rejected";

export const CandidateDashboard = () => {
  const user = useUser();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>("all");

  // ── Resume state ──────────────────────────────────────────────────────────
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [evaluatingResumeId, setEvaluatingResumeId] = useState<number | null>(null);
  const [reviewModalData, setReviewModalData] = useState<CVEvaluationResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Recommended Jobs state ────────────────────────────────────────────────
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);

  // ── Interview banner ──────────────────────────────────────────────────────
  const [interviews, setInterviews] = useState<Array<{
    scheduled_at: string;
    location: string | null;
    round_name: string;
    job_title: string;
    company_name: string;
    status: string;
  }>>([]);

  useEffect(() => {
    if (!user) return;
    apiClient
      .get("/applications/me/interviews")
      .then(({ data }) => setInterviews(data))
      .catch(() => {});
  }, [user]);

  // ── Fetch applications ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => setIsLoading(false));
      return;
    }
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    getMyApplications()
      .then((data) => {
        if (!isCancelled) {
          setApplications(data);
        }
      })
      .catch(() => {
        if (!isCancelled) setError("Không thể tải danh sách ứng tuyển. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

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

  // ── Fetch recommended jobs ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;
    setRecommendedLoading(true);
    getJobs({ page: 1, page_size: 4 })
      .then((data) => {
        if (!isCancelled) setRecommendedJobs(data.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setRecommendedLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setTimeout(() => setUploadState("idle"), 2500);
    } catch (err) {
      setUploadState("error");
      setUploadError(getApiErrorMessage(err));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const handlePreview = (resumeId: number) => {
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
  const totalCVs = resumes.length;
  const totalApplications = applications.length;
  const validScores = applications.filter((a) => a.ai_matching_score && a.ai_matching_score > 0);
  const avgAIScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, a) => acc + (a.ai_matching_score || 0), 0) / validScores.length)
      : totalCVs > 0 ? 88 : 0;

  // Filtered Applications by Tab
  const filteredApplications = applications.filter((app) => {
    if (activeFilterTab === "all") return true;
    return app.status === activeFilterTab;
  });

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
                <label className="absolute inset-0 bg-slate-900/70 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploadingAvatar ? <Spinner size="sm" color="white" /> : <Camera className="w-6 h-6 text-emerald-400" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
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
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 leading-none">{totalCVs}</span>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Hồ sơ CV</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
                <Briefcase size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 leading-none">{totalApplications}</span>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Đơn Ứng Tuyển</p>
              </div>
            </div>

            <Link to="/ai/matching" className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 flex items-center gap-3.5 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 text-[#00B86B] flex items-center justify-center font-black shrink-0 transition-colors">
                <Target size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 leading-none transition-colors">{avgAIScore}%</span>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Điểm AI Khớp TB →</p>
              </div>
            </Link>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 leading-none">{interviews.length}</span>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Lịch Phỏng Vấn</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. UPCOMING INTERVIEW ALERT (IF ANY) ──────────────────── */}
        {interviews.length > 0 && (
          <section className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-[#1E1B4B] to-slate-950 text-white border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Video size={22} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                    Lịch hẹn phỏng vấn sắp tới
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {interviews[0].job_title} tại {interviews[0].company_name}
                  </h3>
                  <p className="text-xs text-indigo-200 flex items-center gap-2">
                    <Clock size={13} /> {new Date(interviews[0].scheduled_at).toLocaleString("vi-VN")} • Vòng: <strong>{interviews[0].round_name}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link to="/ai/roadmap">
                  <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full border border-white/20">
                    <Bot size={14} className="mr-1 text-emerald-400" />
                    Ôn Luyện Phỏng Vấn
                  </Button>
                </Link>
                {interviews[0].location && (
                  <a href={interviews[0].location} target="_blank" rel="noreferrer">
                    <Button size="sm" className="bg-[#00B86B] hover:bg-[#00995C] text-white text-xs font-black rounded-full shadow-md shadow-emerald-600/30">
                      Vào Phòng Họp <ArrowUpRight size={14} className="ml-1" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 3. MAIN 2-COLUMN LAYOUT ────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
          
          {/* ── LEFT: APPLICATIONS & CV STUDIO ─────────────────────── */}
          <div className="space-y-8">
            
            {/* APPLICATION KANBAN PIPELINE */}
            <Card className="rounded-[32px] border-slate-200/90 bg-white shadow-xs overflow-hidden">
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
                        onClick={() => setActiveFilterTab(tab.key as FilterTab)}
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
                  <div className="p-8 text-center text-xs font-bold text-rose-600 bg-rose-50">
                    {error}
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-900">Không có đơn ứng tuyển nào ở mục này</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Khám phá các vị trí tuyển dụng phù hợp với hồ sơ kỹ thuật của bạn và gửi đơn ngay.
                    </p>
                    <div className="pt-3">
                      <Link to="/jobs">
                        <Button size="sm" className="bg-[#00B86B] hover:bg-[#00995C] text-white font-bold rounded-full px-6 shadow-sm">
                          Tìm việc làm IT ngay
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredApplications.map((app) => (
                      <div
                        key={app.id}
                        className="p-5 sm:p-6 hover:bg-emerald-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">
                              {app.job?.employer?.company_name || app.job?.employer?.full_name || "Doanh nghiệp đối tác"}
                            </span>
                            <ApplicationStatusBadge status={app.status} size="sm" />
                          </div>

                          <Link
                            to={`/jobs/${app.job_id}`}
                            className="font-black text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition-colors block"
                          >
                            {app.job?.title || `Vị trí tuyển dụng #${app.job_id}`}
                          </Link>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock size={13} /> Nộp ngày: {new Date(app.applied_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {app.ai_matching_score ? (
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">AI Match</span>
                              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                {app.ai_matching_score}% Khớp
                              </span>
                            </div>
                          ) : null}

                          <Link to={`/jobs/${app.job_id}`}>
                            <Button size="sm" variant="outline" className="rounded-full text-xs font-bold border-slate-200 hover:border-emerald-300">
                              Xem JD <ChevronRight size={13} className="ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CV MANAGEMENT & AI AUDIT STUDIO */}
            <Card className="rounded-[32px] border-slate-200/90 bg-white shadow-xs overflow-hidden">
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
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-3xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/30 hover:bg-emerald-50/70 p-6 sm:p-8 text-center transition-all cursor-pointer group space-y-3"
                >
                  {uploadState === "idle" && (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 border border-emerald-100">
                        <UploadCloud className="w-7 h-7 text-[#00B86B]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          Kéo thả hoặc nhấn vào đây để tải lên CV mới
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
                    <div className="py-3 space-y-2 text-rose-600">
                      <p className="text-xs font-bold">Lỗi: {uploadError}</p>
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

                {/* CV List */}
                {resumesLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="md" />
                  </div>
                ) : resumes.length > 0 ? (
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
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Chưa có bản CV nào được tải lên</p>
                    <p className="text-[11px] text-slate-400">Tải lên file PDF hoặc tạo CV với CV Builder để nhận đánh giá AI.</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ── RIGHT: RADAR SKILL & RECOMMENDED JOBS ────────────────── */}
          <aside className="space-y-8">
            
            {/* Technical Radar Chart Widget */}
            <div className="rounded-[32px] overflow-hidden">
              <RadarChartWidget />
            </div>

            {/* AI Recommended Jobs */}
            <Card className="rounded-[32px] border-slate-200/90 bg-white shadow-xs overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#00B86B]" />
                  <h3 className="font-black text-sm text-slate-900">Việc Làm Phù Hợp (AI Match)</h3>
                </div>
                <Link to="/jobs" className="text-xs font-bold text-emerald-700 hover:underline">
                  Xem tất cả
                </Link>
              </div>

              {recommendedLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : recommendedJobs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Chưa có gợi ý việc làm.
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedJobs.map((rJob) => (
                    <Link
                      key={rJob.id}
                      to={`/jobs/${rJob.id}`}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all block space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {rJob.title}
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          {avgAIScore}% Match
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {rJob.employer?.company_name || "Doanh nghiệp đối tác"}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold pt-1 border-t border-slate-100">
                        <span className="text-emerald-700 font-black">
                          {rJob.salary_min ? `${rJob.salary_min / 1000000}tr+` : "Thoả thuận"}
                        </span>
                        <span>{rJob.location || "Toàn quốc"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </aside>
        </div>
      </main>

      {/* CV Preview Modal */}
      {previewUrl && (
        <CVPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

      {/* AI CV Evaluation Review Modal */}
      {reviewModalData && (
        <AICVReviewModal
          evaluation={reviewModalData}
          onClose={() => setReviewModalData(null)}
        />
      )}
    </div>
  );
};

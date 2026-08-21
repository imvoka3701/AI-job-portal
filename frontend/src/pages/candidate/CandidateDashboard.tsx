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

import { Briefcase, FileText, UploadCloud, ArrowRight, Target, TrendingUp, CheckCircle, Clock, MapPin, Camera, Rocket, FileCheck } from "lucide-react";
import { CVCard } from "./components/CVCard";
import { CVPreviewModal } from "./components/CVPreviewModal";
import { AICVReviewModal, type CVEvaluationResponse } from "./components/AICVReviewModal";
import { RadarChartWidget } from "./components/RadarChartWidget";

// ─── Constants ──────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["application/pdf"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadState = "idle" | "uploading" | "success" | "error";

export const CandidateDashboard = () => {
  const user = useUser();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);

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
    scheduled_at: string; location: string | null; round_name: string;
    job_title: string; company_name: string; status: string;
  }>>([]);

  useEffect(() => {
    if (!user) return;
    apiClient.get("/applications/me/interviews")
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
          setLastDataUpdate(new Date());
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
    getJobs({ page: 1, page_size: 3 })
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
      // Update the resume in the list
      setResumes((prev) => prev.map((r) => (r.id === resumeId ? updatedResume : r)));
      
      // Open the modal with the evaluation data
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
      <div className="min-h-screen bg-page-bg font-sans">
        <div className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900">Bạn chưa đăng nhập</h1>
              <p className="mt-3 text-sm text-gray-600">
                Đăng nhập để xem trạng thái ứng tuyển và quản lý hồ sơ của bạn.
              </p>
              <div className="mt-6 flex justify-center">
                <Link to="/login">
                  <Button>Đăng nhập</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived Stats ─────────────────────────────────────────────────────────
  const totalCVs = resumes.length;
  const totalApplications = applications.length;
  const avgAIScore = applications.length > 0 
    ? applications.reduce((acc, app) => acc + (app.ai_matching_score || 0), 0) / applications.length
    : 0;
  const statusSummary = [
    { label: "Đang chờ", count: applications.filter((app) => app.status === "pending").length, tone: "bg-amber-400" },
    { label: "Đang xử lý", count: applications.filter((app) => ["reviewed", "interview"].includes(app.status)).length, tone: "bg-primary" },
    { label: "Hoàn tất", count: applications.filter((app) => ["accepted", "rejected"].includes(app.status)).length, tone: "bg-success" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-page-bg font-sans">
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* ── Bento Row 1: Profile & Radar ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full overflow-hidden border-gray-200 shadow-sm bg-gradient-to-br from-white via-white to-primary-soft relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
                    <div className="relative group w-24 h-24 shrink-0">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center border-4 border-white shadow-lg overflow-hidden ring-2 ring-primary/20">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-bold text-white">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <label className="absolute inset-0 bg-black/60 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        {isUploadingAvatar ? <Spinner size="sm" color="white" /> : <Camera className="w-6 h-6" />}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-600 mb-1">Dashboard ứng viên</p>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Xin chào, {user.full_name}!
                      </h1>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse"></span>
                        Ứng viên đang hoạt động
                      </p>
                      
                      {/* KPI Stats Cards */}
                      <div className="grid grid-cols-3 gap-4 mt-5">
                        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{totalCVs}</p>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Hồ sơ CV</p>
                        </div>
                        
                        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-sky-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Đơn ứng tuyển</p>
                        </div>
                        
                        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                              <Target className="w-4 h-4 text-success" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{avgAIScore.toFixed(0)}%</p>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Điểm AI TB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <Link to="/jobs" className="w-full">
                      <Button className="group hover:shadow-lg transition-all w-full">
                        Khám phá việc làm 
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <RadarChartWidget skillAnalysis={(() => {
                const latest = resumes.find((resume) => resume.ai_evaluation_json);
                if (!latest?.ai_evaluation_json) return {};
                try { return JSON.parse(latest.ai_evaluation_json).skill_analysis ?? {}; } catch { return {}; }
              })()} />
            </div>
          </div>

          {/* ── Bento Row 2: CV Management & Recommended Jobs ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* CV Management */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-gray-200 shadow-sm h-full">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Quản lý CV</h2>
                      <p className="text-xs text-gray-500">Tải lên & phân tích bằng AI</p>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">5 hồ sơ gần nhất</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-primary-soft p-5 text-center transition-all hover:border-primary group cursor-pointer mb-5" onClick={() => fileInputRef.current?.click()}>
                    {uploadState === "idle" && (
                      <div className="space-y-3">
                        <UploadCloud className="w-8 h-8 text-primary mx-auto group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-medium text-gray-700 group-hover:text-primary">Tải lên CV mới (PDF)</p>
                      </div>
                    )}
                    {uploadState === "uploading" && (
                      <div className="space-y-3">
                        <Spinner size="md" color="blue" />
                        <p className="text-sm font-semibold text-primary">Đang phân tích AI...</p>
                      </div>
                    )}
                    {uploadState === "success" && (
                      <div className="space-y-3">
                        <CheckCircle className="w-8 h-8 text-success mx-auto" />
                        <p className="text-sm font-bold text-success">Thành công!</p>
                      </div>
                    )}
                    {uploadState === "error" && (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-error">Lỗi: {uploadError}</p>
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

                  {resumesLoading ? (
                    <div className="flex justify-center py-4"><Spinner size="sm" /></div>
                  ) : resumes.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
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
                    <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <FileText className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Chưa có CV nào được tải lên</p>
                      <p className="text-[11px] text-gray-400">Tải lên CV để nhận đánh giá AI và gợi ý việc làm</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommended Jobs */}
            <div className="lg:col-span-2">
              <Card className="border-gray-200 shadow-sm h-full">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Việc làm phù hợp nhất (AI Match)</h2>
                        <p className="text-xs text-gray-500">Đề xuất theo kỹ năng của bạn</p>
                      </div>
                    </div>
                    <Link to="/jobs" className="text-sm font-medium text-primary hover:underline">
                      Xem thêm
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {recommendedLoading ? (
                    <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                  ) : recommendedJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Briefcase className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-900">Chưa có gợi ý</p>
                      <p className="text-xs text-gray-500 mb-4">Tải lên CV để nhận gợi ý từ AI</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Tải CV ngay
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendedJobs.slice(0, 4).map((job) => {
                        return (
                          <Link key={job.id} to={`/jobs/${job.id}`} className="block group">
                            <div className="p-4 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all bg-white relative overflow-hidden h-full flex flex-col justify-between">
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                              
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-gray-900 group-hover:text-primary truncate transition-colors text-sm" title={job.title}>
                                    {job.title}
                                  </h3>
                                  <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Gợi ý mới nhất</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                  {job.employer?.company_name || job.employer?.full_name || "Nhà tuyển dụng"}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mt-4 text-[11px] text-gray-500 font-medium">
                                <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 truncate max-w-[100px]">
                                  {job.location || "Từ xa"}
                                </span>
                                <span className="text-success bg-green-50 px-2 py-1 rounded border border-green-100">
                                  {(job.salary_max && job.salary_max >= 1000000) ? `${(job.salary_max / 1000000).toFixed(0)}tr` : "Thỏa thuận"}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Bento Row 3: Applications & Interviews ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Applications */}
            <div className="lg:col-span-2">
              <Card className="border-gray-200 shadow-sm h-full">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Lịch sử ứng tuyển</h2>
                        <p className="text-xs text-gray-500">Tiến độ và trạng thái · {applications.length > 5 ? "5 gần nhất" : `${applications.length} hồ sơ`}</p>
                      </div>
                    </div>
                    {applications.length > 5 && (
                      <span className="text-xs text-gray-400">Xem 5 gần nhất</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <div className="space-y-3 pt-5">
                      <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                      <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <FileCheck className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-900">Chưa có ứng tuyển</p>
                      <p className="text-xs text-gray-500 mt-1 mb-4">Khám phá việc làm và gửi hồ sơ ngay</p>
                      <Link to="/jobs">
                        <Button size="sm" variant="outline" className="mt-2">
                          Tìm việc làm
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left mt-2">
                        <thead className="text-xs text-gray-400 border-b border-gray-100 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 font-medium">Vị trí</th>
                            <th className="px-4 py-3 font-medium">Công ty</th>
                            <th className="px-4 py-3 font-medium">Trạng thái</th>
                            <th className="px-4 py-3 font-medium text-right">Ngày nộp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {applications.slice(0, 5).map((app) => (
                            <tr key={app.id} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-4 py-3">
                                <Link to={`/jobs/${app.job_id}`} className="font-semibold text-gray-900 hover:text-primary transition-colors">
                                  {app.job?.title || `Job #${app.job_id}`}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs">
                                {app.job?.employer?.company_name || app.job?.employer?.full_name}
                              </td>
                              <td className="px-4 py-3">
                                <ApplicationStatusBadge status={app.status} size="sm" />
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs text-right">
                                {new Date(app.applied_at).toLocaleDateString("vi-VN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {applications.length > 5 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                          <p className="text-xs text-gray-500 mb-2">Hiển thị 5 hồ sơ gần nhất · Tổng {applications.length} ứng tuyển</p>
                          <Button size="sm" variant="outline" className="text-primary">
                            Xem tất cả {applications.length} ứng tuyển
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {applications.length > 0 && <div className="mt-5 border-t border-gray-100 pt-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-gray-600">Tổng quan tiến độ</span><span className="text-xs text-gray-400">{applications.length} hồ sơ</span></div><div className="flex h-2 overflow-hidden rounded-full bg-gray-100">{statusSummary.map((item) => <div key={item.label} className={`${item.tone} transition-all`} style={{ width: `${(item.count / applications.length) * 100}%` }} title={`${item.label}: ${item.count}`} />)}</div><div className="mt-2 flex flex-wrap gap-3">{statusSummary.map((item) => <span key={item.label} className="flex items-center gap-1 text-[11px] text-gray-500"><span className={`h-2 w-2 rounded-full ${item.tone}`} />{item.label} {item.count}</span>)}</div></div>}
                </CardContent>
              </Card>
            </div>

            {/* Interviews & Roadmap */}
            <div className="lg:col-span-1 space-y-6">
              {interviews.length > 0 && (() => {
                const iv = interviews[0];
                const sched = new Date(iv.scheduled_at);
                const timeStr = sched.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                  + " - " + sched.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                return (
                  <Card className="border-blue-200 shadow-sm bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Clock className="w-24 h-24 text-primary" />
                    </div>
                    <div className="p-5 relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <h3 className="font-bold text-gray-900">Phỏng vấn sắp tới</h3>
                      </div>
                      <p className="font-semibold text-primary truncate" title={iv.job_title}>{iv.job_title}</p>
                      <p className="text-xs text-gray-600 mt-1">{iv.company_name}</p>
                      <div className="mt-4 bg-white rounded-lg border border-blue-100 p-3 text-sm flex flex-col gap-2 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium">{timeStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{iv.location || "Online"}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })()}

              <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
                      <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Lộ trình AI</h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Đề xuất khóa học & kỹ năng cần trau dồi để đạt công việc mơ ước.
                  </p>
                  <Link to="/ai/roadmap">
                    <Button variant="outline" size="sm" fullWidth className="bg-white hover:bg-gray-50 text-primary border-primary/30">
                      Tạo lộ trình
                      <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Last Updated Timestamp */}
          {lastDataUpdate && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Cập nhật lần cuối: {lastDataUpdate.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} · {lastDataUpdate.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          
        </div>
      </div>

      <CVPreviewModal 
        url={previewUrl} 
        onClose={() => setPreviewUrl(null)} 
      />

      <AICVReviewModal 
        evaluation={reviewModalData}
        onClose={() => setReviewModalData(null)}
      />
    </div>
  );
};

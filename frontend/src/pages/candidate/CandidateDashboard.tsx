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

  // ── Derived variables ──────────────────────────────────────────────────
  const totalCVs = resumes.length;
  const totalApplications = applications.length;
  const validScores = applications.filter((a) => a.ai_matching_score && a.ai_matching_score > 0);
  const avgAIScore =
    validScores.length > 0
      ? (validScores.reduce((acc, a) => acc + (a.ai_matching_score || 0), 0) / validScores.length).toFixed(1)
      : 0;

  const statusSummaryArray = Object.entries(applications.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).map(([status, count]) => {
    let label = status;
    let tone = "bg-gray-400";
    if (status === "pending") { label = "Đang chờ"; tone = "bg-amber-400"; }
    if (status === "reviewed") { label = "Đã xem"; tone = "bg-blue-400"; }
    if (status === "interviewing") { label = "Phỏng vấn"; tone = "bg-purple-400"; }
    if (status === "passed") { label = "Trúng tuyển"; tone = "bg-green-500"; }
    if (status === "rejected") { label = "Từ chối"; tone = "bg-red-400"; }
    return { label, count, tone };
  });

  return (
    <div className="min-h-screen bg-page-bg font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ── Bento Row 1: Profile Header ──────────────────────────────── */}
          <div className="w-full">
            <Card className="overflow-hidden border-gray-200 shadow-sm bg-gradient-to-br from-white via-white to-primary-soft relative group">
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                      Xin chào, {user.full_name}!
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse"></span>
                      Ứng viên đang hoạt động
                    </p>
                    
                    {/* KPI Stats Cards */}
                    <div className="flex flex-wrap gap-4 mt-5">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white shadow-sm flex items-center gap-4 min-w-[140px]">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 leading-none">{totalCVs}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">Hồ sơ CV</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white shadow-sm flex items-center gap-4 min-w-[140px]">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                          <Briefcase className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 leading-none">{totalApplications}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">Đơn ứng tuyển</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white shadow-sm flex items-center gap-4 min-w-[140px]">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <Target className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 leading-none">{typeof avgAIScore === 'string' ? Math.round(Number(avgAIScore)) : avgAIScore}%</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">Điểm AI TB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <Link to="/jobs" className="w-full">
                    <Button className="group hover:shadow-primary transition-all w-full">
                      Khám phá việc làm 
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Main-Sidebar Layout ──────────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* ── MAIN AREA (2/3) ── */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              
              {/* CV Management */}
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Trung tâm Hồ sơ (CV)</h2>
                      <p className="text-xs text-gray-500">Tải lên & phân tích bằng AI</p>
                    </div>
                    <span className="ml-auto text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-md shadow-sm text-gray-600">5 hồ sơ gần nhất</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 p-8 text-center transition-all hover:border-primary group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                    {uploadState === "idle" && (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                          <UploadCloud className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Kéo thả hoặc nhấn để tải lên CV mới</p>
                          <p className="text-xs text-gray-500 mt-1">Hỗ trợ định dạng PDF (Max: 5MB)</p>
                        </div>
                      </div>
                    )}
                    {uploadState === "uploading" && (
                      <div className="space-y-3 py-4">
                        <Spinner size="lg" color="blue" />
                        <p className="text-sm font-semibold text-primary animate-pulse">Đang dùng AI để phân tích hồ sơ...</p>
                      </div>
                    )}
                    {uploadState === "success" && (
                      <div className="space-y-3 py-4">
                        <CheckCircle className="w-12 h-12 text-success mx-auto" />
                        <p className="text-sm font-bold text-success">Tải lên thành công!</p>
                      </div>
                    )}
                    {uploadState === "error" && (
                      <div className="space-y-3 py-4">
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
                    <div className="flex justify-center py-4"><Spinner size="md" /></div>
                  ) : resumes.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <FileText className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500 font-medium mb-1">Chưa có CV nào được tải lên</p>
                      <p className="text-xs text-gray-400">Tải lên CV để nhận đánh giá AI và gợi ý việc làm</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Applications */}
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Lịch sử ứng tuyển</h2>
                        <p className="text-xs text-gray-500">Tiến độ và trạng thái · {applications.length > 5 ? "5 gần nhất" : `${applications.length} hồ sơ`}</p>
                      </div>
                    </div>
                    {applications.length > 5 && (
                      <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-md shadow-sm text-gray-600">Xem 5 gần nhất</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-0">
                  {isLoading ? (
                    <div className="space-y-3 pt-5 px-6">
                      <div className="h-12 skeleton rounded-xl" />
                      <div className="h-12 skeleton rounded-xl" />
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileCheck className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-sm font-medium text-gray-900">Chưa có ứng tuyển</p>
                      <p className="text-xs text-gray-500 mt-1 mb-5">Khám phá việc làm và gửi hồ sơ ngay</p>
                      <Link to="/jobs">
                        <Button size="sm" variant="outline">
                          Tìm việc làm
                          <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-500 bg-gray-50/80 border-b border-gray-100 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-3 font-semibold">Vị trí & Công ty</th>
                            <th className="px-6 py-3 font-semibold">Trạng thái</th>
                            <th className="px-6 py-3 font-semibold text-right">Ngày nộp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {applications.slice(0, 5).map((app) => (
                            <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-6 py-4">
                                <Link to={`/jobs/${app.job_id}`} className="font-semibold text-gray-900 group-hover:text-primary transition-colors block">
                                  {app.job?.title || `Job #${app.job_id}`}
                                </Link>
                                <span className="text-gray-500 text-xs mt-1 block">
                                  {app.job?.employer?.company_name || app.job?.employer?.full_name}
                                </span>
                              </td>
                              <td className="px-6 py-4 align-middle">
                                <ApplicationStatusBadge status={app.status} size="sm" />
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-xs text-right align-middle font-medium">
                                {new Date(app.applied_at).toLocaleDateString("vi-VN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {applications.length > 5 && (
                        <div className="mt-2 p-4 text-center bg-gray-50/50 border-t border-gray-100">
                          <Button size="sm" variant="outline" className="text-primary bg-white hover:bg-primary/5">
                            Xem tất cả {applications.length} ứng tuyển
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {applications.length > 0 && (
                    <div className="mt-2 border-t border-gray-100 p-6 bg-gray-50/30">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tổng quan tiến độ</span>
                      </div>
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-200">
                        {statusSummaryArray.map((item) => (
                          <div key={item.label} className={`${item.tone} transition-all`} style={{ width: `${(item.count / applications.length) * 100}%` }} title={`${item.label}: ${item.count}`} />
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4">
                        {statusSummaryArray.map((item) => (
                          <span key={item.label} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.tone} shadow-sm`} />
                            {item.label} <span className="text-gray-400">({item.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommended Jobs */}
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Việc làm phù hợp nhất (AI Match)</h2>
                        <p className="text-xs text-gray-500">Đề xuất theo kỹ năng của bạn</p>
                      </div>
                    </div>
                    <Link to="/jobs" className="text-sm font-medium text-primary hover:underline">
                      Xem thêm
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {recommendedLoading ? (
                    <div className="flex justify-center py-8"><Spinner size="lg" /></div>
                  ) : recommendedJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
                      <Briefcase className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-900">Chưa có gợi ý</p>
                      <p className="text-xs text-gray-500 mb-4">Tải lên CV để nhận gợi ý từ AI</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-primary font-semibold hover:underline bg-primary/10 px-3 py-1.5 rounded-md"
                      >
                        Tải CV ngay
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recommendedJobs.slice(0, 4).map((job) => {
                        return (
                          <Link key={job.id} to={`/jobs/${job.id}`} className="block group">
                            <div className="p-5 rounded-xl border border-gray-200 hover:border-primary shadow-sm hover:shadow-md transition-all bg-white relative overflow-hidden h-full flex flex-col justify-between">
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                              
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-gray-900 group-hover:text-primary truncate transition-colors text-sm" title={job.title}>
                                    {job.title}
                                  </h3>
                                  <span className="shrink-0 rounded bg-green-50 border border-green-100 px-2 py-0.5 text-[10px] font-bold text-success uppercase tracking-wider">{avgAIScore}% Match</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate font-medium">
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

            {/* ── SIDEBAR (1/3) ── */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-6">
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <RadarChartWidget skillAnalysis={(() => {
                  const latest = resumes.find((resume) => resume.ai_evaluation_json);
                  if (!latest?.ai_evaluation_json) return {};
                  try { return JSON.parse(latest.ai_evaluation_json).skill_analysis ?? {}; } catch { return {}; }
                })()} />
              </div>

              {interviews.length > 0 && (() => {
                const iv = interviews[0];
                const sched = new Date(iv.scheduled_at);
                const timeStr = sched.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                  + " - " + sched.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                return (
                  <Card className="border-blue-200 shadow-sm bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
                      <Clock className="w-32 h-32 text-primary" />
                    </div>
                    <div className="p-6 relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <h3 className="font-bold text-gray-900 tracking-tight text-lg">Phỏng vấn sắp tới</h3>
                      </div>
                      <p className="font-semibold text-primary truncate text-base" title={iv.job_title}>{iv.job_title}</p>
                      <p className="text-sm text-gray-600 mt-1 font-medium">{iv.company_name}</p>
                      <div className="mt-5 bg-white rounded-xl border border-blue-100 p-4 text-sm flex flex-col gap-3 shadow-sm">
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-semibold">{timeStr}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <span className="truncate font-medium">{iv.location || "Online"}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })()}

              <Card className="border-purple-200 shadow-sm bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 tracking-tight text-lg">Lộ trình AI</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                    Đề xuất khóa học & kỹ năng cần trau dồi để đạt công việc mơ ước nhanh nhất.
                  </p>
                  <Link to="/ai/roadmap">
                    <Button variant="outline" size="md" fullWidth className="bg-white hover:bg-primary/5 text-primary border-primary/30 shadow-sm font-semibold">
                      Tạo lộ trình ngay
                      <ArrowRight className="w-4 h-4 ml-2" />
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

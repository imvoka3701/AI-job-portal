import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { applyJob, getJobById, getJobs } from "@/lib/api/jobs";
import { getMyResumes } from "@/lib/api/resumes";
import { getCvDocuments } from "@/lib/api/cvDocuments";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/pages/jobs/components/Header";
import { SEOMeta } from "@/components/seo/SEOMeta";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Coins,
  Building2,
  CheckCircle2,
  Heart,
  Share2,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Send,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { Job } from "@/types/job";
import type { Resume } from "@/types/resume";
import type { CvDocument } from "@/types/cvDocument";

export const JobDetailPage = () => {
  const { id } = useParams();
  const jobId = Number(id);
  const navigate = useNavigate();
  const user = useUser();
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [cvDocuments, setCvDocuments] = useState<CvDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Check saved job state from localStorage
  useEffect(() => {
    if (!jobId) return;
    try {
      const saved = localStorage.getItem(`saved_job_${jobId}`);
      if (saved === "true") setIsSaved(true);
    } catch {
      // localStorage không khả dụng — bỏ qua
    }
  }, [jobId]);

  const toggleSaveJob = () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      localStorage.setItem(`saved_job_${jobId}`, String(nextState));
    } catch {
      // localStorage không khả dụng — bỏ qua
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      // Fallback
    }
  };

  const refreshCandidateDocuments = async () => {
    if (!tokenStorage.get() || user?.role !== "candidate") return;
    try {
      const [resumeItems, builderItems] = await Promise.all([getMyResumes(), getCvDocuments()]);
      setResumes(resumeItems);
      setCvDocuments(builderItems);
      if (!selectedDocument && (resumeItems[0] || builderItems[0])) {
        setSelectedDocument(resumeItems[0] ? `resume:${resumeItems[0].id}` : `builder:${builderItems[0].id}`);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId || Number.isNaN(jobId)) {
        setError("ID công việc không hợp lệ.");
        setIsLoading(false);
        return;
      }
      setError(null);
      setIsLoading(true);
      try {
        const data = await getJobById(jobId);
        setJob(data);

        // Fetch similar jobs
        getJobs({ page_size: 4 })
          .then((res) => {
            const others = (res.items || []).filter((j) => j.id !== jobId).slice(0, 3);
            setSimilarJobs(others);
          })
          .catch(() => {});
      } catch {
        setError("Không thể tải chi tiết công việc. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (!tokenStorage.get() || user?.role === "employer" || user?.role === "admin") return;
    let cancelled = false;
    let attempts = 0;
    const loadDocuments = async () => {
      try {
        const [resumeItems, builderItems] = await Promise.all([getMyResumes(), getCvDocuments()]);
        if (cancelled) return;
        setResumes(resumeItems);
        setCvDocuments(builderItems);
        if (resumeItems[0]) setSelectedDocument(`resume:${resumeItems[0].id}`);
        else if (builderItems[0]) setSelectedDocument(`builder:${builderItems[0].id}`);
        if (builderItems.length === 0 && resumeItems.length === 0 && attempts < 3) {
          attempts += 1;
          window.setTimeout(loadDocuments, 500);
        }
      } catch {
        if (!cancelled && attempts < 3) {
          attempts += 1;
          window.setTimeout(loadDocuments, 500);
        }
      }
    };
    loadDocuments();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const handleApply = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "candidate") {
      setApplyMessage({ type: "error", text: "Chỉ tài khoản ứng viên mới có thể ứng tuyển." });
      return;
    }
    if (!job) return;

    setApplyMessage(null);
    setIsApplying(true);
    try {
      let resumeId: number | undefined;
      let cvDocumentId: number | undefined;
      const [documentType, documentId] = selectedDocument.split(":");
      if (documentType === "resume") resumeId = Number(documentId);
      if (documentType === "builder") cvDocumentId = Number(documentId);

      await applyJob({ job_id: job.id, resume_id: resumeId, cv_document_id: cvDocumentId });
      setApplyMessage({
        type: "success",
        text:
          resumeId || cvDocumentId
            ? "Ứng tuyển thành công! Hồ sơ CV của bạn đã được chuyển tới nhà tuyển dụng."
            : "Ứng tuyển thành công! Bạn nên đính kèm CV để tăng điểm phù hợp khi AI đánh giá.",
      });
    } catch {
      setApplyMessage({ type: "error", text: "Ứng tuyển thất bại. Vui lòng thử lại sau hoặc kiểm tra kết nối." });
    } finally {
      setIsApplying(false);
    }
  };

  const scrollToApply = () => {
    const applyBox = document.getElementById("apply-box");
    if (applyBox) {
      applyBox.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page-bg font-sans">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
          <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-64 bg-white rounded-2xl border border-gray-200 p-8 space-y-4 animate-pulse">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-8 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-10 w-full bg-gray-100 rounded-xl mt-6" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-96 bg-white rounded-2xl border border-gray-200 animate-pulse" />
            <div className="h-96 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-page-bg font-sans">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <Card className="p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Không tìm thấy tin tuyển dụng</h1>
            <p className="text-sm text-gray-600 mt-2">{error ?? "Vị trí tuyển dụng không tồn tại hoặc đã tạm dừng nhận hồ sơ."}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/jobs">
                <Button variant="primary">Khám phá việc làm khác</Button>
              </Link>
              <Button onClick={() => navigate(-1)} variant="outline">
                Quay lại
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const companyName = job.employer?.company_name || job.employer?.full_name || "Doanh nghiệp đối tác";
  const formattedSalary =
    job.salary_min && job.salary_max
      ? `${(job.salary_min / 1000000).toLocaleString()} - ${(job.salary_max / 1000000).toLocaleString()} triệu VNĐ`
      : job.salary_min
      ? `Từ ${(job.salary_min / 1000000).toLocaleString()} triệu VNĐ`
      : job.salary_max
      ? `Lên tới ${(job.salary_max / 1000000).toLocaleString()} triệu VNĐ`
      : "Thoả thuận";

  return (
    <div className="min-h-screen bg-page-bg font-sans text-gray-900">
      <SEOMeta
        title={`${job.title} tại ${companyName} | AI Job Portal`}
        description={job.description?.substring(0, 160) || `Tuyển dụng ${job.title} tại ${companyName}`}
        canonicalUrl={`https://ai-job-portal.com/jobs/${job.id}`}
      />
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link to="/jobs" className="hover:text-primary transition-colors">Việc làm</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 truncate max-w-xs">{job.title}</span>
        </nav>

        {/* HERO HEADER CARD */}
        <Card className="p-6 sm:p-8 border-gray-200 shadow-sm bg-white overflow-hidden relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Company Logo & Job Header Info */}
            <div className="flex items-start gap-4 sm:gap-5 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-md shadow-emerald-500/10 border border-emerald-400/20">
                {companyName.slice(0, 2).toUpperCase()}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" />
                    {companyName}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Nhà tuyển dụng xác thực
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {job.title}
                </h1>

                {/* Primary Highlights Badge Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-bold border border-emerald-200">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    {formattedSalary}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    {job.location || "Toàn quốc"}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                    {job.job_type === "full_time"
                      ? "Toàn thời gian"
                      : job.job_type === "remote"
                      ? "Làm từ xa (Remote)"
                      : job.job_type === "part_time"
                      ? "Bán thời gian"
                      : job.job_type}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
                    {job.experience_level === "senior"
                      ? "Senior (Trên 3 năm)"
                      : job.experience_level === "middle"
                      ? "Middle (1-3 năm)"
                      : job.experience_level === "junior"
                      ? "Junior"
                      : "Fresher / Thực tập sinh"}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & AI Match Widget */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSaveJob}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold ${
                    isSaved
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  title={isSaved ? "Bỏ lưu việc làm" : "Lưu việc làm này"}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                  <span className="hidden sm:inline">{isSaved ? "Đã lưu" : "Lưu tin"}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold"
                  title="Chia sẻ tin tuyển dụng"
                >
                  <Share2 className="w-4 h-4 text-gray-500" />
                  <span className="hidden sm:inline">{copyFeedback ? "Đã sao chép link!" : "Chia sẻ"}</span>
                </button>

                <Button
                  onClick={scrollToApply}
                  variant="primary"
                  className="bg-[#00B86B] hover:bg-[#00995C] text-white px-6 font-bold shadow-sm"
                >
                  Ứng tuyển ngay
                </Button>
              </div>

              {/* AI Matching Score Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-800">
                <Sparkles className="w-4 h-4 text-[#00B86B] animate-pulse" />
                <span>✦ Điểm AI Matching: <strong className="text-[#00B86B]">Rất phù hợp</strong></span>
              </div>
            </div>
          </div>
        </Card>

        {/* MAIN 2-COLUMN CONTENT */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          {/* LEFT: JOB DETAILS */}
          <div className="space-y-6">
            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4 bg-white border-gray-200 text-center">
                <Coins className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-[11px] text-gray-500 font-medium uppercase">Mức thu nhập</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{formattedSalary}</p>
              </Card>
              <Card className="p-4 bg-white border-gray-200 text-center">
                <GraduationCap className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <p className="text-[11px] text-gray-500 font-medium uppercase">Kinh nghiệm</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{job.experience_level}</p>
              </Card>
              <Card className="p-4 bg-white border-gray-200 text-center">
                <Briefcase className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
                <p className="text-[11px] text-gray-500 font-medium uppercase">Hình thức</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{job.job_type}</p>
              </Card>
              <Card className="p-4 bg-white border-gray-200 text-center">
                <Clock className="w-5 h-5 text-sky-600 mx-auto mb-1.5" />
                <p className="text-[11px] text-gray-500 font-medium uppercase">Hạn nộp hồ sơ</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">Còn 30 ngày</p>
              </Card>
            </div>

            {/* Detailed Description Section */}
            <Card className="p-6 sm:p-8 space-y-6 bg-white border-gray-200">
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-gray-900">Mô tả công việc</h2>
                </div>
                <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line space-y-2">
                  {job.description}
                </div>
              </section>

              {job.requirements && (
                <section className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold text-gray-900">Yêu cầu ứng viên</h2>
                  </div>
                  <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line space-y-2">
                    {job.requirements}
                  </div>
                </section>
              )}

              {job.benefits && (
                <section className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-bold text-gray-900">Quyền lợi được hưởng</h2>
                  </div>
                  <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line space-y-2">
                    {job.benefits}
                  </div>
                </section>
              )}
            </Card>

            {/* Similar Jobs Section */}
            {similarJobs.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Việc làm tương tự cùng lĩnh vực</h3>
                  <Link to="/jobs" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Xem tất cả <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {similarJobs.map((sim) => (
                    <Link
                      key={sim.id}
                      to={`/jobs/${sim.id}`}
                      className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#00B86B] hover:shadow-sm transition-all group block"
                    >
                      <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#00B86B] transition-colors truncate">
                        {sim.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {sim.employer?.company_name || "Doanh nghiệp đối tác"}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                        <span className="text-emerald-700 font-semibold">{sim.salary_min ? `${sim.salary_min / 1000000}tr+` : "Thoả thuận"}</span>
                        <span>{sim.location || "Toàn quốc"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: STICKY APPLICATION SIDEBAR */}
          <aside className="space-y-6 sticky top-24">
            {/* Quick Apply Box */}
            <Card id="apply-box" className="p-6 border-gray-200 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#00B86B]" />
                  Ứng tuyển công việc
                </h3>
                <Badge variant={job.is_active ? "success" : "default"} size="sm">
                  {job.is_active ? "Đang nhận hồ sơ" : "Đã đóng"}
                </Badge>
              </div>

              {user?.role === "candidate" ? (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">
                    Chọn hồ sơ CV ứng tuyển:
                    <select
                      value={selectedDocument}
                      onChange={(e) => setSelectedDocument(e.target.value)}
                      onFocus={() => { void refreshCandidateDocuments(); }}
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-[#00B86B] focus:ring-2 focus:ring-[#00B86B]/20 transition-all font-medium"
                    >
                      <option value="">Không đính kèm CV (Ứng tuyển trực tiếp)</option>
                      {resumes.map((resume) => (
                        <option key={`resume-${resume.id}`} value={`resume:${resume.id}`}>
                          📄 PDF: {resume.title}
                        </option>
                      ))}
                      {cvDocuments.map((cv) => (
                        <option key={`builder-${cv.id}`} value={`builder:${cv.id}`}>
                          ✨ CV Builder: {cv.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <Link to="/cv" className="text-primary hover:underline flex items-center gap-1 font-medium">
                      + Tạo CV mới với AI
                    </Link>
                    <span>{resumes.length + cvDocuments.length} hồ sơ sẵn có</span>
                  </div>
                </div>
              ) : !user ? (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-800 leading-relaxed">
                  Đăng nhập để AI tự động điền thông tin và so khớp hồ sơ của bạn với vị trí này.
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  Bạn đang đăng nhập bằng tài khoản {user.role}. Hãy đăng nhập tài khoản ứng viên để nộp hồ sơ.
                </div>
              )}

              {applyMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium ${
                    applyMessage.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {applyMessage.text}
                </div>
              )}

              <Button
                onClick={handleApply}
                isLoading={isApplying}
                disabled={!job.is_active || (!!user && user.role !== "candidate")}
                fullWidth
                className="bg-[#00B86B] hover:bg-[#00995C] text-white py-3 rounded-xl font-bold text-sm shadow-sm"
              >
                {user ? (user.role === "candidate" ? "Nộp hồ sơ ngay" : "Chỉ ứng viên mới có thể nộp") : "Đăng nhập để ứng tuyển"}
              </Button>
            </Card>

            {/* Company Overview Card */}
            <Card className="p-6 border-gray-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                  {companyName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{companyName}</h3>
                  <p className="text-xs text-gray-500">Doanh nghiệp tuyển dụng</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                {job.employer?.company_description ||
                  "Công ty đang mở rộng đội ngũ nhân sự chất lượng cao và mang lại môi trường phát triển sự nghiệp năng động."}
              </p>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Trụ sở chính:</span>
                <span className="font-semibold text-gray-700">{job.location || "Việt Nam"}</span>
              </div>
            </Card>
          </aside>
        </div>

        {/* Back navigation */}
        <div className="pt-6 border-t border-gray-200 flex items-center justify-between text-sm">
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-gray-600 hover:text-primary font-medium">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách việc làm
          </Link>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-xs text-gray-500 hover:text-gray-900">
            Lên đầu trang ↑
          </button>
        </div>
      </div>
    </div>
  );
};

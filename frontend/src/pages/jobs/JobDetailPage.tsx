import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { applyJob, getJobById, getJobs } from "@/lib/api/jobs";
import { getMyResumes } from "@/lib/api/resumes";
import { getCvDocuments } from "@/lib/api/cvDocuments";
import { getAiMatch } from "@/lib/api/ai";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, Badge, Modal } from "@/components/ui";
import { Header } from "@/pages/jobs/components/Header";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  GraduationCap,
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
  Printer,
  TrendingUp,
  Bot,
  Copy,
  Check,
  Code2,
  HelpCircle,
  RefreshCw,
  Wand2,
  Users,
  CheckCheck,
  Target,
  ArrowUpRight,
} from "lucide-react";
import type { Job } from "@/types/job";
import type { Resume } from "@/types/resume";
import type { CvDocument } from "@/types/cvDocument";
import type { AIMatchResult } from "@/types/api";

export const JobDetailPage = () => {
  const { id } = useParams();
  const jobId = Number(id);
  const navigate = useNavigate();
  const user = useUser();
  const isCompanyInternal = user ? ["employer", "admin", "employee", "techlead"].includes(user.role) : false;
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyModalTab, setApplyModalTab] = useState<"standard" | "cover_letter">("standard");
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [cvDocuments, setCvDocuments] = useState<CvDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [candidateNote, setCandidateNote] = useState("");

  // Cover Letter Generator State
  const [coverLetterText, setCoverLetterText] = useState("");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [isCoverLetterCopied, setIsCoverLetterCopied] = useState(false);
  const [includeCoverLetterInApply, setIncludeCoverLetterInApply] = useState(true);

  // AI Matching Breakdown State
  const [aiMatchResult, setAiMatchResult] = useState<AIMatchResult | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [openInterviewFaqIndex, setOpenInterviewFaqIndex] = useState<number | null>(0);

  // Utility State
  const [isSaved, setIsSaved] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Check saved job state from localStorage
  useEffect(() => {
    if (!jobId) return;
    try {
      const saved = localStorage.getItem(`saved_job_${jobId}`);
      if (saved === "true") setIsSaved(true);
    } catch {
      // localStorage không khả dụng
    }
  }, [jobId]);

  const toggleSaveJob = () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      localStorage.setItem(`saved_job_${jobId}`, String(nextState));
    } catch {
      // Ignore
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

  const handlePrint = () => {
    window.print();
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

  // Load Job Details & Similar Jobs
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

  // Load Candidate Documents
  useEffect(() => {
    if (!tokenStorage.get() || isCompanyInternal) return;
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

  // Trigger AI Matching Evaluation when job & selected document change
  useEffect(() => {
    if (!job || isCompanyInternal) return;

    const computeMatching = async () => {
      let resumeId: number | null = null;
      if (selectedDocument.startsWith("resume:")) {
        resumeId = Number(selectedDocument.split(":")[1]);
      }

      if (!resumeId) {
        setAiMatchResult(null);
        setIsMatchingLoading(false);
        return;
      }

      setIsMatchingLoading(true);
      try {
        const matchData = await getAiMatch(resumeId, job.id);
        setAiMatchResult(matchData);
      } catch {
        setAiMatchResult(null);
      } finally {
        setIsMatchingLoading(false);
      }
    };

    computeMatching();
  }, [job, selectedDocument, isCompanyInternal]);

  // Generate AI Cover Letter
  const handleGenerateCoverLetter = () => {
    if (!job) return;
    setIsGeneratingCoverLetter(true);
    const companyName = job.employer?.company_name || job.employer?.full_name || "Quý Công ty";
    const candidateName = user?.full_name || "Ứng viên";

    setTimeout(() => {
      const generated = `Kính gửi Bộ phận Tuyển dụng ${companyName},

Tôi tên là ${candidateName}. Tôi viết thư này để bày tỏ sự quan tâm sâu sắc đối với vị trí ${job.title} mà Quý Công ty đang tuyển dụng.

Qua tìm hiểu về ${companyName} và các yêu cầu chi tiết trong bản mô tả công việc, tôi nhận thấy định hướng phát triển cũng như các thách thức kỹ thuật của vị trí này hoàn toàn trùng khớp với thế mạnh chuyên môn và niềm đam mê của tôi. Với kinh nghiệm thực chiến trong việc xây dựng hệ thống phần mềm hiệu năng cao, tôi tự tin có thể đóng góp giá trị ngay từ những ngày đầu gia nhập đội ngũ.

Tôi đã đính kèm hồ sơ CV chi tiết để Quý Công ty tiện xem xét. Tôi rất mong có cơ hội được trao đổi trực tiếp trong một buổi phỏng vấn để làm rõ hơn về mức độ phù hợp và cách tôi có thể hỗ trợ ${companyName} đạt được các mục tiêu công nghệ sắp tới.

Xin chân thành cảm ơn Quý Công ty đã dành thời gian xem xét hồ sơ!

Trân trọng,
${candidateName}`;

      setCoverLetterText(generated);
      setIsGeneratingCoverLetter(false);
    }, 600);
  };

  // Submit Application
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
            ? "Ứng tuyển thành công! Hồ sơ CV của bạn đã được chuyển trực tiếp tới nhà tuyển dụng."
            : "Ứng tuyển thành công! Bạn nên đính kèm CV để tăng điểm phù hợp khi AI đánh giá.",
      });
      setTimeout(() => {
        setIsApplyModalOpen(false);
      }, 1800);
    } catch {
      setApplyMessage({ type: "error", text: "Ứng tuyển thất bại. Vui lòng thử lại sau hoặc kiểm tra kết nối." });
    } finally {
      setIsApplying(false);
    }
  };

  const copyCoverLetter = () => {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText);
    setIsCoverLetterCopied(true);
    setTimeout(() => setIsCoverLetterCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] font-sans">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
          <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse" />
          <div className="h-64 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 animate-pulse">
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-200" />
              <div className="space-y-2 flex-1">
                <div className="h-8 w-2/3 bg-slate-200 rounded-lg" />
                <div className="h-4 w-1/3 bg-slate-200 rounded-lg" />
              </div>
            </div>
            <div className="h-12 w-full bg-slate-100 rounded-2xl mt-6" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            <div className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] font-sans">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <Card className="p-10 text-center rounded-3xl border-slate-200 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Không tìm thấy tin tuyển dụng</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              {error ?? "Vị trí tuyển dụng không tồn tại hoặc đã tạm dừng nhận hồ sơ ứng tuyển."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/jobs">
                <Button className="bg-[#00B86B] hover:bg-[#00995C] text-white font-bold rounded-full px-6">
                  Khám phá việc làm khác
                </Button>
              </Link>
              <Button onClick={() => navigate(-1)} variant="outline" className="rounded-full px-6 font-bold">
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
      : "Thoả thuận cạnh tranh";

  // Compute Salary Market Benchmark
  const expLevel = job.experience_level || "middle";
  const medianSalary = expLevel === "senior" ? 55 : expLevel === "lead" ? 85 : 32;
  const isHighSalary = (job.salary_max || job.salary_min || 0) >= medianSalary * 1000000;

  // Tech Stacks Mock Data based on title
  const techStackList = [
    "TypeScript",
    "React 19 / Next.js",
    "FastAPI / Python",
    "PostgreSQL (pgvector)",
    "Docker & CI/CD",
    "AWS Cloud",
    "Tailwind CSS",
  ];

  // Interview Questions Mock Data
  const interviewQuestionsList = [
    {
      question: `Bạn tối ưu hiệu năng và xử lý dữ liệu lớn trong các ứng dụng ${job.title} như thế nào?`,
      hint: "Tập trung giải thích về Virtual DOM, Caching (Redis), Query Indexing và quy trình Profiling bằng DevTools.",
    },
    {
      question: "Kinh nghiệm của bạn trong việc thiết kế kiến trúc phân tầng (Clean Architecture) và Microservices?",
      hint: "Nêu rõ cách chia Domain, Dependency Inversion, cách giao tiếp qua REST/gRPC/Kafka và chiến lược xử lý lỗi (Graceful degradation).",
    },
    {
      question: "Bạn giải quyết xung đột ý kiến kỹ thuật (Technical Disagreements) trong đội ngũ Tech Lead ra sao?",
      hint: "Thể hiện tư duy dựa trên số liệu (Data-driven), PoC (Proof of Concept) và tinh thần đồng lòng vì mục tiêu chung của sản phẩm.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      <SEOMeta
        title={`${job.title} tại ${companyName} | AI Job Portal`}
        description={job.description?.substring(0, 160) || `Tuyển dụng ${job.title} tại ${companyName}`}
        canonicalUrl={`https://ai-job-portal.com/jobs/${job.id}`}
      />
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* ── BREADCRUMB & TOP CONTROLS ────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <nav className="flex items-center gap-2 font-medium text-slate-500">
            <Link to="/" className="hover:text-emerald-700 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/jobs" className="hover:text-emerald-700 transition-colors">Tìm việc làm IT</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs">{job.title}</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Lưu bản in (PDF)</span>
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
            >
              <Share2 size={14} />
              <span>{copyFeedback ? "Đã sao chép link!" : "Chia sẻ"}</span>
            </button>
          </div>
        </div>

        {/* ── 1. HERO HEADER CARD (ENTERPRISE STANDARD) ────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-xs relative overflow-hidden space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Company Avatar & Info */}
            <div className="flex items-start gap-4 sm:gap-5 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-700 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-lg shadow-emerald-600/20 border border-emerald-400/30">
                {companyName.slice(0, 2).toUpperCase()}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-700 hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    {companyName}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Doanh nghiệp đã xác thực
                  </span>
                  {job.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B] animate-pulse" />
                      Đang nhận hồ sơ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Tạm dừng nộp đơn
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {job.title}
                </h1>

                {/* Primary Highlights Badges */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 text-sm font-black border border-emerald-200/80 shadow-2xs">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>{formattedSalary}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.location || "Toàn quốc (Hybrid/Remote)"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {job.job_type === "full_time"
                        ? "Toàn thời gian (Full-time)"
                        : job.job_type === "remote"
                        ? "Làm việc từ xa (100% Remote)"
                        : job.job_type === "part_time"
                        ? "Bán thời gian"
                        : job.job_type}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {job.experience_level === "senior"
                        ? "Senior (Trên 3 năm)"
                        : job.experience_level === "middle"
                        ? "Middle (1 - 3 năm)"
                        : job.experience_level === "junior"
                        ? "Junior (Dưới 1 năm)"
                        : "Fresher / Thực tập sinh"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Apply CTA */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSaveJob}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold ${
                    isSaved
                      ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  title={isSaved ? "Bỏ lưu việc làm" : "Lưu việc làm này"}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span>{isSaved ? "Đã lưu tin" : "Lưu tin"}</span>
                </button>

                <Button
                  onClick={() => setIsApplyModalOpen(true)}
                  disabled={!job.is_active || isCompanyInternal}
                  className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-7 py-3 rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{isCompanyInternal ? "Chỉ ứng viên mới có thể nộp" : "Ứng tuyển ngay"}</span>
                </Button>
              </div>

              {/* Fast Matching Highlight Badge */}
              {!isCompanyInternal && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-[#00B86B] animate-pulse" />
                <span>
                  AI Matching:{" "}
                  <strong>
                    {aiMatchResult ? `${aiMatchResult.score}% Phù hợp` : "Chưa có dữ liệu"}
                  </strong>
                </span>
              </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── 2. MAIN 2-COLUMN LAYOUT ────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          {/* LEFT: JOB DEEP DIVE & AI TOOLS */}
          <div className="space-y-6">

            {/* 🌟 AI MATCH LIVE BREAKDOWN WIDGET */}
            {!isCompanyInternal && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-emerald-950 via-[#062c23] to-[#031d17] text-white border border-emerald-500/30 shadow-xl space-y-6 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                    <Bot size={14} className="text-emerald-400" />
                    <span>AI Resume Matching Engine</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Đối Soát Năng Lực Thời Gian Thực (CV vs JD)
                  </h2>
                </div>

                {/* Score Gauge */}
                <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Độ khớp AI</span>
                    <span className="text-xs text-emerald-300 font-semibold">
                      {isMatchingLoading
                        ? "Đang phân tích..."
                        : aiMatchResult
                        ? aiMatchResult.score >= 85
                          ? "Cực kỳ tiềm năng"
                          : "Tiềm năng"
                        : "Chưa có dữ liệu"}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#00B86B] text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/30 text-center">
                    {isMatchingLoading ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : aiMatchResult ? (
                      `${aiMatchResult.score}%`
                    ) : (
                      "--%"
                    )}
                  </div>
                </div>
              </div>

              {/* Document Selector & Explanation */}
              <div className="space-y-3">
                {user?.role === "candidate" ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <FileText size={14} className="text-emerald-400" /> Đang so khớp với hồ sơ:
                    </label>
                    <select
                      value={selectedDocument}
                      onChange={(e) => setSelectedDocument(e.target.value)}
                      onFocus={() => { void refreshCandidateDocuments(); }}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    >
                      <option value="" className="text-slate-900">-- Chọn CV để so khớp AI --</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={`resume:${r.id}`} className="text-slate-900">
                          📄 {r.title}
                        </option>
                      ))}
                      {cvDocuments.map((cv) => (
                        <option key={cv.id} value={`builder:${cv.id}`} className="text-slate-900">
                          ✨ {cv.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-200/90 leading-relaxed font-light">
                    Hệ thống AI đối soát năng lực giữa CV ứng viên và yêu cầu kỹ thuật trong JD để tính toán độ tương thích chuẩn xác.
                  </p>
                )}

                {isMatchingLoading ? (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 text-center py-8 space-y-2">
                    <RefreshCw size={20} className="animate-spin text-emerald-400 mx-auto" />
                    <p>Đang so khớp vector embedding giữa CV và JD vị trí {job.title}...</p>
                  </div>
                ) : aiMatchResult ? (
                  <>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed">
                      💡 <strong>Đánh giá của Tech Lead AI:</strong> {aiMatchResult.explanation}
                    </div>

                    {/* 2-Column Skills Matrix */}
                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                      {/* Matched Strengths */}
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 space-y-2.5">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                          <span>Kỹ năng đáp ứng chuẩn ({aiMatchResult.strengths?.length || 0})</span>
                        </div>
                        <ul className="space-y-1.5">
                          {(aiMatchResult.strengths || []).map((str, idx) => (
                            <li key={idx} className="text-xs text-slate-200 flex items-start gap-1.5 font-medium">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Skill Gaps & Roadmap Action */}
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            <Target size={16} className="text-amber-400 shrink-0" />
                            <span>Lỗ hổng kỹ năng cần bổ sung</span>
                          </div>
                        </div>
                        <ul className="space-y-1.5">
                          {(aiMatchResult.gaps || []).map((gap, idx) => (
                            <li key={idx} className="text-xs text-slate-200 flex items-start gap-1.5 font-medium">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-white/10">
                          <Link
                            to="/ai/roadmap"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
                          >
                            <Sparkles size={13} />
                            <span>Tạo lộ trình học bổ sung kỹ năng còn thiếu</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/20 text-center space-y-2.5 py-6">
                    <p className="text-xs text-slate-300 font-medium">
                      {user?.role === "candidate"
                        ? "Vui lòng chọn hoặc tải lên một file CV để hệ thống AI tính toán điểm so khớp chính xác với công việc này."
                        : "Đăng nhập tài khoản Ứng viên để xem điểm so khớp AI chi tiết giữa hồ sơ của bạn và công việc này."}
                    </p>
                    {user?.role === "candidate" && resumes.length === 0 && (
                      <Link
                        to="/cv"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:underline pt-1"
                      >
                        <span>Tạo hoặc tải lên CV ngay →</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </motion.section>
            )}

            {/* ── 3. SALARY BENCHMARK & MARKET INSIGHTS 2026 ────────────── */}
            <section className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <TrendingUp size={14} className="text-emerald-600" />
                    <span>Thước Đo Thị Trường 2026</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Mức Thu Nhập So Với Trung Vị Ngành IT
                  </h3>
                </div>

                <Link
                  to="/tools"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 shrink-0"
                >
                  Tính lương Gross - Net <ExternalLink size={13} />
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Trung vị thị trường ({expLevel}): <strong>{medianSalary} Triệu VNĐ</strong></span>
                  <span className="text-emerald-700 font-black">
                    {isHighSalary ? "🌟 Thuộc Top 15% cạnh tranh nhất" : "✓ Mức thu nhập chuẩn thị trường"}
                  </span>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 flex">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-[#00B86B] to-teal-600 transition-all duration-1000 shadow-xs"
                    style={{ width: isHighSalary ? "88%" : "72%" }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Khởi điểm: 15M</span>
                  <span>Trung vị: {medianSalary}M</span>
                  <span>Cao cấp: 80M+</span>
                </div>
              </div>
            </section>

            {/* ── 4. DETAILED JOB DESCRIPTION & REQUIREMENTS ───────────── */}
            <Card className="p-6 sm:p-8 space-y-8 bg-white rounded-[32px] border-slate-200/90 shadow-xs">
              {/* Job Description */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900">Mô tả công việc</h2>
                </div>
                <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line space-y-2 font-normal">
                  {job.description}
                </div>
              </section>

              {/* Requirements */}
              {job.requirements && (
                <section className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-black text-slate-900">Yêu cầu ứng viên</h2>
                  </div>
                  <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line space-y-2 font-normal">
                    {job.requirements}
                  </div>
                </section>
              )}

              {/* Benefits */}
              {job.benefits && (
                <section className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-black text-slate-900">Quyền lợi & Phúc lợi độc quyền</h2>
                  </div>
                  <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line space-y-2 font-normal">
                    {job.benefits}
                  </div>
                </section>
              )}

              {/* Tech Stack Matrix */}
              <section className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2">
                  <Code2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900">Tech Stack & Tooling của dự án</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {techStackList.map((tech) => (
                    <span
                      key={tech}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            </Card>

            {/* ── 5. TECHNICAL INTERVIEW QUESTIONS PREVIEW ─────────────── */}
            <section className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-xs space-y-5">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200">
                  <HelpCircle size={14} className="text-indigo-600" />
                  <span>Chuẩn Bị Phỏng Vấn Kỹ Thuật</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Top 3 Câu Hỏi Tech Lead Thường Gặp Cho Vị Trí Này
                </h3>
              </div>

              <div className="space-y-3">
                {interviewQuestionsList.map((item, idx) => {
                  const isOpen = openInterviewFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setOpenInterviewFaqIndex(isOpen ? null : idx)}
                        className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 bg-slate-50/60 hover:bg-slate-100/80 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black shrink-0">
                            0{idx + 1}
                          </span>
                          <span>{item.question}</span>
                        </span>
                        <ChevronRight
                          size={16}
                          className={`text-slate-400 transition-transform ${isOpen ? "rotate-90 text-indigo-600" : ""}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 leading-relaxed space-y-1.5">
                          <span className="font-bold text-indigo-700 block">💡 Định hướng trả lời ghi điểm:</span>
                          <p>{item.hint}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── 6. SIMILAR JOBS CAROUSEL ─────────────────────────────── */}
            {similarJobs.length > 0 && (
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Việc làm tương tự cùng chuyên môn</h3>
                  <Link to="/jobs" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                    Xem tất cả việc làm <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {similarJobs.map((sim) => (
                    <Link
                      key={sim.id}
                      to={`/jobs/${sim.id}`}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#00B86B] hover:shadow-md transition-all group block space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200/60 shrink-0">
                          {(sim.employer?.company_name || "IT").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#00B86B] transition-colors truncate">
                            {sim.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {sim.employer?.company_name || "Doanh nghiệp đối tác"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold pt-2 border-t border-slate-100">
                        <span className="text-emerald-700 font-black">
                          {sim.salary_min ? `${sim.salary_min / 1000000}tr+` : "Thoả thuận"}
                        </span>
                        <span>{sim.location || "Toàn quốc"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: STICKY APPLICATION SIDEBAR ─────────────────────── */}
          <aside className="space-y-6 sticky top-24">
            {/* Quick Apply Card */}
            <Card id="apply-box" className="p-6 sm:p-7 rounded-[32px] border-slate-200/90 bg-white shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#00B86B]" />
                  Ứng tuyển công việc
                </h3>
                <Badge variant={job.is_active ? "success" : "default"} size="sm">
                  {job.is_active ? "Đang nhận hồ sơ" : "Đã đóng"}
                </Badge>
              </div>

              {user?.role === "candidate" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Chọn hồ sơ CV ứng tuyển:
                    </label>
                    <select
                      value={selectedDocument}
                      onChange={(e) => setSelectedDocument(e.target.value)}
                      onFocus={() => { void refreshCandidateDocuments(); }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#00B86B] focus:ring-2 focus:ring-[#00B86B]/20 transition-all"
                    >
                      <option value="">Không đính kèm CV (Nộp thông tin cơ bản)</option>
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
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <Link to="/cv" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                      + Tạo CV mới với AI
                    </Link>
                    <span>{resumes.length + cvDocuments.length} hồ sơ sẵn có</span>
                  </div>

                  {/* AI Cover Letter Quick Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(true);
                      setApplyModalTab("cover_letter");
                      if (!coverLetterText) handleGenerateCoverLetter();
                    }}
                    className="w-full p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wand2 size={14} className="text-emerald-600" />
                    <span>Tạo Cover Letter tự động với AI</span>
                  </button>
                </div>
              ) : !user ? (
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-xs text-blue-900 leading-relaxed font-medium">
                  Đăng nhập để AI tự động so khớp hồ sơ của bạn với vị trí này và nhận các gợi ý phỏng vấn riêng.
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                  Bạn đang đăng nhập bằng tài khoản {user.role}. Hãy đăng nhập tài khoản ứng viên để nộp hồ sơ.
                </div>
              )}

              {applyMessage && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-bold ${
                    applyMessage.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}
                >
                  {applyMessage.text}
                </div>
              )}

              <Button
                onClick={() => setIsApplyModalOpen(true)}
                isLoading={isApplying}
                disabled={!job.is_active || isCompanyInternal}
                fullWidth
                className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
              >
                {user ? (!isCompanyInternal ? "Nộp hồ sơ ngay" : "Chỉ ứng viên mới có thể nộp") : "Đăng nhập để ứng tuyển"}
              </Button>
            </Card>

            {/* Company Bento Box */}
            <Card className="p-6 sm:p-7 rounded-[32px] border-slate-200/90 bg-white shadow-xs space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-700 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md shadow-emerald-500/20">
                  {companyName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">{companyName}</h3>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck size={13} /> Doanh nghiệp đối tác uy tín
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-light">
                {job.employer?.company_description ||
                  "Doanh nghiệp công nghệ phát triển mạnh mẽ với môi trường làm việc cởi mở, chế độ đãi ngộ vượt trội và cơ hội bứt phá sự nghiệp."}
              </p>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={13} /> Địa điểm:
                  </span>
                  <span className="font-bold text-slate-800">{job.location || "Việt Nam"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users size={13} /> Quy mô:
                  </span>
                  <span className="font-bold text-slate-800">50 - 250 nhân sự</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Briefcase size={13} /> Chế độ:
                  </span>
                  <span className="font-bold text-emerald-700">Hybrid / Linh hoạt</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {/* ── BOTTOM BACK NAVIGATION ─────────────────────────────────── */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm">
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách việc làm IT
          </Link>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Lên đầu trang ↑
          </button>
        </div>
      </main>

      {/* ── SMART QUICK APPLY & AI COVER LETTER MODAL ────────────────── */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Ứng Tuyển Vị Trí Tuyển Dụng"
        size="2xl"
      >
        <div className="space-y-6 pt-2">
          {/* Modal Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setApplyModalTab("standard")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                applyModalTab === "standard"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText size={14} />
              <span>1. Chọn Hồ Sơ & Nộp Đơn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setApplyModalTab("cover_letter");
                if (!coverLetterText) handleGenerateCoverLetter();
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                applyModalTab === "cover_letter"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wand2 size={14} className="text-emerald-600" />
              <span>2. AI Cover Letter Studio</span>
            </button>
          </div>

          {/* TAB 1: STANDARD APPLY */}
          {applyModalTab === "standard" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-xs text-emerald-950">{job.title}</h4>
                  <p className="text-[11px] text-emerald-700">{companyName}</p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200">
                  {formattedSalary}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn CV đính kèm:
                </label>
                <select
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#00B86B] focus:ring-2 focus:ring-[#00B86B]/20 transition-all"
                >
                  <option value="">Không đính kèm file</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={`resume:${r.id}`}>
                      📄 PDF: {r.title}
                    </option>
                  ))}
                  {cvDocuments.map((cv) => (
                    <option key={cv.id} value={`builder:${cv.id}`}>
                      ✨ CV Builder: {cv.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lời nhắn gửi nhà tuyển dụng (tuỳ chọn):
                </label>
                <textarea
                  rows={3}
                  value={candidateNote}
                  onChange={(e) => setCandidateNote(e.target.value)}
                  placeholder="Giới thiệu nhanh về thế mạnh hoặc thời điểm bạn có thể bắt đầu nhận việc..."
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#00B86B] focus:ring-2 focus:ring-[#00B86B]/20 transition-all font-normal"
                />
              </div>

              {coverLetterText && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60">
                  <CheckCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>Đã tạo Cover Letter bằng AI và sẵn sàng gửi kèm.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI COVER LETTER STUDIO */}
          {applyModalTab === "cover_letter" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Bot size={14} className="text-emerald-600" />
                  Thư Ứng Tuyển Cá Nhân Hóa (AI Generated):
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateCoverLetter}
                    disabled={isGeneratingCoverLetter}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={13} className={isGeneratingCoverLetter ? "animate-spin" : ""} />
                    <span>Tạo lại</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyCoverLetter}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {isCoverLetterCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{isCoverLetterCopied ? "Đã sao chép!" : "Sao chép"}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={10}
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                placeholder="Đang tạo thư ứng tuyển bằng AI..."
                className="w-full rounded-2xl border border-slate-200 p-4 text-xs leading-relaxed text-slate-800 bg-slate-50/50 outline-none focus:border-[#00B86B] focus:bg-white focus:ring-2 focus:ring-[#00B86B]/20 transition-all font-normal"
              />

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCoverLetterInApply}
                  onChange={(e) => setIncludeCoverLetterInApply(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Đính kèm Cover Letter này cùng hồ sơ nộp cho Nhà tuyển dụng</span>
              </label>
            </div>
          )}

          {applyMessage && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold ${
                applyMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {applyMessage.text}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsApplyModalOpen(false)}
              className="rounded-full px-5 text-xs font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleApply}
              isLoading={isApplying}
              disabled={!job.is_active || (!!user && user.role !== "candidate")}
              className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full px-7 text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {user ? "Xác nhận nộp hồ sơ" : "Đăng nhập để nộp"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import { useCallback, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  DollarSign,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  Flame,
  FileText,
  BookOpen,
  Send,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { getMyResumes } from "@/lib/api/resumes";
import { getCvDocuments } from "@/lib/api/cvDocuments";
import { getJobs } from "@/lib/api/jobs";
import { getAiMatch } from "@/lib/api/ai";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage, getApiErrorMessage } from "@/lib/axios";
import { Button, Spinner, AIDisclaimerBanner } from "@/components/ui";
import { Header } from "@/pages/jobs/components/Header";
import { Footer } from "@/pages/jobs/components/Footer";
import { SEOMeta } from "@/components/seo/SEOMeta";
import type { Resume } from "@/types/resume";
import type { CvDocument } from "@/types/cvDocument";
import type { Job } from "@/types/job";
import type { AIMatchResult } from "@/types/api";

// ─── Preset Persona Demos for Visitors or Instant Simulator ──────────────────
interface DemoPersona {
  id: string;
  name: string;
  role: string;
  skills: string[];
  experienceYears: number;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "persona-frontend",
    name: "Senior Frontend / React 19 Specialist",
    role: "Senior Frontend Engineer",
    skills: ["React 19", "TypeScript", "Next.js", "Tailwind CSS", "Zustand", "Core Web Vitals"],
    experienceYears: 4,
  },
  {
    id: "persona-fullstack-ai",
    name: "Full-Stack AI & Cloud Engineer",
    role: "Fullstack AI Engineer",
    skills: ["Python FastAPI", "React 19", "PostgreSQL", "pgvector", "Docker", "LLM APIs"],
    experienceYears: 5,
  },
  {
    id: "persona-backend-go",
    name: "Backend Architect (Golang & High-Load)",
    role: "Backend Architect",
    skills: ["Golang", "gRPC", "Kafka", "Microservices", "Kubernetes", "Redis"],
    experienceYears: 6,
  },
];

// ─── Articles for SEO Knowledge Hub ──────────────────────────────────────────
const ARTICLES = [
  {
    id: "vector-matching-explained",
    title: "Giải mã Thuật toán AI Semantic Matching & pgvector trong Tuyển dụng 2026",
    category: "Thuật toán & Kỹ thuật",
    readTime: "5 phút đọc",
    author: "AI Tech Lead Team",
    excerpt: "Cách hệ thống biến CV và JD thành các vector 1536 chiều để tìm độ tương đồng ngữ nghĩa bằng Cosine Similarity thay vì lọc từ khóa đơn thuần.",
  },
  {
    id: "beat-ats-with-google-xyz",
    title: "Bí quyết viết CV chuẩn công thức Google XYZ để đạt 95% AI Match",
    category: "Tối ưu CV IT",
    readTime: "6 phút đọc",
    author: "Career Coach Expert",
    excerpt: "Công thức vàng 'Accomplished [X] measured by [Y] by doing [Z]' giúp mô hình ngôn ngữ lớn đánh giá tối đa giá trị kinh nghiệm của bạn.",
  },
  {
    id: "salary-negotiation-2026",
    title: "Báo cáo Thị trường Lương & Xu hướng Tuyển dụng IT Việt Nam 2026",
    category: "Xu hướng Tuyển dụng",
    readTime: "7 phút đọc",
    author: "Market Intelligence",
    excerpt: "Bảng phân tích dải lương thực tế cho các vị trí AI, Cloud, Frontend và Backend tại Hà Nội, TP.HCM & Remote.",
  },
];

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Điểm AI Matching được tính toán dựa trên những yếu tố nào?",
    a: "Điểm số được tính toán dựa trên thuật toán pgvector Cosine Similarity 1536 chiều, so khớp đa chiều giữa hồ sơ ứng viên và JD gồm: Kỹ năng cốt lõi (Tech Stack Fit), Chiều sâu kinh nghiệm dự án (STAR / Google XYZ), Cấp bậc chuyên môn và Mức lương kỳ vọng.",
  },
  {
    q: "Hệ thống có nhận diện được cả CV tạo bằng CV Studio và file PDF tải lên không?",
    a: "Có! Hệ thống hỗ trợ đồng thời cả CV được tạo trực tiếp trên CV Builder Studio và các file PDF/DOCX bạn tải lên. AI sẽ tự động trích xuất các thuộc tính kỹ năng để so khớp tức thì.",
  },
  {
    q: "Nếu điểm AI Matching của tôi dưới 75%, tôi nên làm gì?",
    a: "Hệ thống sẽ liệt kê chi tiết mục Kỹ năng còn thiếu (Skill Gaps). Bạn có thể bấm vào 'Xem Lộ Trình Kỹ Năng' để nhận kế hoạch nâng cao trình độ, hoặc dùng CV Builder để bổ sung các dự án liên quan.",
  },
  {
    q: "Nhà tuyển dụng có thấy điểm AI Match này khi tôi ứng tuyển không?",
    a: "Có. Nhà tuyển dụng sử dụng bảng điều khiển Employer Dashboard được sắp xếp theo AI Match Score, giúp hồ sơ có độ khớp cao được ưu tiên mở xem và hẹn lịch phỏng vấn đầu tiên.",
  },
];

export function AIMatchingPage() {
  const user = useUser();
  // router

  // Active CV Selection (supports both cv_documents and uploaded resumes)
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [cvDocs, setCvDocs] = useState<CvDocument[]>([]);
  const [selectedCvSource, setSelectedCvSource] = useState<{ type: "cv_doc" | "resume"; id: number } | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<DemoPersona>(DEMO_PERSONAS[0]);
  const [isCvLoading, setIsCvLoading] = useState(false);

  // Jobs feed
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [, setJobsError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [filterJobType, setFilterJobType] = useState<string>("ALL");
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);

  // Deep Match Result state
  const [activeMatchResult, setActiveMatchResult] = useState<AIMatchResult | null>(null);
  const [matchingJobId, setMatchingJobId] = useState<number | null>(null);
  const [jobMatchScores, setJobMatchScores] = useState<Record<number, AIMatchResult>>({});
  const [matchError, setMatchError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Hydrate user auth if token exists
  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
    }
  }, [user]);

  // Load User's CVs (CV Studio docs & Uploaded Resumes)
  const fetchUserCVs = useCallback(async () => {
    if (!user) return;
    setIsCvLoading(true);
    try {
      const [resumesData, docsData] = await Promise.allSettled([
        getMyResumes(),
        getCvDocuments(),
      ]);

      const loadedResumes = resumesData.status === "fulfilled" ? resumesData.value : [];
      const loadedDocs = docsData.status === "fulfilled" ? docsData.value : [];

      setResumes(loadedResumes);
      setCvDocs(loadedDocs);

      // Auto-select first available CV
      if (loadedDocs.length > 0) {
        setSelectedCvSource({ type: "cv_doc", id: loadedDocs[0].id });
      } else if (loadedResumes.length > 0) {
        setSelectedCvSource({ type: "resume", id: loadedResumes[0].id });
      }
    } catch {
      // Ignored fallback
    } finally {
      setIsCvLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserCVs();
  }, [fetchUserCVs]);

  // Load Jobs
  useEffect(() => {
    const loadJobs = async () => {
      setJobsLoading(true);
      setJobsError(null);
      try {
        const res = await getJobs({ page: 1, page_size: 20 });
        setJobs(res.items || []);
        if (res.items && res.items.length > 0) {
          setSelectedJobForDetail(res.items[0]);
        }
      } catch (err) {
        setJobsError(getApiErrorMessage(err));
      } finally {
        setJobsLoading(false);
      }
    };
    loadJobs();
  }, []);

  // Compute Active Skills for Matching
  const activeCandidateSkills = useMemo(() => {
    if (selectedCvSource?.type === "cv_doc") {
      const doc = cvDocs.find((d) => d.id === selectedCvSource.id);
      if (doc?.content_json?.skills) return doc.content_json.skills;
    }
    return selectedPersona.skills;
  }, [selectedCvSource, cvDocs, selectedPersona]);

  // Matching Metrics Generator for Job items — only uses real API scores from DB/backend
  const getJobMatchMetrics = useCallback(
    (job: Job) => {
      const jobDesc = `${job.title} ${job.description} ${job.requirements || ""}`.toLowerCase();
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      activeCandidateSkills.forEach((skill) => {
        if (
          jobDesc.includes(skill.toLowerCase()) ||
          (skill.toLowerCase().includes("react") && jobDesc.includes("frontend"))
        ) {
          matchedSkills.push(skill);
        }
      });

      const commonTechs = ["TypeScript", "React", "Node.js", "Docker", "PostgreSQL", "FastAPI", "AWS", "Python"];
      commonTechs.forEach((tech) => {
        if (
          jobDesc.includes(tech.toLowerCase()) &&
          !activeCandidateSkills.some((s) => s.toLowerCase() === tech.toLowerCase())
        ) {
          missingSkills.push(tech);
        }
      });

      // Real matching score from backend API, null if not yet matched
      const realMatch = jobMatchScores[job.id];
      const realScore = realMatch ? realMatch.score : null;

      return {
        score: realScore,
        matchedSkills: realMatch?.strengths?.length ? realMatch.strengths : matchedSkills,
        missingSkills: realMatch?.gaps?.length ? realMatch.gaps : missingSkills.slice(0, 3),
        vectorDistance: realScore != null ? (1 - realScore / 100).toFixed(4) : null,
      };
    },
    [activeCandidateSkills, jobMatchScores]
  );

  // Filtered and Ranked Jobs
  const rankedJobs = useMemo(() => {
    return jobs
      .map((job) => ({
        job,
        metrics: getJobMatchMetrics(job),
      }))
      .filter(({ job, metrics }) => {
        const matchesKeyword =
          !searchQuery ||
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ((job as any).company_name || job.employer?.company_name || job.employer?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesScore = filterMinScore <= 0 || (metrics.score != null && metrics.score >= filterMinScore);
        const matchesType =
          filterJobType === "ALL" ||
          (filterJobType === "REMOTE" && job.job_type?.toLowerCase().includes("remote")) ||
          (filterJobType === "FULL_TIME" && (job.job_type?.toLowerCase().includes("full") || !job.job_type));

        return matchesKeyword && matchesScore && matchesType;
      })
      .sort((a, b) => {
        if (a.metrics.score != null && b.metrics.score != null) {
          return b.metrics.score - a.metrics.score;
        }
        if (a.metrics.score != null) return -1;
        if (b.metrics.score != null) return 1;
        return 0;
      });
  }, [jobs, getJobMatchMetrics, searchQuery, filterMinScore, filterJobType]);

  const bestMatchedJob = useMemo(() => {
    return rankedJobs.find((j) => j.metrics.score != null) || null;
  }, [rankedJobs]);

  // Deep AI Match Trigger — connects directly to real backend API
  const handleRunDeepMatch = async (job: Job) => {
    setSelectedJobForDetail(job);
    setMatchError(null);

    // If already computed, restore from state cache
    if (jobMatchScores[job.id]) {
      setActiveMatchResult(jobMatchScores[job.id]);
      return;
    }

    const realResumeId =
      selectedCvSource?.type === "resume"
        ? selectedCvSource.id
        : resumes[0]?.id;

    if (realResumeId) {
      setMatchingJobId(job.id);
      setActiveMatchResult(null);
      try {
        const data = await getAiMatch(realResumeId, job.id);
        setActiveMatchResult(data);
        setJobMatchScores((prev) => ({ ...prev, [job.id]: data }));
      } catch (err) {
        setMatchError(getApiErrorMessage(err));
      } finally {
        setMatchingJobId(null);
      }
    } else {
      setMatchError("Vui lòng chọn hoặc tải lên một CV dạng file để so khớp AI với công việc này.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      <SEOMeta
        title="AI Matching Hub 2026 – So Khớp Việc Làm Chuẩn pgvector | AI Job Portal"
        description="Khám phá các việc làm có độ tương thích cao nhất với hồ sơ của bạn bằng thuật toán Vector Embedding và Cosine Similarity 1536 chiều."
      />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ── HERO BENTO BANNER ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#00B86B]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Sparkles size={14} className="text-[#00B86B] animate-pulse" />
                <span>pgvector Cosine Similarity 1536-D Engine • Live 2026</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                AI Smart Matching & <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Gợi Ý Việc Làm Tương Thích
                </span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                Hệ thống tự động so khớp đa chiều giữa hồ sơ của bạn với hàng ngàn tin tuyển dụng. Tìm ra vị trí có xác suất trúng tuyển cao nhất mà không cần tìm kiếm thủ công.
              </p>

              {/* CV Selector Pills */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <FileText size={14} className="text-[#00B86B]" /> Hồ sơ đang so khớp:
                  </span>

                  {user ? (
                    isCvLoading ? (
                      <Spinner size="sm" label="Đang tải..." />
                    ) : cvDocs.length > 0 || resumes.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {cvDocs.map((doc) => (
                          <button
                            key={`doc-${doc.id}`}
                            onClick={() => setSelectedCvSource({ type: "cv_doc", id: doc.id })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              selectedCvSource?.type === "cv_doc" && selectedCvSource.id === doc.id
                                ? "bg-[#00B86B] text-white border-[#00B86B] shadow-md shadow-emerald-600/30"
                                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                            }`}
                          >
                            📄 {doc.title}
                          </button>
                        ))}
                        {resumes.map((res) => (
                          <button
                            key={`res-${res.id}`}
                            onClick={() => setSelectedCvSource({ type: "resume", id: res.id })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              selectedCvSource?.type === "resume" && selectedCvSource.id === res.id
                                ? "bg-[#00B86B] text-white border-[#00B86B] shadow-md shadow-emerald-600/30"
                                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                            }`}
                          >
                            📎 {res.title}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Link
                        to="/cv/new"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline bg-emerald-500/20 px-3 py-1 rounded-lg"
                      >
                        + Tạo CV Chuẩn Ngay Để So Khớp
                      </Link>
                    )
                  ) : (
                    /* Guest Persona Switcher */
                    <div className="flex flex-wrap items-center gap-2">
                      {DEMO_PERSONAS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPersona(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            selectedPersona.id === p.id
                              ? "bg-[#00B86B] text-white border-[#00B86B] shadow-md shadow-emerald-600/30"
                              : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                          }`}
                        >
                          👤 {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Live Gauge */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" /> Điểm Khớp Cao Nhất
                </span>
                {bestMatchedJob && bestMatchedJob.metrics.score != null && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {bestMatchedJob.metrics.score >= 85 ? "Rất phù hợp" : "Tiềm năng"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-5">
                {bestMatchedJob && bestMatchedJob.metrics.score != null ? (
                  <>
                    <div className="relative w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-2xl shadow-lg shadow-emerald-900/40">
                      <span>{bestMatchedJob.metrics.score.toFixed(0)}%</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-white line-clamp-1">{bestMatchedJob.job.title}</h4>
                      <p className="text-slate-400 font-medium">
                        {(bestMatchedJob.job as any)?.company_name || bestMatchedJob.job.employer?.company_name || bestMatchedJob.job.employer?.full_name || "Công ty tuyển dụng"}
                      </p>
                      <p className="text-emerald-400 font-semibold text-[11px]">
                        Cosine Similarity: {(bestMatchedJob.metrics.score / 100).toFixed(4)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-20 h-20 flex items-center justify-center rounded-2xl bg-slate-800 text-slate-400 font-bold text-xs shadow-inner border border-slate-700 text-center px-2">
                      <span>Chưa có dữ liệu</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-slate-300">Chưa có kết quả so khớp</h4>
                      <p className="text-slate-400 font-medium">Chọn một công việc để bắt đầu so khớp AI</p>
                      <p className="text-slate-500 text-[11px]">Cosine Similarity: --</p>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Số việc làm sẵn sàng so khớp:</span>
                <strong className="text-white font-black">{jobs.length} công việc</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ── FILTER & SEARCH BAR ────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm việc làm theo chức danh, công nghệ hoặc công ty..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#00B86B] focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Min Score Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
              <Target size={14} className="text-[#00B86B]" />
              <span>Độ khớp:</span>
              <select
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(Number(e.target.value))}
                className="bg-transparent font-black text-[#00B86B] outline-none cursor-pointer"
              >
                <option value={0}>Tất cả</option>
                <option value={80}>≥ 80% (Khớp cao)</option>
                <option value={90}>≥ 90% (Hoàn hảo)</option>
              </select>
            </div>

            {/* Job Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
              <Building2 size={14} className="text-slate-500" />
              <span>Hình thức:</span>
              <select
                value={filterJobType}
                onChange={(e) => setFilterJobType(e.target.value)}
                className="bg-transparent font-black text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả</option>
                <option value="REMOTE">Remote</option>
                <option value="FULL_TIME">Full-time</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── 2-COLUMN MATCHING FEED & DETAIL BREAKDOWN ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
          
          {/* ── LEFT: RANKED JOBS FEED ──────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Flame size={16} className="text-amber-500" />
                <span>Việc Làm Khớp Nhất Với Hồ Sơ Của Bạn ({rankedJobs.length})</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">Sắp xếp theo % Match giảm dần</span>
            </div>

            {jobsLoading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <Spinner size="lg" label="AI đang quét vector embedding và so khớp..." />
                <p className="text-xs text-slate-400">Đang tính toán Cosine Similarity cho {jobs.length} công việc...</p>
              </div>
            ) : rankedJobs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <AlertCircle size={32} className="mx-auto text-amber-500" />
                <h3 className="text-base font-bold text-slate-800">Không tìm thấy việc làm phù hợp với bộ lọc</h3>
                <p className="text-xs text-slate-500">Hãy thử giảm mức độ khớp tối thiểu hoặc xóa từ khóa tìm kiếm.</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterMinScore(0);
                    setFilterJobType("ALL");
                  }}
                  className="bg-[#00B86B] text-white rounded-full font-bold text-xs"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {rankedJobs.map(({ job, metrics }) => {
                  const isSelected = selectedJobForDetail?.id === job.id;
                  const isHighMatch = metrics.score != null && metrics.score >= 85;

                  return (
                    <motion.div
                      key={job.id}
                      layout
                      onClick={() => handleRunDeepMatch(job)}
                      className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer bg-white relative group ${
                        isSelected
                          ? "border-[#00B86B] shadow-md ring-2 ring-[#00B86B]/20"
                          : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        
                        {/* Job Info */}
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {(job as any).company_name || job.employer?.company_name || job.employer?.full_name || "Enterprise Tech"}
                            </span>
                            {job.job_type && (
                              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                                {job.job_type}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                            {job.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} className="text-slate-400" /> {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-emerald-700 font-bold">
                              <DollarSign size={12} /> {job.salary_min && job.salary_max ? `${(job.salary_min/1000000).toFixed(0)} - ${(job.salary_max/1000000).toFixed(0)} Triệu` : "Thỏa thuận"}
                            </span>
                          </div>

                          {/* Matched & Missing Skills Pills */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {metrics.matchedSkills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md"
                              >
                                <CheckCircle2 size={10} className="text-[#00B86B]" />
                                {skill}
                              </span>
                            ))}

                            {metrics.missingSkills.length > 0 && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                                Thiếu: {metrics.missingSkills.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Match Badge & Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                          {metrics.score != null ? (
                            <div
                              className={`px-3.5 py-2 rounded-2xl text-center shadow-xs ${
                                isHighMatch
                                  ? "bg-gradient-to-br from-[#00B86B] to-teal-600 text-white"
                                  : "bg-slate-100 text-slate-800 border border-slate-200"
                              }`}
                            >
                              <span className="text-[10px] uppercase font-bold block opacity-90">AI Match</span>
                              <span className="text-lg font-black">{metrics.score.toFixed(0)}%</span>
                            </div>
                          ) : (
                            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold text-center border border-slate-200">
                              <span>Chưa có dữ liệu</span>
                            </div>
                          )}

                          <Link
                            to={`/jobs/${job.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#00B86B] hover:text-emerald-800 hover:underline pt-1"
                          >
                            <span>Xem chi tiết JD</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: STICKY DEEP MATCH BREAKDOWN DRAWER ──────────────── */}
          <aside className="sticky top-20 space-y-4">
            {selectedJobForDetail ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                
                {/* Header of selected job */}
                <div className="border-b border-slate-100 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Báo Cáo Phân Tích Chuyên Sâu
                    </span>
                    <span className="text-xs font-bold text-slate-400">Job #{selectedJobForDetail.id}</span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {selectedJobForDetail.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-semibold">{(selectedJobForDetail as any).company_name || selectedJobForDetail.employer?.company_name || selectedJobForDetail.employer?.full_name || "Doanh nghiệp tuyển dụng"}</p>
                </div>

                {/* Real Deep Match Breakdown */}
                {matchingJobId === selectedJobForDetail.id ? (
                  <div className="p-8 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-[#00B86B] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Đang so khớp vector embedding với JD...</p>
                  </div>
                ) : activeMatchResult ? (
                  <div className="space-y-3">
                    {/* Overall AI Matching Score */}
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-emerald-900 flex items-center gap-1">
                          <Sparkles size={13} className="text-[#00B86B]" /> Điểm So Khớp AI (pgvector)
                        </span>
                        <span className="text-emerald-700 font-black text-base">{activeMatchResult.score.toFixed(0)}%</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">{activeMatchResult.explanation}</p>
                    </div>

                    {/* Strengths */}
                    {activeMatchResult.strengths && activeMatchResult.strengths.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-[#00B86B]" /> Điểm Phù Hợp Nổi Bật
                        </div>
                        <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                          {activeMatchResult.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Skill Gaps */}
                    {activeMatchResult.gaps && activeMatchResult.gaps.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                          <span className="flex items-center gap-1">
                            <AlertCircle size={12} className="text-amber-600" /> Kỹ Năng Cần Bổ Sung
                          </span>
                        </div>
                        <ul className="text-[11px] text-amber-800 space-y-1 list-disc list-inside">
                          {activeMatchResult.gaps.map((g, idx) => (
                            <li key={idx}>{g}</li>
                          ))}
                        </ul>
                        <Link
                          to="/ai/roadmap"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 underline hover:text-amber-950 pt-1"
                        >
                          <span>Xem Lộ Trình Bổ Sung Kỹ Năng ↗</span>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                    {matchError ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                        {matchError}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium">
                        Chưa có dữ liệu so khớp chi tiết cho công việc này.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRunDeepMatch(selectedJobForDetail)}
                      className="px-4 py-2 bg-[#00B86B] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles size={13} />
                      <span>So Khớp AI Ngay</span>
                    </button>
                  </div>
                )}

                {/* Direct CTA */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <Link
                    to={`/jobs/${selectedJobForDetail.id}`}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Send size={13} />
                    <span>Nộp Đơn Ứng Tuyển Công Việc Này</span>
                  </Link>

                  <p className="text-[10px] text-center text-slate-400">
                    Hồ sơ của bạn sẽ được gửi trực tiếp đến phòng tuyển dụng.
                  </p>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 space-y-2 shadow-xs">
                <Target size={28} className="mx-auto text-slate-300" />
                <p className="text-xs font-medium">Chọn một công việc bên trái để xem phân tích chi tiết độ khớp.</p>
              </div>
            )}

            {/* Quick Promo Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200/80 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                <Sparkles size={14} className="text-[#00B86B]" />
                <span>Nâng Điểm AI Match Lên 98%?</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Tối ưu lại CV của bạn bằng Trình Tạo CV Chuẩn ATS với công thức Google XYZ Formula để tăng tỷ lệ gọi phỏng vấn gấp 3 lần.
              </p>
              <Link
                to="/cv"
                className="inline-flex items-center gap-1 text-xs font-black text-[#00B86B] hover:underline"
              >
                Mở CV Builder Studio →
              </Link>
            </div>
          </aside>

        </div>

        {/* ── SEO KNOWLEDGE HUB & ARTICLES ──────────────────────────────── */}
        <section className="pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen size={18} className="text-[#00B86B]" />
                <span>Cẩm Nang Công Nghệ & Thuật Toán Tuyển Dụng AI 2026</span>
              </h2>
              <p className="text-xs text-slate-500">Nắm vững nguyên lý hoạt động của các hệ thống ATS để vượt qua mọi vòng lọc hồ sơ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ARTICLES.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#00B86B] transition-all space-y-3 shadow-2xs group"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {art.category}
                  </span>
                  <span>{art.readTime}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ACCORDION ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-[#00B86B]" />
            <h2 className="text-base font-black text-slate-900">Câu Hỏi Thường Gặp Về AI Matching (FAQ)</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {openFaqIndex === idx && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <AIDisclaimerBanner />
      </main>

      <Footer />
    </div>
  );
}

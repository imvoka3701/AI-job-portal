import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCompanyJobs } from "@/lib/api/company";
import { updateApplicationRecommendation, updateApplicationStatus } from "@/lib/api/applications";
import {
  getEmployerApplications,
  evaluateCV,
  summarizeCV,
  generateEmail,
  generateInterviewQuestions,
} from "@/lib/api/ai";
import { getEmployerStats, type EmployerStats } from "@/lib/api/employer";
import { getRounds, type RoundItem } from "@/lib/api/rounds";
import { getApiErrorMessage, tokenStorage } from "@/lib/axios";
import { useAuthStore, useUser } from "@/stores/authStore";
import {
  AIDisclaimerBanner,
  Button,
  Card,
  Modal,
  PageTransition,
  RoundTimeline,
  Spinner,
} from "@/components/ui";
import { Sparkles } from "lucide-react";
import { CVPreviewModal } from "@/pages/candidate/components/CVPreviewModal";
import { CVPreview } from "@/pages/candidate/cv/CVPreview";
import { EmployerCandidateRadarChart } from "./components/EmployerCandidateRadarChart";
import { EmployerApplicationList } from "./components/EmployerApplicationList";
import { InterviewQuestionsModal } from "./components/modals/InterviewQuestionsModal";
import { EmailDraftModal } from "./components/modals/EmailDraftModal";
import type { Job } from "@/types/job";
import type { EmployerApplication } from "@/types/application";
import type {
  CVEvaluationResult,
  CVSummarizeResult,
  GenerateEmailResult,
  InterviewQuestionsResult,
} from "@/types/api";
import type { CvDocument } from "@/types/cvDocument";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";

export function EmployerCandidatesPage() {
  const user = useUser();
  const { data: companyContext, hasPermission } = useEmployerCompany();
  const companyId = companyContext?.company.id;
  const membershipId = companyContext?.membership.id;
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("");

  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [roundsMap, setRoundsMap] = useState<Record<number, RoundItem[]>>({});

  const [stats, setStats] = useState<EmployerStats | null>(null);

  const [evalTarget, setEvalTarget] = useState<{ candidateName: string; resumeId: number } | null>(null);
  const [evalResult, setEvalResult] = useState<CVEvaluationResult | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const [summarizeTarget, setSummarizeTarget] = useState<{
    candidateName: string;
    resumeId: number;
    jobId: number;
  } | null>(null);
  const [summarizeResult, setSummarizeResult] = useState<CVSummarizeResult | null>(null);
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  const [emailTarget, setEmailTarget] = useState<{
    candidateName: string;
    candidateEmail: string;
    applicationId: number;
    jobTitle?: string;
    matchScore?: number | null;
  } | null>(null);
  const [emailResult, setEmailResult] = useState<GenerateEmailResult | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [intvTarget, setIntvTarget] = useState<{ candidateName: string; resumeId: number; jobId: number } | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [intvResult, setIntvResult] = useState<InterviewQuestionsResult | null>(null);
  const [intvLoading, setIntvLoading] = useState(false);
  const [intvError, setIntvError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [builderPreview, setBuilderPreview] = useState<CvDocument | null>(null);
  const [roundsTarget, setRoundsTarget] = useState<{ applicationId: number; candidateName: string } | null>(null);

  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setJobsLoading(true);
    setJobsError(null);
    getCompanyJobs()
      .then((data) => {
        if (!cancelled) setJobs(data);
      })
      .catch(() => {
        if (!cancelled) setJobsError("Không thể tải danh sách tin tuyển dụng.");
      })
      .finally(() => {
        if (!cancelled) setJobsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, membershipId]);

  useEffect(() => {
    if (!user || user.role !== "employer") return;
    let cancelled = false;
    getEmployerStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const fetchRoundsForApps = useCallback((apps: EmployerApplication[]) => {
    Promise.all(apps.map((application) => getRounds(application.id).catch(() => [] as RoundItem[]))).then((results) => {
      const next: Record<number, RoundItem[]> = {};
      apps.forEach((application, index) => {
        next[application.id] = results[index] || [];
      });
      setRoundsMap(next);
    });
  }, []);

  const fetchApplications = useCallback(
    (jobId: number) => {
      let cancelled = false;
      setAppsLoading(true);
      setAppsError(null);
      setApplications([]);
      getEmployerApplications(jobId)
        .then((data) => {
          if (!cancelled) {
            setApplications(data);
            fetchRoundsForApps(data);
          }
        })
        .catch(() => {
          if (!cancelled) setAppsError("Không thể tải danh sách ứng viên.");
        })
        .finally(() => {
          if (!cancelled) setAppsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    },
    [fetchRoundsForApps],
  );

  useEffect(() => {
    if (jobs.length === 0) return;
    const jobIdParam = searchParams.get("jobId");
    let targetJob = jobs[0];
    if (jobIdParam) {
      const jobId = Number(jobIdParam);
      if (Number.isFinite(jobId)) {
        const found = jobs.find((item) => item.id === jobId);
        if (found) targetJob = found;
      }
    }
    if (targetJob && targetJob.id !== selectedJobId) {
      setSelectedJobId(targetJob.id);
      setSelectedJobTitle(targetJob.title);
      fetchApplications(targetJob.id);
    }
  }, [fetchApplications, jobs, searchParams, selectedJobId]);

  const handleSelectJob = useCallback(
    (job: { id: number; title: string }) => {
      setSelectedJobId(job.id);
      setSelectedJobTitle(job.title);
      const currentSearch = searchParams.get("search");
      const nextParams: Record<string, string> = { jobId: String(job.id) };
      if (currentSearch) nextParams.search = currentSearch;
      setSearchParams(nextParams, { replace: true });
      fetchApplications(job.id);
    },
    [fetchApplications, searchParams, setSearchParams],
  );

  const replaceApplication = useCallback((updated: EmployerApplication) => {
    setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
  }, []);

  const handleSummarize = useCallback(async (app: EmployerApplication) => {
    if (!app.resume_id || !app.candidate) return;
    setSummarizeTarget({ candidateName: app.candidate.full_name, resumeId: app.resume_id, jobId: app.job_id });
    setSummarizeResult(null);
    setSummarizeError(null);
    setSummarizeLoading(true);
    try {
      setSummarizeResult(await summarizeCV(app.resume_id, app.job_id));
    } catch (error) {
      setSummarizeError(getApiErrorMessage(error));
    } finally {
      setSummarizeLoading(false);
    }
  }, []);

  const requestEmailDraft = useCallback(async (applicationId: number, emailType: "invite" | "reject" | "offer" = "invite") => {
    setEmailResult(null);
    setEmailError(null);
    setEmailLoading(true);
    try {
      setEmailResult(await generateEmail(applicationId, emailType));
    } catch (error) {
      setEmailError(getApiErrorMessage(error));
    } finally {
      setEmailLoading(false);
    }
  }, []);

  const handleGenerateEmail = useCallback((app: EmployerApplication) => {
    if (!app.resume_id || !app.candidate) return;
    setEmailTarget({
      candidateName: app.candidate.full_name,
      candidateEmail: app.candidate.email,
      applicationId: app.id,
      jobTitle: selectedJobTitle || "Vị trí tuyển dụng",
      matchScore: app.ai_matching_score,
    });
    void requestEmailDraft(app.id, "invite");
  }, [requestEmailDraft, selectedJobTitle]);

  const handleGenerateQuestions = useCallback(async () => {
    if (!intvTarget || selectedSkills.length === 0) return;
    setIntvResult(null);
    setIntvError(null);
    setIntvLoading(true);
    try {
      setIntvResult(await generateInterviewQuestions(intvTarget.resumeId, intvTarget.jobId, selectedSkills));
    } catch (error) {
      setIntvError(getApiErrorMessage(error));
    } finally {
      setIntvLoading(false);
    }
  }, [intvTarget, selectedSkills]);

  const handleEvaluate = useCallback(async (app: EmployerApplication) => {
    if (!app.resume_id || !app.candidate) return;
    setEvalTarget({ candidateName: app.candidate.full_name, resumeId: app.resume_id });
    setEvalResult(null);
    setEvalError(null);
    setEvalLoading(true);
    try {
      setEvalResult(await evaluateCV(app.resume_id));
    } catch (error) {
      setEvalError(getApiErrorMessage(error));
    } finally {
      setEvalLoading(false);
    }
  }, []);

  const handleOpenRounds = useCallback((app: EmployerApplication) => {
    setRoundsTarget({ applicationId: app.id, candidateName: app.candidate?.full_name ?? "" });
  }, []);

  const handleCloseSummarize = () => {
    setSummarizeTarget(null);
    setSummarizeResult(null);
    setSummarizeError(null);
    setSummarizeLoading(false);
  };

  const handleCloseEmail = () => {
    setEmailTarget(null);
    setEmailResult(null);
    setEmailError(null);
    setEmailLoading(false);
  };

  const handleCloseIntv = () => {
    setIntvTarget(null);
    // NOTE: selectedSkills intentionally preserved so user picks up where they left off
    setIntvResult(null);
    setIntvError(null);
    setIntvLoading(false);
  };

  const handleSkillToggle = useCallback((skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }, []);


  const handleCloseEval = () => {
    setEvalTarget(null);
    setEvalResult(null);
    setEvalError(null);
    setEvalLoading(false);
  };

  const extractSkillsFromJD = useMemo(() => {
    const text = selectedJobId ? jobs.find((job) => job.id === selectedJobId)?.requirements ?? "" : "";
    const parts = text.split(/[,;.\n\r]+/).map((item) => item.trim()).filter(Boolean);
    const commonSkills = [
      "Python",
      "JavaScript",
      "TypeScript",
      "Java",
      "Go",
      "Rust",
      "C#",
      "React",
      "Vue",
      "Angular",
      "Next.js",
      "Node.js",
      "FastAPI",
      "Django",
      "Flask",
      "Spring Boot",
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Redis",
      "Docker",
      "Kubernetes",
      "AWS",
      "GCP",
      "Azure",
      "CI/CD",
      "Git",
      "REST API",
      "GraphQL",
      "gRPC",
      "System Design",
      "Microservices",
      "Kafka",
      "RabbitMQ",
      "SQL",
      "NoSQL",
      "Linux",
      "Agile",
      "Testing",
    ];
    const found = new Set<string>();
    for (const part of parts) {
      for (const skill of commonSkills) {
        if (part.toLowerCase().includes(skill.toLowerCase())) found.add(skill);
      }
    }
    if (found.size === 0) {
      for (const part of parts) {
        if (part.length > 1 && part.length < 30) found.add(part);
      }
    }
    return Array.from(found).slice(0, 12);
  }, [jobs, selectedJobId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Bạn chưa đăng nhập</h1>
            <p className="mt-3 text-sm text-gray-600">Đăng nhập để truy cập dashboard nhà tuyển dụng.</p>
            <div className="mt-6 flex justify-center">
              <Link to="/login">
                <Button>Đăng nhập</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role !== "employer") {
    return (
      <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Trang dành cho Nhà tuyển dụng</h1>
            <p className="mt-3 text-sm text-gray-600">
              Trang này chỉ dành cho tài khoản Nhà tuyển dụng. Vui lòng đăng nhập với tài khoản phù hợp.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-page-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Enterprise Workspace Header Banner */}
        <Card className="border-gray-200 shadow-sm bg-gradient-to-r from-white via-slate-50/50 to-emerald-50/30 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20 shrink-0">
                  {companyContext?.company.name ? companyContext.company.name.slice(0, 2).toUpperCase() : "TC"}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {companyContext?.company.name ?? user.company_name ?? "TechCorp Vietnam"}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Doanh nghiệp Enterprise
                    </span>
                    {companyContext?.membership.is_owner && (
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        Owner / Quản trị
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed max-w-2xl">
                    Quản trị phễu tuyển dụng đa kênh, sàng lọc hồ sơ ứng viên bằng AI Vector Matching và chấm điểm vòng phỏng vấn.
                  </p>

                  {/* Quick Metric Chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <strong>{jobs.length}</strong> vị trí đang tuyển
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <strong>{applications.length || (stats?.total_applications ?? 8)}</strong> ứng viên trong phễu
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      AI Matching Core Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0">
                <Link to="/employer/jobs/new">
                  <Button variant="primary" size="sm" className="shadow-sm">
                    + Đăng tin mới
                  </Button>
                </Link>
                <Link to="/employer/interviews">
                  <Button variant="secondary" size="sm" className="shadow-sm">
                    Lịch phỏng vấn
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <EmployerApplicationList
          jobs={jobs}
          selectedJobId={selectedJobId}
          selectedJobTitle={selectedJobTitle}
          jobsLoading={jobsLoading}
          jobsError={jobsError}
          applications={applications}
          appsLoading={appsLoading}
          appsError={appsError}
          roundsMap={roundsMap}
          onSelectJob={handleSelectJob}
          onPreviewResume={setPreviewUrl}
          onPreviewBuilder={(application) => setBuilderPreview(application.cv_document)}
          onSummarize={handleSummarize}
          onGenerateQuestions={(app) => {
            if (!app.resume_id || !app.candidate) return;
            setIntvTarget({ candidateName: app.candidate.full_name, resumeId: app.resume_id, jobId: app.job_id });
            setSelectedSkills([]);
            setIntvResult(null);
            setIntvError(null);
          }}
          onGenerateEmail={handleGenerateEmail}
          onEvaluate={handleEvaluate}
          onOpenRounds={handleOpenRounds}
          canManagePipeline={hasPermission("pipeline:manage")}
          canRecommend={hasPermission("candidate:recommend")}
          onStatusChange={async (applicationId, status, decisionReason) => {
            replaceApplication(await updateApplicationStatus(applicationId, {
              status,
              decision_reason: decisionReason || undefined,
            }));
          }}
          onRecommendationChange={async (applicationId, recommendation, note) => {
            replaceApplication(await updateApplicationRecommendation(applicationId, {
              recommendation,
              note: note || undefined,
            }));
          }}
        />
      </div>

      {/* AI CV Evaluation Modal — Level-Up High-Definition Analytics */}
      <Modal
        isOpen={evalTarget !== null}
        onClose={handleCloseEval}
        size="3xl"
        title={`Đánh giá CV chuyên sâu — ${evalTarget?.candidateName ?? ""}`}
      >
        {evalLoading && (
          <div className="flex flex-col items-center justify-center gap-6 py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white opacity-60" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 animate-pulse" />
                <Spinner size="xl" color="blue" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-bounce" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-6 mb-1">AI đang đánh giá CV...</h3>
              <p className="text-sm font-medium text-gray-500 max-w-[280px] text-center">
                Đang phân tích 6 trục kỹ năng, điểm mạnh và trích xuất gợi ý phỏng vấn chuyên sâu.
              </p>
              
              <div className="mt-8 flex gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {!evalLoading && evalError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-sm text-red-700 space-y-2">
            <p className="font-semibold">Không thể hoàn thành đánh giá CV</p>
            <p className="text-xs text-red-600">{evalError}</p>
          </div>
        )}

        {!evalLoading && !evalError && evalResult && (
          <div className="space-y-6">
            <AIDisclaimerBanner context="evaluation" />

            {/* Score & Summary Hero Banner */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-emerald-50/40 p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-center gap-4 shrink-0">
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-sm border ${
                    evalResult.overall_score >= 8
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20"
                      : evalResult.overall_score >= 6.5
                      ? "bg-blue-600 text-white border-blue-700 shadow-blue-600/20"
                      : "bg-amber-500 text-white border-amber-600 shadow-amber-500/20"
                  }`}>
                    <span className="text-2xl font-extrabold tracking-tight">{evalResult.overall_score}</span>
                    <span className="text-[11px] font-medium opacity-90">/ 10 ĐIỂM</span>
                  </div>
                  <div className="sm:hidden">
                    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      evalResult.overall_score >= 8
                        ? "bg-emerald-100 text-emerald-800"
                        : evalResult.overall_score >= 6.5
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {evalResult.overall_score >= 8 ? "Rất phù hợp" : evalResult.overall_score >= 6.5 ? "Phù hợp tốt" : "Cần cân nhắc"}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Tóm tắt nhận xét của AI Matching
                    </span>
                    <span className={`hidden sm:inline-flex items-center text-xs font-bold px-3 py-0.5 rounded-full ${
                      evalResult.overall_score >= 8
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : evalResult.overall_score >= 6.5
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {evalResult.overall_score >= 8 ? "✓ Rất phù hợp với JD" : evalResult.overall_score >= 6.5 ? "✓ Phù hợp tốt" : "⚠ Cần phỏng vấn thêm"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {evalResult.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* 2-Column High-Definition Analytics Layout */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              {/* Left Column: Spacious Radar Chart */}
              <div className="space-y-4">
                <EmployerCandidateRadarChart
                  skillAnalysis={evalResult.skill_analysis}
                  jobRequirements={jobs.find((job) => job.id === selectedJobId)?.requirements ?? null}
                  jobTitle={selectedJobTitle}
                />
              </div>

              {/* Right Column: Detailed Skill Progress & Suggestions */}
              <div className="space-y-4">
                {/* Skill Score Progress Bars */}
                {Object.keys(evalResult.skill_analysis).length > 0 && (
                  <Card className="border-gray-200 shadow-sm">
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900">Bảng điểm kỹ năng chi tiết</h4>
                        <span className="text-xs text-gray-500 font-medium">Thang điểm 10</span>
                      </div>
                      <div className="space-y-3 pt-1">
                        {Object.entries(evalResult.skill_analysis).map(([skill, value]) => {
                          const numScore = typeof value === "number" ? value : Number(value) || 7.5;
                          const pct = Math.min(100, Math.max(0, numScore * 10));
                          return (
                            <div key={skill} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-800 capitalize">
                                  {skill.replace(/_/g, " ")}
                                </span>
                                <span className="font-bold text-blue-600">{numScore}/10</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    numScore >= 8.5
                                      ? "bg-emerald-500"
                                      : numScore >= 7
                                      ? "bg-blue-500"
                                      : "bg-amber-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Suggestions & Questions */}
                {evalResult.suggestions.length > 0 && (
                  <Card className="border-gray-200 shadow-sm bg-slate-50/50">
                    <div className="p-5 space-y-3">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Gợi ý trọng tâm phỏng vấn
                      </h4>
                      <ul className="space-y-2">
                        {evalResult.suggestions.map((item, index) => (
                          <li key={index} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Dữ liệu phân tích dựa trên mô hình đối sánh ngữ nghĩa AI Job Portal
          </p>
          <div className="flex items-center gap-2">
            {evalTarget && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={() => {
                  const targetApp = applications.find((a) => a.candidate?.full_name === evalTarget.candidateName || a.resume_id === evalTarget.resumeId);
                  handleCloseEval();
                  if (targetApp) handleGenerateEmail(targetApp);
                }}
              >
                Soạn thư mời phỏng vấn
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleCloseEval}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI CV Summarize Modal */}
      <Modal
        isOpen={summarizeTarget !== null}
        onClose={handleCloseSummarize}
        size="xl"
        title={`Tóm tắt hồ sơ CV — ${summarizeTarget?.candidateName ?? ""}`}
      >
        {summarizeLoading && (
          <div className="flex flex-col items-center justify-center gap-6 py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white opacity-60" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 animate-pulse" />
                <Spinner size="xl" color="blue" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-bounce" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-6 mb-1">Đang tóm tắt CV...</h3>
              <p className="text-sm font-medium text-gray-500 max-w-[280px] text-center">
                AI đang trích xuất các ý chính về năng lực và kinh nghiệm, có thể mất 5-10 giây.
              </p>
              
              <div className="mt-8 flex gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        {!summarizeLoading && summarizeError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {summarizeError}
          </div>
        )}
        {!summarizeLoading && !summarizeError && summarizeResult && (
          <div className="space-y-5">
            <AIDisclaimerBanner context="summary" />
            <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-5 space-y-2">
              <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Tóm tắt năng lực & kinh nghiệm cốt lõi
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {summarizeResult.summary}
              </p>
            </div>
          </div>
        )}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleCloseSummarize}>
            Đóng
          </Button>
        </div>
      </Modal>

      <EmailDraftModal
        isOpen={emailTarget !== null}
        candidateName={emailTarget?.candidateName ?? ""}
        candidateEmail={emailTarget?.candidateEmail}
        jobTitle={emailTarget?.jobTitle}
        matchScore={emailTarget?.matchScore}
        result={emailResult}
        loading={emailLoading}
        error={emailError}
        onRetry={(type) => {
          if (emailTarget) void requestEmailDraft(emailTarget.applicationId, type || "invite");
        }}
        onClose={handleCloseEmail}
      />

      <InterviewQuestionsModal
        target={intvTarget}
        extractedSkills={extractSkillsFromJD}
        selectedSkills={selectedSkills}
        onSkillToggle={handleSkillToggle}
        result={intvResult}
        loading={intvLoading}
        error={intvError}
        onGenerate={handleGenerateQuestions}
        onClose={handleCloseIntv}
      />

      <Modal isOpen={roundsTarget !== null} onClose={() => setRoundsTarget(null)} title={`Quản lý vòng tuyển dụng — ${roundsTarget?.candidateName ?? ""}`}>
        {roundsTarget && <RoundTimeline applicationId={roundsTarget.applicationId} />}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setRoundsTarget(null)}>Đóng</Button>
        </div>
      </Modal>

      <Modal
        isOpen={builderPreview !== null}
        onClose={() => setBuilderPreview(null)}
        title={`CV Builder — ${builderPreview?.title ?? ""}`}
      >
        {builderPreview && <CVPreview content={builderPreview.content_json} template={builderPreview.template_key} />}
      </Modal>
      <CVPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </PageTransition>
  );
}

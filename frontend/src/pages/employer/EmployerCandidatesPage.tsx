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

  const [emailTarget, setEmailTarget] = useState<{ candidateName: string; applicationId: number } | null>(null);
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
    const jobIdParam = searchParams.get("jobId");
    if (!jobIdParam) return;
    const jobId = Number(jobIdParam);
    if (!Number.isFinite(jobId)) return;
    const job = jobs.find((item) => item.id === jobId);
    if (job) {
      setSelectedJobId(job.id);
      setSelectedJobTitle(job.title);
      fetchApplications(job.id);
    }
  }, [fetchApplications, jobs, searchParams]);

  const handleSelectJob = useCallback(
    (job: { id: number; title: string }) => {
      setSelectedJobId(job.id);
      setSelectedJobTitle(job.title);
      setSearchParams({ jobId: String(job.id) }, { replace: true });
      fetchApplications(job.id);
    },
    [fetchApplications, setSearchParams],
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

  const requestEmailDraft = useCallback(async (applicationId: number) => {
    setEmailResult(null);
    setEmailError(null);
    setEmailLoading(true);
    try {
      setEmailResult(await generateEmail(applicationId, "invite"));
    } catch (error) {
      setEmailError(getApiErrorMessage(error));
    } finally {
      setEmailLoading(false);
    }
  }, []);

  const handleGenerateEmail = useCallback((app: EmployerApplication) => {
    if (!app.resume_id || !app.candidate) return;
    setEmailTarget({ candidateName: app.candidate.full_name, applicationId: app.id });
    void requestEmailDraft(app.id);
  }, [requestEmailDraft]);

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
    <PageTransition className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-emerald-600">Dashboard ứng viên</p>
            <h1 className="text-3xl font-semibold text-gray-900">
              Xin chào, {user.company_name ?? user.full_name}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Xem ứng viên, đánh giá CV, tạo câu hỏi và theo dõi pipeline trong một màn hình.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/employer/jobs/new">
              <Button variant="primary" size="sm">Đăng tin mới</Button>
            </Link>
            <Link to="/employer/interviews">
              <Button variant="secondary" size="sm">Lịch phỏng vấn</Button>
            </Link>
          </div>
        </div>

        {stats && stats.active_jobs.length > 0 && (
          <Card className="px-4 py-3 border-blue-100 bg-blue-50/50 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
              </span>
              <span className="text-sm text-blue-900 font-medium">
                Có <strong>{stats.total_applications}</strong> ứng viên đang chờ đánh giá
              </span>
            </div>
          </Card>
        )}

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

        {selectedJobId && stats && (
          <EmployerCandidateRadarChart
            skillAnalysis={evalResult?.skill_analysis ?? null}
            jobRequirements={jobs.find((job) => job.id === selectedJobId)?.requirements ?? null}
          />
        )}
      </div>

      <Modal
        isOpen={evalTarget !== null}
        onClose={handleCloseEval}
        title={`Đánh giá CV — ${evalTarget?.candidateName ?? ""}`}
      >
        {evalLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Spinner size="lg" color="blue" label="Đang đánh giá CV..." />
            <span className="text-sm text-gray-500">AI đang phân tích, có thể mất 10-15 giây...</span>
          </div>
        )}

        {!evalLoading && evalError && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{evalError}</div>}

        {!evalLoading && !evalError && evalResult && (
          <div className="space-y-5">
            <AIDisclaimerBanner context="evaluation" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-light border-2 border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary-dark">{evalResult.overall_score}</span>
                <span className="text-xs text-primary">/10</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Điểm tổng quan</p>
                <p className="text-sm text-gray-600">{evalResult.summary}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="space-y-4">
                <Card className="border-gray-200 shadow-sm">
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-gray-900">So sánh kỹ năng</h3>
                    <div className="mt-4 h-[300px]">
                      <EmployerCandidateRadarChart
                        skillAnalysis={evalResult.skill_analysis}
                        jobRequirements={jobs.find((job) => job.id === selectedJobId)?.requirements ?? null}
                      />
                    </div>
                  </div>
                </Card>
              </div>
              <div className="space-y-3">
                {Object.keys(evalResult.skill_analysis).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Phân tích kỹ năng</h3>
                    <div className="grid gap-2">
                      {Object.entries(evalResult.skill_analysis).map(([skill, value]) => (
                        <div key={skill} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">{skill.replace(/_/g, " ")}</span>
                          <span className="text-xs text-gray-500">
                            {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {evalResult.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Gợi ý cải thiện</h3>
                    <ul className="space-y-1.5">
                      {evalResult.suggestions.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-primary mt-0.5 shrink-0 select-none">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleCloseEval}>Đóng</Button>
        </div>
      </Modal>

      <Modal
        isOpen={summarizeTarget !== null}
        onClose={handleCloseSummarize}
        title={`Tóm tắt CV — ${summarizeTarget?.candidateName ?? ""}`}
      >
        {summarizeLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Spinner size="lg" color="blue" label="Đang tóm tắt CV..." />
            <span className="text-sm text-gray-500">AI đang phân tích, có thể mất 10-15 giây...</span>
          </div>
        )}
        {!summarizeLoading && summarizeError && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{summarizeError}</div>}
        {!summarizeLoading && !summarizeError && summarizeResult && (
          <div className="space-y-5">
            <AIDisclaimerBanner context="summary" />
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h3 className="text-sm font-semibold text-blue-700 mb-1">Tóm tắt</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{summarizeResult.summary}</p>
            </div>
          </div>
        )}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleCloseSummarize}>Đóng</Button>
        </div>
      </Modal>

      <EmailDraftModal
        isOpen={emailTarget !== null}
        candidateName={emailTarget?.candidateName ?? ""}
        result={emailResult}
        loading={emailLoading}
        error={emailError}
        onRetry={() => {
          if (emailTarget) void requestEmailDraft(emailTarget.applicationId);
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

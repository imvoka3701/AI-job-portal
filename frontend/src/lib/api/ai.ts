/**
 * AI API service — wraps all AI-related HTTP calls.
 * Each function uses the pre-configured `apiClient` (JWT + error interceptors).
 */
import { apiClient } from "@/lib/axios";
import type {
  AIMatchResult,
  CVEvaluationResult,
  CVSummarizeResult,
  GenerateEmailResult,
  InterviewQuestionsResult,
  RoadmapResult,
} from "@/types/api";
import type { EmployerApplication } from "@/types/application";

export interface CvSummarySuggestion {
  suggestion: string;
  rationale: string;
}
export interface CvExperienceSuggestion {
  bullets: string[];
  rationale: string;
}
export interface CvSkillsSuggestion {
  skills: string[];
  rationale: string;
}

const CV_AI_TIMEOUT_MS = 90_000;

export async function suggestCvSummary(
  cvDocumentId: number,
  currentText: string,
  targetRole: string,
  language: "vi" | "en" = "vi",
): Promise<CvSummarySuggestion> {
  const { data } = await apiClient.post<CvSummarySuggestion>(
    "/ai/cv/suggest-summary",
    {
      cv_document_id: cvDocumentId,
      current_text: currentText,
      target_role: targetRole,
      language,
    },
    { timeout: CV_AI_TIMEOUT_MS },
  );
  return data;
}

export async function rewriteCvExperience(
  cvDocumentId: number,
  experienceText: string,
  targetRole: string,
  language: "vi" | "en" = "vi",
): Promise<CvExperienceSuggestion> {
  const { data } = await apiClient.post<CvExperienceSuggestion>(
    "/ai/cv/rewrite-experience",
    {
      cv_document_id: cvDocumentId,
      experience_text: experienceText,
      target_role: targetRole,
      language,
    },
    { timeout: CV_AI_TIMEOUT_MS },
  );
  return data;
}

export async function suggestCvSkills(
  cvDocumentId: number,
  currentSkills: string[],
  targetRole: string,
  jobId?: number,
  language: "vi" | "en" = "vi",
): Promise<CvSkillsSuggestion> {
  const { data } = await apiClient.post<CvSkillsSuggestion>(
    "/ai/cv/suggest-skills",
    {
      cv_document_id: cvDocumentId,
      current_skills: currentSkills,
      target_role: targetRole,
      job_id: jobId,
      language,
    },
    { timeout: CV_AI_TIMEOUT_MS },
  );
  return data;
}

export interface CoverLetterPayload {
  job_id: number;
  resume_id?: number;
  cv_document_id?: number;
  tone?: "professional" | "confident" | "enthusiastic" | "concise";
  custom_notes?: string;
}

export interface CoverLetterResponse {
  cover_letter: string;
}

/**
 * Generate a personalized cover letter using AI.
 * POST /ai/cover-letter
 */
export async function generateCoverLetter(
  payload: CoverLetterPayload,
): Promise<CoverLetterResponse> {
  const { data } = await apiClient.post<CoverLetterResponse>(
    "/ai/cover-letter",
    payload,
    { timeout: CV_AI_TIMEOUT_MS },
  );
  return data;
}

export interface AIMatchPayload {
  job_id: number;
  resume_id?: number;
  cv_document_id?: number;
}

/**
 * Compute AI matching score between a resume / CV Builder document and a job.
 * POST /ai/match
 */
export async function getAiMatch(
  paramsOrResumeId: number | AIMatchPayload,
  jobId?: number,
): Promise<AIMatchResult> {
  const payload: AIMatchPayload =
    typeof paramsOrResumeId === "number"
      ? { resume_id: paramsOrResumeId, job_id: jobId! }
      : paramsOrResumeId;
  const { data } = await apiClient.post<AIMatchResult>("/ai/match", payload);
  return data;
}

export interface CVEvaluationPayload {
  resume_id?: number;
  cv_document_id?: number;
}

/**
 * Evaluate CV quality using AI.
 * POST /ai/evaluate
 */
export async function evaluateCV(
  resumeIdOrPayload: number | CVEvaluationPayload,
): Promise<CVEvaluationResult> {
  const payload = typeof resumeIdOrPayload === "number" ? { resume_id: resumeIdOrPayload } : resumeIdOrPayload;
  const { data } = await apiClient.post<CVEvaluationResult>("/ai/evaluate", payload);
  return data;
}

export interface RoadmapPayload {
  resume_id?: number;
  cv_document_id?: number;
  target_role: string;
}

/**
 * Generate a personalized career roadmap.
 * POST /ai/roadmap
 */
export async function generateRoadmap(
  resumeIdOrPayload: number | RoadmapPayload,
  targetRole?: string,
): Promise<RoadmapResult> {
  const payload =
    typeof resumeIdOrPayload === "number"
      ? { resume_id: resumeIdOrPayload, target_role: targetRole ?? "" }
      : resumeIdOrPayload;
  const { data } = await apiClient.post<RoadmapResult>("/ai/roadmap", payload);
  return data;
}

export interface CVSummarizePayload {
  resume_id?: number;
  cv_document_id?: number;
  job_id: number;
}

/**
 * Summarize how a CV matches a specific job posting.
 * POST /ai/summarize-cv
 */
export async function summarizeCV(
  resumeIdOrPayload: number | CVSummarizePayload,
  jobId?: number,
): Promise<CVSummarizeResult> {
  const payload =
    typeof resumeIdOrPayload === "number"
      ? { resume_id: resumeIdOrPayload, job_id: jobId! }
      : resumeIdOrPayload;
  const { data } = await apiClient.post<CVSummarizeResult>("/ai/summarize-cv", payload);
  return data;
}

export interface InterviewQuestionsPayload {
  resume_id?: number;
  cv_document_id?: number;
  job_id: number;
  skills_to_assess: string[];
}

/**
 * Generate targeted interview questions for specific skills.
 * POST /ai/interview-questions
 */
export async function generateInterviewQuestions(
  resumeIdOrPayload: number | InterviewQuestionsPayload,
  jobId?: number,
  skillsToAssess?: string[],
): Promise<InterviewQuestionsResult> {
  const payload =
    typeof resumeIdOrPayload === "number"
      ? { resume_id: resumeIdOrPayload, job_id: jobId!, skills_to_assess: skillsToAssess ?? [] }
      : resumeIdOrPayload;
  const { data } = await apiClient.post<InterviewQuestionsResult>(
    "/ai/interview-questions",
    payload,
  );
  return data;
}

/**
 * Generate a draft email for an applicant (invite/reject/offer).
 * POST /ai/generate-email
 */
export async function generateEmail(
  applicationId: number,
  emailType: "invite" | "reject" | "offer",
  tone?: "formal" | "friendly" | "concise",
  customPrompt?: string,
): Promise<GenerateEmailResult> {
  const { data } = await apiClient.post<GenerateEmailResult>(
    "/ai/generate-email",
    {
      application_id: applicationId,
      email_type: emailType,
      tone,
      custom_prompt: customPrompt,
    },
  );
  return data;
}

export async function getEmployerApplications(
  jobId: number,
): Promise<EmployerApplication[]> {
  const { data } = await apiClient.get<EmployerApplication[]>(
    `/applications/employer/jobs/${jobId}`,
  );
  return data;
}


// ── Job Recommendations ─────────────────────────────────────────────────────

export interface RecommendedJob {
  job_id: number;
  title: string;
  company_name: string | null;
  location: string | null;
  experience_level: string;
  match_score: number;
  match_reason: string;
}

export interface JobRecommendationResponse {
  resume_id?: number | null;
  cv_document_id?: number | null;
  industry_detected: string;
  total_matched: number;
  recommendations: RecommendedJob[];
}

export interface JobRecommendationParams {
  resume_id?: number;
  cv_document_id?: number;
  limit?: number;
}

/**
 * Get AI-recommended jobs for a candidate's resume or CV Builder document.
 * GET /ai/recommend-jobs?resume_id=X&limit=Y or ?cv_document_id=Z&limit=Y
 */
export async function getRecommendedJobs(
  resumeIdOrParams: number | JobRecommendationParams,
  limit: number = 20,
): Promise<JobRecommendationResponse> {
  const params =
    typeof resumeIdOrParams === "number"
      ? { resume_id: resumeIdOrParams, limit }
      : { limit: 20, ...resumeIdOrParams };
  const { data } = await apiClient.get<JobRecommendationResponse>(
    "/ai/recommend-jobs",
    { params },
  );
  return data;
}


// ── Direction 3: Skill Gap Analysis ──────────────────────────────────────────

export interface SkillGapItem {
  name: string;
  category: "have" | "needs_improvement" | "missing";
  priority?: "critical" | "recommended" | "nice_to_have" | null;
  note?: string | null;
}

export interface SkillGapResult {
  job_title: string;
  overall_fit: string;
  overall_score: number;
  skills: SkillGapItem[];
  learning_path: string[];
  summary: string;
}

export interface SkillGapParams {
  job_id: number;
  resume_id?: number;
  cv_document_id?: number;
}

/**
 * Phân tích Skill Gap: so sánh kỹ năng ứng viên với yêu cầu JD.
 * POST /ai/skill-gap
 */
export async function analyseSkillGap(params: SkillGapParams): Promise<SkillGapResult> {
  const { data } = await apiClient.post<SkillGapResult>(
    "/ai/skill-gap",
    params,
    { timeout: 90_000 },
  );
  return data;
}

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

/**
 * Compute AI matching score between a resume and a job.
 * POST /ai/match
 */
export async function getAiMatch(
  resumeId: number,
  jobId: number,
): Promise<AIMatchResult> {
  const { data } = await apiClient.post<AIMatchResult>("/ai/match", {
    resume_id: resumeId,
    job_id: jobId,
  });
  return data;
}

/**
 * Evaluate CV quality using AI.
 * POST /ai/evaluate
 */
export async function evaluateCV(
  resumeId: number,
): Promise<CVEvaluationResult> {
  const { data } = await apiClient.post<CVEvaluationResult>("/ai/evaluate", {
    resume_id: resumeId,
  });
  return data;
}

/**
 * Generate a personalized career roadmap.
 * POST /ai/roadmap
 */
export async function generateRoadmap(
  resumeId: number,
  targetRole: string,
): Promise<RoadmapResult> {
  const { data } = await apiClient.post<RoadmapResult>("/ai/roadmap", {
    resume_id: resumeId,
    target_role: targetRole,
  });
  return data;
}

/**
 * Get applications for an employer's job with AI match scores.
 * GET /applications/employer/jobs/{job_id}
 */
/**
 * Summarize how a CV matches a specific job posting.
 * POST /ai/summarize-cv
 */
export async function summarizeCV(
  resumeId: number,
  jobId: number,
): Promise<CVSummarizeResult> {
  const { data } = await apiClient.post<CVSummarizeResult>("/ai/summarize-cv", {
    resume_id: resumeId,
    job_id: jobId,
  });
  return data;
}

/**
 * Get applications for an employer's job with AI match scores.
 * GET /applications/employer/jobs/{job_id}
 */
/**
 * Generate targeted interview questions for specific skills.
 * POST /ai/interview-questions
 */
export async function generateInterviewQuestions(
  resumeId: number,
  jobId: number,
  skillsToAssess: string[],
): Promise<InterviewQuestionsResult> {
  const { data } = await apiClient.post<InterviewQuestionsResult>(
    "/ai/interview-questions",
    { resume_id: resumeId, job_id: jobId, skills_to_assess: skillsToAssess },
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
): Promise<GenerateEmailResult> {
  const { data } = await apiClient.post<GenerateEmailResult>(
    "/ai/generate-email",
    {
      application_id: applicationId,
      email_type: emailType,
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

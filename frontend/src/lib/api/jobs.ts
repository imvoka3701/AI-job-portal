/**
 * Jobs API service — wraps all HTTP calls related to job listings.
 * All functions use the pre-configured `apiClient` (JWT + error interceptors).
 */
import { apiClient } from "@/lib/axios";
import type { Job, JobListResponse, JobCreatePayload } from "@/types/job";
import type { AIMatchResult } from "@/types/api";
import type { Application, ApplicationCreatePayload } from "@/types/application";

// ─── Filter params ────────────────────────────────────────────────────────────
export interface JobFilters {
  keyword?: string;
  /** @deprecated use locations */
  location?: string;
  locations?: string[];
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  category_id?: number;
  employer_id?: number;
  company_id?: number;
}

export interface GetJobsParams extends JobFilters {
  page?: number;
  page_size?: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch paginated job listings with optional filters.
 * GET /jobs?keyword=...&page=1&page_size=10
 */
export async function getJobs(params: GetJobsParams = {}): Promise<JobListResponse> {
  const { location, locations, ...rest } = params;
  const resolvedLocations =
    locations ?? (location ? [location] : undefined);

  const query: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== "" && value !== null) {
      query[key] = value as string | number;
    }
  }
  if (resolvedLocations?.length) {
    query.locations = resolvedLocations.join(",");
  }

  const { data } = await apiClient.get<JobListResponse>("/jobs", { params: query });
  return data;
}

/**
 * Fetch a single job detail.
 * GET /jobs/:id
 */
export async function getJobById(jobId: number): Promise<Job> {
  const { data } = await apiClient.get<Job>(`/jobs/${jobId}`);
  return data;
}

export async function createJob(payload: JobCreatePayload): Promise<Job> {
  const { data } = await apiClient.post<Job>("/jobs", payload);
  return data;
}

export async function updateJob(jobId: number, payload: Partial<JobCreatePayload> & { is_active?: boolean }): Promise<Job> {
  const { data } = await apiClient.put<Job>(`/jobs/${jobId}`, payload);
  return data;
}

export async function deleteJob(jobId: number): Promise<void> {
  await apiClient.delete(`/jobs/${jobId}`);
}

/**
 * Submit a job application.
 * POST /applications
 */
export async function applyJob(payload: ApplicationCreatePayload): Promise<Application> {
  const { data } = await apiClient.post<Application>("/applications", payload);
  return data;
}

/**
 * Get AI matching score for a specific job (requires auth).
 * POST /ai/match
 * @deprecated Use getAiMatch from @/lib/api/ai instead — this wrapper
 *             was missing the required resume_id parameter.
 */
export async function getAiMatch(jobId: number, resumeId?: number): Promise<AIMatchResult> {
  const { data } = await apiClient.post<AIMatchResult>("/ai/match", {
    job_id: jobId,
    resume_id: resumeId,
  });
  return data;
}


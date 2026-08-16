/**
 * Resumes API service — upload and manage candidate CVs.
 */
import { apiClient } from "@/lib/axios";
import type { Resume } from "@/types/resume";

/**
 * Upload a PDF resume file.
 * POST /resumes/upload (multipart/form-data)
 */
export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<Resume>("/resumes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000, // Allow up to 60s for embedding generation
  });
  return data;
}

/**
 * Fetch all resumes belonging to the current user.
 * GET /resumes/me
 */
export async function getMyResumes(): Promise<Resume[]> {
  const { data } = await apiClient.get<Resume[]>("/resumes/me");
  return data;
}

/**
 * Delete a resume by ID.
 * DELETE /resumes/:id
 */
export async function deleteResume(resumeId: number): Promise<void> {
  await apiClient.delete(`/resumes/${resumeId}`);
}

/**
 * Evaluate a resume using AI.
 * POST /resumes/:id/evaluate
 */
export async function evaluateResume(resumeId: number): Promise<Resume> {
  const { data } = await apiClient.post<Resume>(`/resumes/${resumeId}/evaluate`, undefined, {
    timeout: 120_000, // Deepseek might take a while
  });
  return data;
}

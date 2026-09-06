/**
 * AI Job Description (JD) Generation API client.
 * Calls backend POST /ai/generate-jd with Company Context & Multi-Industry support.
 */
import { apiClient } from "@/lib/axios";

export interface GenerateJDRequest {
  job_title: string;
  industry?: string;
  category_id?: number;
  experience_level?: string;
  job_type?: string;
  tone?: string;
  key_notes?: string;
  location?: string;
}

export interface GenerateJDResponse {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  suggested_skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  job_type: string;
  experience_level: string;
  suggested_category_id: number | null;
}

export async function generateJobDescription(
  payload: GenerateJDRequest,
): Promise<GenerateJDResponse> {
  const { data } = await apiClient.post<GenerateJDResponse>(
    "/ai/generate-jd",
    payload,
    { timeout: 60_000 },
  );
  return data;
}

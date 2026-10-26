import { apiClient } from "@/lib/axios";
import type { Application, ApplicationStatus, EmployerApplication } from "@/types/application";

export interface CandidateInterviewRound {
  round_id: number;
  scheduled_at: string;
  location: string | null;
  round_name: string;
  round_type: string;
  status: string;
  job_title: string;
  company_name: string;
}

export async function getMyApplications(): Promise<Application[]> {
  const { data } = await apiClient.get<Application[]>("/applications/me");
  return data;
}

export async function getMyScheduledInterviews(): Promise<CandidateInterviewRound[]> {
  const { data } = await apiClient.get<CandidateInterviewRound[]>("/applications/me/interviews");
  return data;
}

export async function updateApplicationStatus(
  applicationId: number,
  payload: { status: ApplicationStatus; decision_reason?: string },
): Promise<EmployerApplication> {
  const { data } = await apiClient.patch<EmployerApplication>(
    `/applications/${applicationId}`,
    payload,
  );
  return data;
}

export async function updateApplicationRecommendation(
  applicationId: number,
  payload: {
    recommendation: "recommended" | "not_recommended" | "needs_more_review";
    note?: string;
  },
): Promise<EmployerApplication> {
  const { data } = await apiClient.put<EmployerApplication>(
    `/applications/${applicationId}/recommendation`,
    payload,
  );
  return data;
}

export async function withdrawApplication(applicationId: number): Promise<void> {
  await apiClient.delete(`/applications/${applicationId}`);
}

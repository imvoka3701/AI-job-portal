import { apiClient } from "@/lib/axios";
import type { Application, ApplicationStatus, EmployerApplication } from "@/types/application";

export async function getMyApplications(): Promise<Application[]> {
  const { data } = await apiClient.get<Application[]>("/applications/me");
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

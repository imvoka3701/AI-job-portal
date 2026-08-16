import { apiClient } from "@/lib/axios";
import type {
  RecruitmentRequest,
  RecruitmentRequestPage,
  RecruitmentRequestPayload,
  RecruitmentRequestStatus,
} from "@/types/company";


export async function getRecruitmentRequests(params: {
  status?: RecruitmentRequestStatus;
  department_id?: number;
  page?: number;
  page_size?: number;
} = {}): Promise<RecruitmentRequestPage> {
  const { data } = await apiClient.get<RecruitmentRequestPage>(
    "/employer/recruitment-requests",
    { params },
  );
  return data;
}

export async function getRecruitmentRequest(requestId: number): Promise<RecruitmentRequest> {
  const { data } = await apiClient.get<RecruitmentRequest>(
    `/employer/recruitment-requests/${requestId}`,
  );
  return data;
}

export async function createRecruitmentRequest(
  payload: RecruitmentRequestPayload,
): Promise<RecruitmentRequest> {
  const { data } = await apiClient.post<RecruitmentRequest>(
    "/employer/recruitment-requests",
    payload,
  );
  return data;
}

export async function updateRecruitmentRequest(
  requestId: number,
  payload: Partial<RecruitmentRequestPayload>,
): Promise<RecruitmentRequest> {
  const { data } = await apiClient.patch<RecruitmentRequest>(
    `/employer/recruitment-requests/${requestId}`,
    payload,
  );
  return data;
}

export async function submitRecruitmentRequest(requestId: number): Promise<RecruitmentRequest> {
  const { data } = await apiClient.post<RecruitmentRequest>(
    `/employer/recruitment-requests/${requestId}/submit`,
  );
  return data;
}

export async function reviewRecruitmentRequest(
  requestId: number,
  decision: "approved" | "rejected",
  note?: string,
): Promise<RecruitmentRequest> {
  const { data } = await apiClient.post<RecruitmentRequest>(
    `/employer/recruitment-requests/${requestId}/review`,
    { decision, note },
  );
  return data;
}

export async function cancelRecruitmentRequest(requestId: number): Promise<RecruitmentRequest> {
  const { data } = await apiClient.post<RecruitmentRequest>(
    `/employer/recruitment-requests/${requestId}/cancel`,
  );
  return data;
}

import { apiClient } from "@/lib/axios";

export type FeedbackType =
  | "bug_report"
  | "feature_request"
  | "ai_experience"
  | "job_report"
  | "general";

export type FeedbackStatus = "new" | "in_progress" | "resolved" | "rejected";
export type FeedbackPriority = "low" | "medium" | "high" | "urgent";
export type UserRoleType = "candidate" | "employer" | "guest";

export interface UserFeedback {
  id: number;
  user_id: number | null;
  user_role: UserRoleType;
  sender_name: string;
  sender_email: string;
  sender_phone?: string | null;
  feedback_type: FeedbackType;
  title: string;
  content: string;
  rating?: number | null;
  target_id?: string | null;
  target_type?: string | null;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  admin_notes?: string | null;
  admin_response?: string | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreatePayload {
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  feedback_type: FeedbackType;
  title: string;
  content: string;
  rating?: number;
  target_id?: string;
  target_type?: string;
}

export interface FeedbackUpdateAdminPayload {
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  admin_notes?: string;
  admin_response?: string;
}

export interface FeedbackListResponse {
  items: UserFeedback[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FeedbackStatsResponse {
  total_feedbacks: number;
  pending_feedbacks: number;
  in_progress_feedbacks: number;
  resolved_feedbacks: number;
  avg_csat_rating?: number | null;
  by_role: Record<string, number>;
  by_type: Record<string, number>;
}

export interface FeedbackFilterParams {
  user_role?: string;
  feedback_type?: string;
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

/** Public / User submit feedback */
export async function submitFeedback(payload: FeedbackCreatePayload): Promise<UserFeedback> {
  const { data } = await apiClient.post<UserFeedback>("/feedback", payload);
  return data;
}

/** Admin get feedback list */
export async function getAdminFeedbacks(
  params: FeedbackFilterParams = {}
): Promise<FeedbackListResponse> {
  const { data } = await apiClient.get<FeedbackListResponse>("/admin/feedback", { params });
  return data;
}

/** Admin get feedback stats */
export async function getAdminFeedbackStats(): Promise<FeedbackStatsResponse> {
  const { data } = await apiClient.get<FeedbackStatsResponse>("/admin/feedback/stats");
  return data;
}

/** Admin get feedback detail */
export async function getAdminFeedbackDetail(id: number): Promise<UserFeedback> {
  const { data } = await apiClient.get<UserFeedback>(`/admin/feedback/${id}`);
  return data;
}

/** Admin update feedback */
export async function updateAdminFeedback(
  id: number,
  payload: FeedbackUpdateAdminPayload
): Promise<UserFeedback> {
  const { data } = await apiClient.patch<UserFeedback>(`/admin/feedback/${id}`, payload);
  return data;
}

/**
 * Admin API service — system-wide management endpoints.
 */
import { apiClient } from "@/lib/axios";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_candidates: number;
  total_employers: number;
  total_active_jobs: number;
  total_applications: number;
  new_users_last_30d: { date: string; count: number }[];
  new_applications_last_30d: { date: string; count: number }[];
  candidate_source_pct: Record<string, number>;
  funnel: { round_type: string; round_name: string; entered: number; passed: number; pass_rate: number }[];
  time_to_hire_avg_days: number | null;
}

export interface CompanySummary {
  id: number;
  email: string;
  full_name: string;
  company_name: string | null;
  company_description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminJobItem {
  id: number;
  title: string;
  job_type: string;
  experience_level: string;
  location: string | null;
  is_active: boolean;
  employer_id: number;
  company_name: string | null;
  employer_email: string;
  created_at: string;
}

export interface AdminUserItem {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  company_name: string | null;
  created_at: string;
}

export interface AdminAuditLogItem {
  id: number;
  actor_user_id: number | null;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  details_json: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ── API Functions ──────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/admin/stats");
  return data;
}

export async function getCompanies(
  params: { keyword?: string; is_active?: boolean } = {},
): Promise<CompanySummary[]> {
  const { data } = await apiClient.get<CompanySummary[]>("/admin/companies", {
    params,
  });
  return data;
}

export async function approveCompany(id: number): Promise<CompanySummary> {
  const { data } = await apiClient.patch<CompanySummary>(
    `/admin/companies/${id}/approve`,
  );
  return data;
}

export async function rejectCompany(id: number): Promise<CompanySummary> {
  const { data } = await apiClient.patch<CompanySummary>(
    `/admin/companies/${id}/reject`,
  );
  return data;
}

export async function getAdminJobs(
  params: {
    keyword?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  } = {},
): Promise<PaginatedResponse<AdminJobItem>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminJobItem>>(
    "/admin/jobs",
    { params },
  );
  return data;
}

export async function deleteJob(jobId: number): Promise<void> {
  await apiClient.delete(`/admin/jobs/${jobId}`);
}

export async function setAdminJobStatus(
  jobId: number,
  isActive: boolean,
): Promise<AdminJobItem> {
  const { data } = await apiClient.patch<AdminJobItem>(
    `/admin/jobs/${jobId}/status`,
    { is_active: isActive },
  );
  return data;
}

export async function getAdminUsers(
  params: {
    keyword?: string;
    role?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  } = {},
): Promise<PaginatedResponse<AdminUserItem>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminUserItem>>(
    "/admin/users",
    { params },
  );
  return data;
}

export async function getAdminAuditLogs(
  params: {
    action?: string;
    target_type?: string;
    page?: number;
    page_size?: number;
  } = {},
): Promise<PaginatedResponse<AdminAuditLogItem>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminAuditLogItem>>(
    "/admin/audit-logs",
    { params },
  );
  return data;
}

export interface StaleJobAlert {
  job_id: number;
  title: string;
  company_name: string;
  days_inactive: number;
}

export interface OverdueInterviewAlert {
  round_id: number;
  candidate_name: string;
  job_title: string;
  company_name: string;
  days_overdue: number;
}

export interface PendingActionAlert {
  application_id: number;
  candidate_name: string;
  job_title: string;
  company_name: string;
  days_pending: number;
}

export interface AdminAlertsSummary {
  ai_errors_24h: number;
  stale_jobs: StaleJobAlert[];
  overdue_interviews: OverdueInterviewAlert[];
  pending_actions: PendingActionAlert[];
}

export async function getAdminAlerts(): Promise<AdminAlertsSummary> {
  const { data } = await apiClient.get<AdminAlertsSummary>("/admin/alerts");
  return data;
}

export async function toggleUserStatus(
  userId: number,
  isActive: boolean,
): Promise<AdminUserItem> {
  const { data } = await apiClient.patch<AdminUserItem>(
    `/admin/users/${userId}/status`,
    { is_active: isActive },
  );
  return data;
}



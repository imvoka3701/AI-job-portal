/**
 * Employer API service — stats and dashboard aggregations.
 */
import { apiClient } from "@/lib/axios";

export interface FunnelStep {
  round_type: string;
  round_name: string;
  entered: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  pass_rate: number;
}

export interface EmployerStats {
  total_jobs: number;
  total_applications: number;
  avg_ai_match: number | null;
  applications_over_time: { date: string; count: number }[];
  active_jobs: ActiveJobSummary[];
  funnel?: FunnelStep[];
  time_to_hire_avg_days?: number | null;
}

export interface ActiveJobSummary {
  id: number;
  title: string;
  job_type: string;
  experience_level: string;
  location: string | null;
  created_at: string;
  applicant_count: number;
  avg_ai_match: number | null;
}

/**
 * Fetch employer dashboard statistics (KPIs, chart data, active jobs).
 * GET /employer/stats
 */
export async function getEmployerStats(): Promise<EmployerStats> {
  const { data } = await apiClient.get<EmployerStats>("/employer/stats");
  return data;
}


// ── Company Settings ─────────────────────────────────────────────────────────

export interface CompanySettings {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  address: string | null;
  tax_code: string | null;
  industry: string | null;
  company_size: string | null;
  social_links: Record<string, string> | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
}

export type CompanySettingsUpdatePayload = Partial<Omit<CompanySettings, "id">>;

/**
 * GET /employer/settings — Fetch company profile settings.
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  const { data } = await apiClient.get<CompanySettings>("/employer/settings");
  return data;
}

/**
 * PATCH /employer/settings — Update company profile settings.
 */
export async function updateCompanySettings(
  payload: CompanySettingsUpdatePayload,
): Promise<CompanySettings> {
  const { data } = await apiClient.patch<CompanySettings>(
    "/employer/settings",
    payload,
  );
  return data;
}

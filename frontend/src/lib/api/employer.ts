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

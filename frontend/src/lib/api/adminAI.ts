/**
 * Admin AI Control Panel API — prompt management & call log endpoints.
 */
import { apiClient } from "@/lib/axios";

// Types

export type AIFeature =
  | "cv_evaluate"
  | "roadmap"
  | "summarize_cv"
  | "interview_questions"
  | "generate_email";

export interface AIPromptConfig {
  id: number;
  feature: AIFeature;
  system_prompt: string;
  user_prompt_template: string | null;
  is_active: boolean;
  updated_by: number | null;
  updated_by_name: string | null;
  updated_at: string;
  created_at: string;
}

export interface AIPromptUpdatePayload {
  system_prompt: string;
  user_prompt_template?: string | null;
}

export interface AIPromptTestResult {
  feature: AIFeature;
  sample_input: string;
  ai_response: string;
  duration_ms: number;
}

export interface AICallLog {
  id: number;
  feature: string;
  user_id: number | null;
  related_id: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  status: "success" | "failed" | "retried_success";
  error_message: string | null;
  duration_ms: number;
  created_at: string;
}

export interface PaginatedLogsResponse {
  items: AICallLog[];
  total: number;
  page: number;
  page_size: number;
}

export interface AIStatsByFeature {
  feature: string;
  total_calls: number;
  success_calls: number;
  failed_calls: number;
  error_rate_pct: number;
  total_cost_usd: number;
}

export interface AIStatsResponse {
  total_calls_today: number;
  total_calls_week: number;
  total_cost_today_usd: number;
  total_cost_week_usd: number;
  total_cost_month_usd: number;
  error_rate_pct: number;
  by_feature: AIStatsByFeature[];
}

export interface AILogFilters {
  feature?: AIFeature;
  status?: "success" | "failed" | "retried_success";
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

// API Functions

export async function getAIPrompts(): Promise<AIPromptConfig[]> {
  const { data } = await apiClient.get<AIPromptConfig[]>("/admin/ai/prompts");
  return data;
}

export async function updateAIPrompt(
  feature: AIFeature,
  payload: AIPromptUpdatePayload,
): Promise<AIPromptConfig> {
  const { data } = await apiClient.patch<AIPromptConfig>(
    `/admin/ai/prompts/${feature}`,
    payload,
  );
  return data;
}

export async function testAIPrompt(
  feature: AIFeature,
  payload: AIPromptUpdatePayload,
): Promise<AIPromptTestResult> {
  const { data } = await apiClient.post<AIPromptTestResult>(
    `/admin/ai/prompts/${feature}/test`,
    payload,
  );
  return data;
}

export async function getAICallLogs(
  filters: AILogFilters = {},
): Promise<PaginatedLogsResponse> {
  const params = new URLSearchParams();
  if (filters.feature) params.set("feature", filters.feature);
  if (filters.status) params.set("status", filters.status);
  if (filters.from_date) params.set("from_date", filters.from_date);
  if (filters.to_date) params.set("to_date", filters.to_date);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.page_size) params.set("page_size", String(filters.page_size));
  const { data } = await apiClient.get<PaginatedLogsResponse>(
    `/admin/ai/logs?${params.toString()}`,
  );
  return data;
}

export async function getAIStats(): Promise<AIStatsResponse> {
  const { data } = await apiClient.get<AIStatsResponse>("/admin/ai/stats");
  return data;
}
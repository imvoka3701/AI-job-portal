/**
 * Admin RAG Governance & Vector Control API client.
 * Provides live observability, algorithm runtime tuning, batch reindexing, and audit log exploration.
 */

import { apiClient } from "@/lib/axios";

export interface RAGVectorStats {
  total_chunks: number;
  resume_chunks: number;
  cv_document_chunks: number;
  job_chunks: number;
  total_resumes: number;
  indexed_resumes: number;
  total_cv_documents: number;
  indexed_cv_documents: number;
  total_jobs: number;
  indexed_jobs: number;
  overall_coverage_pct: number;
  is_rag_enabled: boolean;
  hybrid_alpha_dense: number;
  hybrid_alpha_sparse: number;
  default_min_score: number;
  total_searches_today: number;
  total_searches_week: number;
  avg_latency_ms: number;
  daily_search_trends: Array<{
    date: string;
    searches: number;
    avg_latency_ms: number;
  }>;
  top_searched_queries: Array<{
    query: string;
    count: number;
  }>;
}

export interface RAGRuntimeConfig {
  is_rag_enabled: boolean;
  hybrid_alpha_dense: number;
  hybrid_alpha_sparse: number;
  default_min_score: number;
  default_top_k: number;
  maintenance_message: string;
  updated_at: string;
  updated_by_email: string | null;
}

export interface RAGRuntimeConfigUpdatePayload {
  is_rag_enabled?: boolean;
  hybrid_alpha_dense?: number;
  hybrid_alpha_sparse?: number;
  default_min_score?: number;
  default_top_k?: number;
  maintenance_message?: string;
}

export interface RAGSearchLogEntry {
  id: number;
  timestamp: string;
  user_id: number | null;
  user_email: string | null;
  company_id: number | null;
  company_name: string | null;
  query: string;
  job_id: number | null;
  job_title: string | null;
  section_types: string[] | null;
  min_score: number;
  results_count: number;
  duration_ms: number;
  max_hybrid_score: number;
  status: "success" | "empty" | "error";
}

export interface PaginatedSearchLogsResponse {
  items: RAGSearchLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

export interface BatchReindexPayload {
  scope: "all" | "resume" | "cv_document" | "job";
}

export interface BatchReindexResponse {
  status: string;
  scope: string;
  indexed_chunks_count: number;
  message: string;
}

export async function getAdminRAGStats(): Promise<RAGVectorStats> {
  const res = await apiClient.get<RAGVectorStats>("/admin/rag/stats");
  return res.data;
}

export async function getAdminRAGConfig(): Promise<RAGRuntimeConfig> {
  const res = await apiClient.get<RAGRuntimeConfig>("/admin/rag/config");
  return res.data;
}

export async function updateAdminRAGConfig(
  payload: RAGRuntimeConfigUpdatePayload
): Promise<RAGRuntimeConfig> {
  const res = await apiClient.patch<RAGRuntimeConfig>("/admin/rag/config", payload);
  return res.data;
}

export async function triggerAdminRAGReindex(
  payload: BatchReindexPayload
): Promise<BatchReindexResponse> {
  const res = await apiClient.post<BatchReindexResponse>(
    "/admin/rag/reindex-batch",
    payload
  );
  return res.data;
}

export async function getAdminRAGSearchLogs(params?: {
  page?: number;
  page_size?: number;
  q?: string;
  min_latency?: number;
}): Promise<PaginatedSearchLogsResponse> {
  const res = await apiClient.get<PaginatedSearchLogsResponse>("/admin/rag/search-logs", {
    params,
  });
  return res.data;
}

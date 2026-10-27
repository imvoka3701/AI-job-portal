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
  chunk_size?: number;
  chunk_overlap?: number;
  min_chunk_length?: number;
  chunking_strategy?: string;
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
  chunk_size: number;
  chunk_overlap: number;
  min_chunk_length: number;
  chunking_strategy: string;
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
  chunk_size?: number;
  chunk_overlap?: number;
  min_chunk_length?: number;
  chunking_strategy?: string;
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

// ── Control Plane V2: Simulation, Granular Surgery & Orphan Diagnostics ─────────

export interface SimulateChunkItem {
  chunk_index: number;
  section_type: string;
  char_count: number;
  word_count: number;
  preview: string;
  content: string;
  metadata: Record<string, any>;
}

export interface SimulateChunkingPayload {
  document_type: "cv_document" | "resume" | "job";
  text?: string;
  content_json?: Record<string, any>;
  chunk_size?: number;
  chunk_overlap?: number;
  min_chunk_length?: number;
}

export interface SimulateChunkingResponse {
  document_type: string;
  total_chunks: number;
  total_characters?: number;
  average_chunk_size: number;
  effective_chunk_size: number;
  effective_chunk_overlap: number;
  effective_min_length: number;
  warnings: string[];
  chunks: SimulateChunkItem[];
}

export interface DocumentChunkDetail {
  id: number;
  chunk_index: number;
  section_type: string;
  char_count: number;
  content: string;
  has_embedding: boolean;
  created_at?: string | null;
  metadata?: Record<string, any> | null;
}

export interface DocumentChunksResponse {
  document_type: string;
  document_id: number;
  document_title: string;
  owner_email?: string | null;
  is_validated: boolean;
  status?: string | null;
  total_chunks: number;
  chunks: DocumentChunkDetail[];
}

export interface DocumentReindexResponse {
  status: string;
  document_type: string;
  document_id: number;
  indexed_chunks_count: number;
  message: string;
}

export interface DocumentPurgeResponse {
  status: string;
  document_type: string;
  document_id: number;
  chunks_deleted: number;
}

export interface OrphanStatsResponse {
  total_orphans: number;
  orphan_resume_chunks: number;
  orphan_cv_document_chunks: number;
  orphan_job_chunks: number;
  orphan_chunk_ids: number[];
}

export interface PurgeOrphansResponse {
  status: string;
  purged_count: number;
  message: string;
}

export async function simulateAdminRAGChunking(
  payload: SimulateChunkingPayload
): Promise<SimulateChunkingResponse> {
  const res = await apiClient.post<SimulateChunkingResponse>(
    "/admin/rag/simulate-chunking",
    payload
  );
  return res.data;
}

export async function getAdminRAGDocumentChunks(
  document_type: string,
  document_id: number
): Promise<DocumentChunksResponse> {
  const res = await apiClient.get<DocumentChunksResponse>(
    `/admin/rag/documents/${document_type}/${document_id}/chunks`
  );
  return res.data;
}

export async function reindexAdminRAGDocument(
  document_type: string,
  document_id: number
): Promise<DocumentReindexResponse> {
  const res = await apiClient.post<DocumentReindexResponse>(
    `/admin/rag/documents/${document_type}/${document_id}/reindex`
  );
  return res.data;
}

export async function purgeAdminRAGDocumentChunks(
  document_type: string,
  document_id: number
): Promise<DocumentPurgeResponse> {
  const res = await apiClient.delete<DocumentPurgeResponse>(
    `/admin/rag/documents/${document_type}/${document_id}/chunks`
  );
  return res.data;
}

export async function getAdminRAGOrphanStats(): Promise<OrphanStatsResponse> {
  const res = await apiClient.get<OrphanStatsResponse>("/admin/rag/orphans");
  return res.data;
}

export async function purgeAdminRAGOrphans(): Promise<PurgeOrphansResponse> {
  const res = await apiClient.post<PurgeOrphansResponse>("/admin/rag/purge-orphans");
  return res.data;
}


/**
 * RAG API Client — Semantic Hybrid Search, Grounded Interview Question Generation, and Indexing.
 * Implements Chapter 7: 3-Tier AI Data Architecture.
 */

import { apiClient } from "@/lib/axios";

export interface RAGSearchResult {
  chunk_id: number;
  document_type: "job" | "resume" | "cv_document" | string;
  document_id: number;
  company_id?: number | null;
  user_id?: number | null;
  candidate_name?: string | null;
  candidate_email?: string | null;
  document_title?: string | null;
  section_type: "summary" | "experience" | "education" | "skills" | "project" | "requirement" | "benefit" | string;
  chunk_index: number;
  content: string;
  metadata?: {
    title?: string;
    role?: string;
    company_name?: string;
    period?: string;
    skills?: string[];
    seniority?: string;
    level?: string;
    importance?: string;
    headline?: string;
    [key: string]: unknown;
  };
  dense_score: number;
  sparse_score: number;
  hybrid_score: number;
  // Application context (company candidate details)
  applied_job_id?: number | null;
  applied_job_title?: string | null;
  application_status?: string | null;
  application_id?: number | null;
  applied_at?: string | null;
}

export interface RAGQueryRequest {
  query: string;
  document_type?: "resume" | "cv_document" | "job" | null;
  document_types?: string[] | null;
  company_id?: number | null;
  user_id?: number | null;
  job_id?: number | null;
  only_company_applicants?: boolean;
  section_types?: string[] | null;
  limit?: number;
  min_score?: number;
}

export interface RAGQueryResponse {
  query: string;
  results: RAGSearchResult[];
  total_matched: number;
}

export interface RAGInterviewQuestionItem {
  question: string;
  rationale: string;
  category: string;
  difficulty: "junior" | "intermediate" | "senior" | "lead";
  cited_chunk_ids: number[];
}

export interface RAGInterviewQuestionsRequest {
  job_id: number;
  cv_document_id?: number | null;
  resume_id?: number | null;
  count?: number;
  rubric_category?: string | null;
}

export interface RAGInterviewQuestionsResponse {
  job_title: string;
  candidate_name: string;
  questions: RAGInterviewQuestionItem[];
  referenced_chunks: RAGSearchResult[];
}

/**
 * Perform hybrid semantic search (70% Dense Cosine + 30% Sparse BM25) with tenant isolation.
 */
export async function searchRAG(payload: RAGQueryRequest): Promise<RAGQueryResponse> {
  const { data } = await apiClient.post<RAGQueryResponse>("/rag/search", payload);
  return data;
}

/**
 * Generate deep, evidence-grounded interview questions based on candidate CV and Job requirements.
 */
export async function generateRAGInterviewQuestions(
  payload: RAGInterviewQuestionsRequest,
): Promise<RAGInterviewQuestionsResponse> {
  const { data } = await apiClient.post<RAGInterviewQuestionsResponse>(
    "/rag/interview-questions",
    payload,
    { timeout: 60_000 }
  );
  return data;
}

/**
 * Manually trigger semantic section-based chunking & vector indexing for a document.
 */
export async function indexDocumentRAG(
  documentType: "job" | "resume" | "cv_document",
  documentId: number
): Promise<{ status: string; chunks_indexed: number }> {
  const { data } = await apiClient.post<{ status: string; chunks_indexed: number }>(
    `/rag/index?document_type=${documentType}&document_id=${documentId}`
  );
  return data;
}

export interface RAGCVChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RAGCVChatRequest {
  query: string;
  cv_document_id?: number | null;
  resume_id?: number | null;
  chat_history?: RAGCVChatMessage[];
}

export interface RAGCVChatResponse {
  answer: string;
  candidate_name?: string | null;
  document_title?: string | null;
  cited_chunk_ids: number[];
  referenced_chunks: RAGSearchResult[];
}

/**
 * Ask contextual questions about a candidate CV with grounded evidence citations.
 */
export async function chatWithCVCopilot(payload: RAGCVChatRequest): Promise<RAGCVChatResponse> {
  const { data } = await apiClient.post<RAGCVChatResponse>("/rag/chat-cv", payload, {
    timeout: 60_000,
  });
  return data;
}

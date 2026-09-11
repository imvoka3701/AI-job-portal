/**
 * B2B Direct Chat API client.
 */

import { apiClient } from "@/lib/axios";

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string | null;
  sender_role: string | null;
  sender_avatar?: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  application_id: number;
  job_id: number;
  job_title: string | null;
  candidate_id: number;
  candidate_name: string | null;
  candidate_avatar: string | null;
  company_id: number | null;
  company_name: string | null;
  company_logo?: string | null;
  employer_id?: number | null;
  employer_name?: string | null;
  employer_avatar?: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_locked?: boolean;
  is_reported?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

/**
 * Report a conversation for violation/harassment.
 * POST /chat/conversations/{conversation_id}/report
 */
export async function reportConversation(
  conversation_id: number,
  reason: string,
): Promise<{ message: string; is_reported: boolean }> {
  const { data } = await apiClient.post<{ message: string; is_reported: boolean }>(
    `/chat/conversations/${conversation_id}/report`,
    { reason },
  );
  return data;
}

/**
 * List conversations accessible to the current user.
 * GET /chat/conversations
 */
export async function listConversations(companyId?: number): Promise<Conversation[]> {
  const { data } = await apiClient.get<Conversation[]>("/chat/conversations", {
    params: companyId ? { company_id: companyId } : undefined,
  });
  return data;
}

/**
 * Initialize or get conversation for an application.
 * POST /chat/applications/{application_id}/init
 */
export async function initApplicationConversation(application_id: number): Promise<ConversationDetail> {
  const { data } = await apiClient.post<ConversationDetail>(
    `/chat/applications/${application_id}/init`
  );
  return data;
}

/**
 * Get conversation details and message history.
 * GET /chat/conversations/{conversation_id}
 */
export async function getConversationDetail(conversation_id: number): Promise<ConversationDetail> {
  const { data } = await apiClient.get<ConversationDetail>(
    `/chat/conversations/${conversation_id}`
  );
  return data;
}

/**
 * Send a new chat message.
 * POST /chat/conversations/{conversation_id}/messages
 */
export async function sendChatMessage(
  conversation_id: number,
  content: string
): Promise<ChatMessage> {
  const { data } = await apiClient.post<ChatMessage>(
    `/chat/conversations/${conversation_id}/messages`,
    { content }
  );
  return data;
}

/**
 * Mark all unread messages as read in conversation.
 * PATCH /chat/conversations/{conversation_id}/read
 */
export async function markConversationRead(conversation_id: number): Promise<{ marked: number }> {
  const { data } = await apiClient.patch<{ marked: number }>(
    `/chat/conversations/${conversation_id}/read`
  );
  return data;
}

// ── Admin Chat Governance (Zero-Knowledge Privacy) ─────────────────────────

export interface AdminChatStats {
  total_conversations: number;
  total_messages: number;
  reported_conversations: number;
  locked_conversations: number;
  active_conversations_today: number;
}

export interface AdminConversationItem {
  id: number;
  application_id: number;
  job_id: number;
  job_title: string | null;
  candidate_id: number;
  candidate_name: string | null;
  candidate_email: string | null;
  company_id: number | null;
  company_name: string | null;
  employer_id: number | null;
  employer_name: string | null;
  message_count: number;
  is_locked: boolean;
  is_reported: boolean;
  report_reason: string | null;
  reported_by_name: string | null;
  reported_at: string | null;
  created_at: string;
  last_message_at: string | null;
}

export interface AdminConversationListResponse {
  items: AdminConversationItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminListConversationsParams {
  is_reported?: boolean;
  is_locked?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}

/**
 * Get aggregate direct chat stats for Admin Operations.
 * GET /admin/chat/stats
 */
export async function getAdminChatStats(): Promise<AdminChatStats> {
  const { data } = await apiClient.get<AdminChatStats>("/admin/chat/stats");
  return data;
}

/**
 * List conversation metadata for Admin Governance (Metadata only, Zero-PII/Zero-Message).
 * GET /admin/chat/conversations
 */
export async function listAdminConversations(
  params?: AdminListConversationsParams
): Promise<AdminConversationListResponse> {
  const { data } = await apiClient.get<AdminConversationListResponse>("/admin/chat/conversations", {
    params,
  });
  return data;
}

/**
 * Lock or unlock conversation for trust & safety intervention.
 * POST /admin/chat/conversations/{conversation_id}/lock
 */
export async function lockAdminConversation(
  conversationId: number,
  isLocked: boolean,
  reason?: string
): Promise<{ message: string; conversation_id: number; is_locked: boolean }> {
  const { data } = await apiClient.post<{
    message: string;
    conversation_id: number;
    is_locked: boolean;
  }>(`/admin/chat/conversations/${conversationId}/lock`, {
    is_locked: isLocked,
    reason,
  });
  return data;
}

/**
 * Dismiss violation report on a conversation.
 * POST /admin/chat/conversations/{conversation_id}/dismiss-report
 */
export async function dismissAdminConversationReport(
  conversationId: number
): Promise<{ message: string; conversation_id: number; is_reported: boolean }> {
  const { data } = await apiClient.post<{
    message: string;
    conversation_id: number;
    is_reported: boolean;
  }>(`/admin/chat/conversations/${conversationId}/dismiss-report`);
  return data;
}

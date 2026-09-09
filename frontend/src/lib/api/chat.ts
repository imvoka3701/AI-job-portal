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
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
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

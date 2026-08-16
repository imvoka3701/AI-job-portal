import { apiClient } from "@/lib/axios";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface EmbeddedCard {
  card_type: "job" | "tool" | "action" | "info";
  title: string;
  subtitle?: string | null;
  url: string;
  meta?: Record<string, unknown> | null;
}

export interface AssistantChatResponse {
  reply: string;
  suggested_cards: EmbeddedCard[];
  suggested_followups: string[];
}

export interface AssistantQuickSuggestion {
  label: string;
  prompt: string;
  category: "job_search" | "cv_help" | "interview" | "employer_jd" | "tools" | "general";
}

export interface AssistantChatPayload {
  messages: ChatMessage[];
  context?: {
    current_path: string;
    selected_job_id?: number | null;
    role?: string | null;
  };
}

/** Send conversational chat to JobPortal AI Copilot */
export async function chatWithAssistant(payload: AssistantChatPayload): Promise<AssistantChatResponse> {
  const response = await apiClient.post<AssistantChatResponse>("/ai/assistant/chat", payload);
  return response.data;
}

/** Get context-aware quick prompt suggestions */
export async function getAssistantSuggestions(path: string = "/", role?: string): Promise<AssistantQuickSuggestion[]> {
  const response = await apiClient.get<AssistantQuickSuggestion[]>("/ai/assistant/suggestions", {
    params: { path, role },
  });
  return response.data;
}

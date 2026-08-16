import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  chatWithAssistant,
  getAssistantSuggestions,
  type ChatMessage,
  type EmbeddedCard,
  type AssistantQuickSuggestion,
} from "@/lib/api/assistant";

export interface DisplayMessage extends ChatMessage {
  id: string;
  timestamp: string;
  cards?: EmbeddedCard[];
  followups?: string[];
}

interface AssistantState {
  isOpen: boolean;
  isTyping: boolean;
  error: string | null;
  messages: DisplayMessage[];
  suggestions: AssistantQuickSuggestion[];
  unreadCount: number;

  // Actions
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  sendMessage: (text: string, currentPath: string, role?: string, selectedJobId?: number | null) => Promise<void>;
  loadSuggestions: (path: string, role?: string) => Promise<void>;
  clearMessages: () => void;
}

const INITIAL_MESSAGE: DisplayMessage = {
  id: "welcome-msg",
  role: "assistant",
  content:
    "Xin chào! Tôi là **JobPortal AI Copilot** 🤖. Tôi có thể hỗ trợ bạn tìm việc làm phù hợp, hướng dẫn tạo CV chuẩn ATS, luyện phỏng vấn, hoặc soạn bản mô tả công việc (JD). Bạn cần tôi giúp gì hôm nay?",
  timestamp: new Date().toISOString(),
  followups: [
    "Tìm việc làm phù hợp với tôi",
    "Tạo CV xin việc chuẩn ATS",
    "Làm bài test MBTI định hướng nghề",
  ],
};

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isTyping: false,
      error: null,
      messages: [INITIAL_MESSAGE],
      suggestions: [],
      unreadCount: 0,

      toggleOpen: () => {
        const nextState = !get().isOpen;
        set({ isOpen: nextState, unreadCount: nextState ? 0 : get().unreadCount });
      },

      setOpen: (open: boolean) => {
        set({ isOpen: open, unreadCount: open ? 0 : get().unreadCount });
      },

      loadSuggestions: async (path: string, role?: string) => {
        try {
          const suggestions = await getAssistantSuggestions(path, role);
          set({ suggestions });
        } catch {
          // silently keep fallback
        }
      },

      sendMessage: async (text: string, currentPath: string, role?: string, selectedJobId?: number | null) => {
        const trimmed = text.trim();
        if (!trimmed || get().isTyping) return;

        const userMsg: DisplayMessage = {
          id: `user-${Date.now()}`,
          role: "user",
          content: trimmed,
          timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...get().messages, userMsg];
        set({ messages: updatedMessages, isTyping: true, error: null });

        try {
          // Format payload for API
          const payloadMessages: ChatMessage[] = updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const response = await chatWithAssistant({
            messages: payloadMessages,
            context: {
              current_path: currentPath,
              role: role || null,
              selected_job_id: selectedJobId || null,
            },
          });

          const assistantMsg: DisplayMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.reply,
            timestamp: new Date().toISOString(),
            cards: response.suggested_cards,
            followups: response.suggested_followups,
          };

          set({
            messages: [...updatedMessages, assistantMsg],
            isTyping: false,
            unreadCount: get().isOpen ? 0 : get().unreadCount + 1,
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Không thể kết nối với AI Copilot.";
          set({
            isTyping: false,
            error: errorMessage,
          });
        }
      },

      clearMessages: () => {
        set({
          messages: [INITIAL_MESSAGE],
          error: null,
          isTyping: false,
        });
      },
    }),
    {
      name: "jobportal_assistant_state",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);

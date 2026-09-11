/**
 * Zustand Chat Store — Global state for Floating Messenger Widget.
 * Handles conversation list, active chat room, unread badges, and real-time attention triggers.
 */

import { create } from "zustand";
import {
  listConversations,
  initApplicationConversation,
  type Conversation,
} from "@/lib/api/chat";
import { playMessageChime } from "@/lib/sound";

export interface IncomingAlert {
  id: number;
  conversationId: number;
  senderName: string;
  senderAvatar?: string | null;
  companyName?: string | null;
  companyLogo?: string | null;
  jobTitle?: string | null;
  content: string;
}

interface ChatState {
  isOpen: boolean;
  activeConversationId: number | null;
  conversations: Conversation[];
  unreadTotal: number;
  isLoading: boolean;
  incomingAlert: IncomingAlert | null;
  isAttentionActive: boolean;

  // Actions
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setActiveConversationId: (id: number | null) => void;
  fetchConversations: () => Promise<void>;
  openChatWithConversation: (conversationId: number) => void;
  openChatWithApplication: (applicationId: number) => Promise<void>;
  handleRealtimeMessage: (data: {
    id: number;
    conversation_id: number;
    sender_id: number;
    sender_name: string | null;
    sender_avatar?: string | null;
    company_name?: string | null;
    company_logo?: string | null;
    job_title?: string | null;
    content: string;
    created_at?: string | null;
  }, currentUserId?: number) => void;
  clearIncomingAlert: () => void;
}

let alertTimer: ReturnType<typeof setTimeout> | null = null;
let attentionTimer: ReturnType<typeof setTimeout> | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  activeConversationId: null,
  conversations: [],
  unreadTotal: 0,
  isLoading: false,
  incomingAlert: null,
  isAttentionActive: false,

  setIsOpen: (isOpen) => {
    set({ isOpen });
    if (isOpen) {
      // Clear alert banner when user opens chat
      set({ incomingAlert: null, isAttentionActive: false });
    }
  },

  toggleOpen: () => {
    const next = !get().isOpen;
    get().setIsOpen(next);
  },

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const list = await listConversations();
      const totalUnread = list.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      set({ conversations: list, unreadTotal: totalUnread });
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },

  openChatWithConversation: (conversationId: number) => {
    set({
      activeConversationId: conversationId,
      isOpen: true,
      incomingAlert: null,
      isAttentionActive: false,
    });
  },

  openChatWithApplication: async (applicationId: number) => {
    set({ isLoading: true });
    try {
      const detail = await initApplicationConversation(applicationId);
      set((state) => {
        const existingIdx = state.conversations.findIndex((c) => c.id === detail.id);
        const updatedList = existingIdx >= 0
          ? state.conversations.map((c) => (c.id === detail.id ? detail : c))
          : [detail, ...state.conversations];
        return {
          conversations: updatedList,
          activeConversationId: detail.id,
          isOpen: true,
          incomingAlert: null,
          isAttentionActive: false,
        };
      });
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },

  handleRealtimeMessage: (data, currentUserId) => {
    const state = get();
    const isFromMe = currentUserId && data.sender_id === currentUserId;

    // Refresh conversation list to get latest message & updated timestamps
    get().fetchConversations();

    // If message is from the other party:
    if (!isFromMe) {
      // Play crisp audio chime
      playMessageChime();

      // If the chat box is closed OR looking at another conversation:
      const isViewingThisConv = state.isOpen && state.activeConversationId === data.conversation_id;

      if (!isViewingThisConv) {
        // Trigger visual attention shake/pulse
        set({
          isAttentionActive: true,
          incomingAlert: {
            id: data.id,
            conversationId: data.conversation_id,
            senderName: data.sender_name || "Nhà tuyển dụng",
            senderAvatar: data.sender_avatar,
            companyName: data.company_name,
            companyLogo: data.company_logo,
            jobTitle: data.job_title,
            content: data.content,
          },
        });

        if (attentionTimer) clearTimeout(attentionTimer);
        attentionTimer = setTimeout(() => {
          set({ isAttentionActive: false });
        }, 4000);

        if (alertTimer) clearTimeout(alertTimer);
        alertTimer = setTimeout(() => {
          set({ incomingAlert: null });
        }, 8500);
      }
    }
  },

  clearIncomingAlert: () => {
    if (alertTimer) clearTimeout(alertTimer);
    if (attentionTimer) clearTimeout(attentionTimer);
    set({ incomingAlert: null, isAttentionActive: false });
  },
}));

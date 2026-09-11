import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, ShieldCheck, Lock } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useUser } from "@/stores/authStore";
import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications";
import { MessengerConversationList } from "./MessengerConversationList";
import { MessengerChatRoom } from "./MessengerChatRoom";
import { MessengerIncomingToast } from "./MessengerIncomingToast";
import { cn } from "@/lib/utils";

export function FloatingMessengerWidget() {
  const currentUser = useUser();
  const {
    isOpen,
    toggleOpen,
    setIsOpen,
    activeConversationId,
    setActiveConversationId,
    unreadTotal,
    fetchConversations,
    handleRealtimeMessage,
    isAttentionActive,
  } = useChatStore();

  // Listen to WebSocket notifications and incoming real-time chat messages
  useWebSocketNotifications({
    onChatMessage: (data) => {
      handleRealtimeMessage(data, currentUser?.id);
    },
    onNotification: (notif) => {
      // If notification is about chat, refresh conversation list
      if (notif.extra_data?.type === "direct_chat") {
        fetchConversations();
      }
    },
  });

  // Fetch initial conversations on mount or when user changes
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  return (
    <>
      {/* Real-time Incoming Message Toast Banner */}
      <MessengerIncomingToast />

      {/* Floating Action Button (Positioned at bottom-[92px], exactly above AI Copilot at bottom-6) */}
      <div className="fixed bottom-[92px] right-6 z-50 flex flex-col items-end font-sans">
        <motion.button
          type="button"
          animate={
            isAttentionActive
              ? {
                  rotate: [0, -12, 12, -8, 8, -4, 4, 0],
                  scale: [1, 1.12, 1.04, 1.1, 1],
                }
              : {
                  rotate: 0,
                  scale: 1,
                }
          }
          transition={{
            duration: 0.75,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleOpen}
          aria-label={isOpen ? "Đóng tin nhắn tuyển dụng" : "Mở tin nhắn tuyển dụng B2B Messenger"}
          className={cn(
            "group relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 cursor-pointer",
            isOpen
              ? "bg-slate-900 text-white shadow-slate-900/30 border border-slate-800"
              : isAttentionActive
              ? "bg-white text-emerald-600 border-2 border-emerald-500 shadow-emerald-600/35 ring-4 ring-emerald-400/30"
              : "bg-white text-slate-700 border-2 border-slate-200 shadow-slate-400/20 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-emerald-600/25"
          )}
        >
          {/* Animated Attention Glow Ring when a new message arrives */}
          {isAttentionActive && !isOpen && (
            <span className="absolute -inset-2 rounded-2xl bg-emerald-500 opacity-40 blur-xs animate-ping pointer-events-none" />
          )}

          {/* Icon Content */}
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <>
                <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </>
            )}
          </div>

          {/* Unread Counter Badge */}
          {unreadTotal > 0 && !isOpen && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          )}
        </motion.button>
      </div>

      {/* Messenger Popover Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-[160px] right-4 sm:right-6 z-50 w-[94vw] sm:w-[400px] h-[550px] max-h-[80vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden font-sans text-slate-900"
          >
            {!currentUser ? (
              <div className="flex flex-col h-full bg-white relative">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Tin nhắn tuyển dụng</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <h3 className="text-sm font-bold text-slate-900">Đăng nhập để trò chuyện</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Kênh nhắn tin tuyển dụng thời gian thực giữa Ứng viên và Doanh nghiệp được bảo vệ và mã hóa riêng tư.
                    </p>
                  </div>
                  <div className="w-full space-y-2 pt-2 max-w-xs">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition-colors"
                    >
                      Đăng nhập ngay
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Tạo tài khoản miễn phí
                    </Link>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Mã hóa bảo vệ theo tiêu chuẩn B2B SaaS
                  </div>
                </div>
              </div>
            ) : activeConversationId !== null ? (
              <MessengerChatRoom
                conversationId={activeConversationId}
                onBack={() => setActiveConversationId(null)}
                onClose={() => setIsOpen(false)}
              />
            ) : (
              <MessengerConversationList
                onSelectConversation={(id) => setActiveConversationId(id)}
                onClose={() => setIsOpen(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

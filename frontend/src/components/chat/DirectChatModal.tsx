import { useEffect, useRef, useState, useCallback, useId } from "react";
import { motion } from "framer-motion";
import {
  X,
  Send,
  Check,
  CheckCheck,
  Briefcase,
  User,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  initApplicationConversation,
  getConversationDetail,
  sendChatMessage,
  markConversationRead,
  type ChatMessage,
  type ConversationDetail,
} from "@/lib/api/chat";
import { useUser } from "@/stores/authStore";
import { useWebSocketNotifications, type WebSocketNotificationPayload } from "@/hooks/useWebSocketNotifications";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

export interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: number;
  conversationId?: number;
  title?: string;
  subtitle?: string;
  candidateName?: string;
  jobTitle?: string;
}

const QUICK_TEMPLATES = [
  "Chào bạn, hồ sơ của bạn rất ấn tượng! Bạn có thể tham gia phỏng vấn tuần này không?",
  "Xin chào bạn, bạn vui lòng bổ sung thêm portfolio hoặc chứng chỉ chuyên môn nhé.",
  "Chúc mừng bạn! Hồ sơ ứng tuyển của bạn đã vượt qua vòng sơ loại.",
  "Chào bạn, công ty muốn trao đổi thêm về mức lương và thời gian nhận việc.",
];

export function DirectChatModal({
  isOpen,
  onClose,
  applicationId,
  conversationId: initialConvId,
  title,
  subtitle,
  candidateName,
  jobTitle,
}: DirectChatModalProps) {
  const currentUser = useUser();
  const titleId = useId();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback((smooth = true) => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  // ── Load Conversation Data ───────────────────────────────────────────────
  const loadConversation = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      let data: ConversationDetail;
      if (applicationId) {
        data = await initApplicationConversation(applicationId);
      } else if (initialConvId) {
        data = await getConversationDetail(initialConvId);
      } else {
        setLoading(false);
        return;
      }
      setConversation(data);
      setMessages(data.messages || []);
      setTimeout(() => scrollToBottom(false), 50);
    } catch {
      setError("Không thể tải cuộc trò chuyện. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [isOpen, applicationId, initialConvId, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      loadConversation();
    } else {
      setConversation(null);
      setMessages([]);
      setInputText("");
      setError(null);
    }
  }, [isOpen, loadConversation]);

  // ── Real-time WebSocket Listeners ────────────────────────────────────────
  const handleIncomingNotification = useCallback(
    (notif: WebSocketNotificationPayload) => {
      // If notification has extra_data pointing to our current conversation
      const convId = conversation?.id;
      const targetConvId = notif.extra_data?.conversation_id as number | undefined;

      if (convId && targetConvId && targetConvId === convId) {
        // Mark as read immediately
        markConversationRead(convId).catch(() => {});
        // Refresh conversation messages
        getConversationDetail(convId)
          .then((detail) => {
            setMessages(detail.messages);
            scrollToBottom(true);
          })
          .catch(() => {});
      }
    },
    [conversation?.id, scrollToBottom],
  );

  const { isConnected } = useWebSocketNotifications({
    onNotification: handleIncomingNotification,
  });

  // ── Send Message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !conversation || sending) return;

    setSending(true);
    try {
      const newMsg = await sendChatMessage(conversation.id, text);
      setMessages((prev) => [...prev, newMsg]);
      setInputText("");
      setTimeout(() => {
        scrollToBottom(true);
        inputRef.current?.focus();
      }, 50);
    } catch {
      setError("Gửi tin nhắn thất bại. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyTemplate = (template: string) => {
    setInputText(template);
    inputRef.current?.focus();
  };

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const displayTitle =
    title ||
    conversation?.candidate_name ||
    candidateName ||
    (currentUser?.role === "candidate" ? conversation?.company_name || "Nhà tuyển dụng" : "Ứng viên");

  const displaySubtitle =
    subtitle || conversation?.job_title || jobTitle || "Trao đổi ứng tuyển";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Chat Dialog */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl h-[620px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden z-10"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-xs">
                {displayTitle.charAt(0).toUpperCase()}
              </div>
              {isConnected && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                  title="Kết nối trực tiếp"
                />
              )}
            </div>

            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-bold text-gray-900 truncate">
                {displayTitle}
              </h2>
              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-gray-400 shrink-0" />
                <span>{displaySubtitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={loadConversation}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Làm mới cuộc trò chuyện"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-emerald-600")} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Spinner size="md" color="green" label="Đang tải tin nhắn..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-sm text-rose-600 mb-2">{error}</p>
              <button
                type="button"
                onClick={loadConversation}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 text-gray-400">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Chưa có tin nhắn nào</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Bắt đầu cuộc trao đổi trực tiếp giữa Nhà tuyển dụng và Ứng viên về vị trí ứng tuyển này.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUser?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
                >
                  <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%]">
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium shrink-0 mb-1">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-2xs",
                        isMine
                          ? "bg-emerald-600 text-white rounded-br-xs"
                          : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs",
                      )}
                    >
                      {!isMine && msg.sender_name && (
                        <p className="text-[11px] font-semibold text-emerald-700 mb-0.5">
                          {msg.sender_name}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>

                  {/* Timestamp & Read Receipts */}
                  <div
                    className={cn(
                      "flex items-center gap-1 text-[10px] text-gray-400 mt-1 px-1",
                      isMine ? "mr-1" : "ml-9",
                    )}
                  >
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isMine && (
                      msg.is_read ? (
                        <span title="Đã xem">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                      ) : (
                        <span title="Đã gửi">
                          <Check className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Message Templates (visible when messages are empty or for HR) */}
        {currentUser?.role !== "candidate" && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-medium text-gray-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Mẫu:
            </span>
            {QUICK_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                className="text-xs whitespace-nowrap bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 transition-colors shrink-0"
              >
                {tmpl.slice(0, 30)}...
              </button>
            ))}
          </div>
        )}

        {/* Footer Input Area */}
        <div className="p-3.5 bg-white border-t border-gray-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn trao đổi... (Enter để gửi, Shift+Enter để xuống dòng)"
              className="flex-1 resize-none text-sm p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className={cn(
                "h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 font-medium text-sm transition-all shrink-0",
                inputText.trim() && !sending
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}
            >
              {sending ? (
                <Spinner size="sm" color="white" />
              ) : (
                <>
                  <span>Gửi</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

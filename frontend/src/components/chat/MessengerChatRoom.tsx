import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import {
  ChevronLeft,
  X,
  Send,
  Flag,
  ShieldCheck,
  ShieldAlert,
  Check,
  CheckCheck,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import {
  getConversationDetail,
  sendChatMessage,
  reportConversation,
  type ChatMessage,
  type ConversationDetail,
} from "@/lib/api/chat";
import { useUser } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { MessengerAvatar } from "./MessengerAvatar";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export interface MessengerChatRoomProps {
  conversationId: number;
  onBack: () => void;
  onClose: () => void;
}

const EMPLOYER_TEMPLATES = [
  "Chào bạn, hồ sơ của bạn rất ấn tượng! Bạn có thể tham gia phỏng vấn tuần này không?",
  "Xin chào bạn, công ty muốn trao đổi thêm về mức lương và thời gian nhận việc.",
  "Bạn vui lòng gửi thêm portfolio hoặc các dự án đã thực hiện nhé.",
];

export function MessengerChatRoom({
  conversationId,
  onBack,
  onClose,
}: MessengerChatRoomProps) {
  const currentUser = useUser();
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Load Conversation Details
  const loadDetail = useCallback(async () => {
    try {
      const data = await getConversationDetail(conversationId);
      setConversation(data);
      setMessages(data.messages || []);
      setTimeout(() => scrollToBottom(false), 60);
      fetchConversations(); // refresh unread count
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [conversationId, scrollToBottom, fetchConversations]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Listen to incoming real-time messages for this conversation
  useEffect(() => {
    const handleCustomMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      if (data && data.conversation_id === conversationId) {
        setMessages((prev) => {
          // Avoid duplicate
          if (prev.some((m) => m.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id,
              conversation_id: data.conversation_id,
              sender_id: data.sender_id,
              sender_name: data.sender_name,
              sender_role: null,
              sender_avatar: data.sender_avatar,
              content: data.content,
              is_read: true,
              read_at: null,
              created_at: data.created_at || new Date().toISOString(),
            },
          ];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    window.addEventListener("aijob:chat_message", handleCustomMessage);
    return () => window.removeEventListener("aijob:chat_message", handleCustomMessage);
  }, [conversationId, scrollToBottom]);

  // Send Message Handler
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending || conversation?.is_locked) return;

    setSending(true);
    try {
      const newMsg = await sendChatMessage(conversationId, trimmed);
      setMessages((prev) => [...prev, newMsg]);
      setInputText("");
      setTimeout(() => scrollToBottom(true), 50);
      fetchConversations();
    } catch {
      // Error handled
    } finally {
      setSending(false);
    }
  };

  // Report Conversation Handler
  const handleReport = async () => {
    if (!reportReason.trim() || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      const res = await reportConversation(conversationId, reportReason.trim());
      setReportSuccess(res.message);
      if (conversation) {
        setConversation({ ...conversation, is_reported: true });
      }
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(null);
        setReportReason("");
      }, 1800);
    } catch {
      // ignore
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white font-sans p-6">
        <Spinner size="md" color="green" />
        <span className="text-xs text-slate-500 mt-3 font-medium">
          Đang kết nối phòng chat bảo mật...
        </span>
      </div>
    );
  }

  const isUserCandidate = currentUser?.id === conversation.candidate_id;
  const isEmployer = currentUser?.role === "employer";

  const displayName = isUserCandidate
    ? conversation.employer_name || "Nhà tuyển dụng"
    : conversation.candidate_name || "Ứng viên";

  const displayAvatar = isUserCandidate
    ? conversation.employer_avatar
    : conversation.candidate_avatar;

  const companyName = conversation.company_name;
  const companyLogo = isUserCandidate ? conversation.company_logo : null;

  return (
    <div className="flex flex-col h-full bg-white font-sans relative">
      {/* Room Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Quay lại danh sách"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <MessengerAvatar
            name={displayName}
            avatarUrl={displayAvatar}
            companyName={companyName}
            companyLogo={companyLogo}
            size="sm"
          />

          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate leading-tight">
              {displayName}
            </h3>
            {(companyName || conversation.job_title) && (
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 font-medium">
                <Briefcase className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {companyName}
                  {conversation.job_title ? ` • ${conversation.job_title}` : ""}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            title="Báo cáo vi phạm"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Governance & Privacy Notice */}
      {conversation.is_locked ? (
        <div className="bg-red-50 border-b border-red-200 px-3.5 py-2 text-[11px] text-red-700 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>Cuộc trò chuyện này đã bị tạm khóa do có báo cáo vi phạm nội quy bảo mật.</span>
        </div>
      ) : conversation.is_reported ? (
        <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 text-[11px] text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Cuộc trò chuyện đang được bộ phận Quản trị viên thẩm tra khiếu nại.</span>
        </div>
      ) : (
        <div className="bg-emerald-50/60 border-b border-emerald-100 px-3.5 py-1.5 text-[10px] text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Hội thoại mã hóa & bảo mật theo tiêu chuẩn tuyển dụng
          </span>
          <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider">
            Verified
          </span>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">Bắt đầu kết nối trực tiếp</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Hãy gửi tin nhắn đầu tiên để thảo luận chi tiết về vị trí{" "}
              <strong>{conversation.job_title}</strong>.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={msg.id}
                className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}
              >
                {!isMe && (
                  <MessengerAvatar
                    name={msg.sender_name || displayName}
                    avatarUrl={msg.sender_avatar || displayAvatar}
                    companyLogo={isUserCandidate ? companyLogo : null}
                    size="sm"
                  />
                )}

                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs space-y-1",
                    isMe
                      ? "bg-emerald-600 text-white rounded-br-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 text-[9px]",
                      isMe ? "text-emerald-100" : "text-slate-400"
                    )}
                  >
                    <span>{timeStr}</span>
                    {isMe && (
                      <span title={msg.is_read ? "Đã xem" : "Đã gửi"}>
                        {msg.is_read ? (
                          <CheckCheck className="w-3 h-3 text-white" />
                        ) : (
                          <Check className="w-3 h-3 text-emerald-200" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Templates for Employers */}
      {isEmployer && !conversation.is_locked && (
        <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {EMPLOYER_TEMPLATES.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(tpl)}
              className="shrink-0 text-[10px] font-medium bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-2.5 py-1 rounded-full border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
            >
              {tpl.slice(0, 32)}...
            </button>
          ))}
        </div>
      )}

      {/* Input Composer */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            placeholder={
              conversation.is_locked
                ? "Cuộc trò chuyện đang bị khóa..."
                : "Nhập nội dung tin nhắn trao đổi..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={conversation.is_locked || sending}
            className="flex-1 text-xs rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending || conversation.is_locked}
            className="shrink-0 w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all cursor-pointer"
            aria-label="Gửi tin nhắn"
          >
            {sending ? <Spinner size="sm" color="white" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 w-full max-w-sm space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Flag className="w-4 h-4" />
                <h4 className="text-xs font-bold text-slate-900">Báo cáo vi phạm bảo mật</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 text-center">
                {reportSuccess}
              </div>
            ) : (
              <>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Quản trị viên sẽ tiến hành thẩm tra hội thoại để ngăn chặn hành vi quấy rối,
                  lừa đảo hoặc vi phạm quy chế tuyển dụng.
                </p>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Mô tả cụ thể lý do báo cáo vi phạm..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleReport}
                    disabled={!reportReason.trim() || reportSubmitting}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 flex items-center gap-1.5"
                  >
                    {reportSubmitting && <Spinner size="sm" color="white" />}
                    Gửi báo cáo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

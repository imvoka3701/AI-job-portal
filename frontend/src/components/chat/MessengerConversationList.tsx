import { useState } from "react";
import {
  Search,
  RefreshCw,
  X,
  MessageSquare,
  Briefcase,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useUser } from "@/stores/authStore";
import { MessengerAvatar } from "./MessengerAvatar";
import { cn } from "@/lib/utils";

export interface MessengerConversationListProps {
  onSelectConversation: (conversationId: number) => void;
  onClose: () => void;
}

export function MessengerConversationList({
  onSelectConversation,
  onClose,
}: MessengerConversationListProps) {
  const { conversations, isLoading, fetchConversations } = useChatStore();
  const currentUser = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  const isEmployer = currentUser?.role === "employer";

  // Filter conversations by search term
  const filteredConversations = conversations.filter((c) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;

    const candidate = (c.candidate_name || "").toLowerCase();
    const employer = (c.employer_name || "").toLowerCase();
    const company = (c.company_name || "").toLowerCase();
    const job = (c.job_title || "").toLowerCase();
    const msg = (c.last_message || "").toLowerCase();

    return (
      candidate.includes(term) ||
      employer.includes(term) ||
      company.includes(term) ||
      job.includes(term) ||
      msg.includes(term)
    );
  });

  const formatRelativeTime = (timeStr?: string | null) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins}p`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-none">Tin nhắn tuyển dụng</h2>
            <span className="text-[11px] text-slate-400 font-medium">B2B Real-time Chat</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fetchConversations()}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-emerald-600")} />
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

      {/* Search Input Bar */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm ứng viên, công ty, tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Conversation List / Empty State */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center space-y-3 flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            {isEmployer ? (
              <div className="space-y-1 max-w-xs">
                <p className="text-xs font-bold text-slate-700">Chưa có cuộc trò chuyện nào</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Khi bạn đưa ra quyết định tuyển dụng, hãy vào mục <strong>Ứng viên</strong> và chọn
                  nút Nhắn tin để bắt đầu kết nối trực tiếp.
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-w-xs">
                <p className="text-xs font-bold text-slate-700">Chưa có tin nhắn mới</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hộp thoại sẽ xuất hiện khi các Nhà tuyển dụng liên hệ trao đổi về hồ sơ ứng tuyển
                  của bạn.
                </p>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            // Determine display info based on current user role
            const isUserCandidate = currentUser?.id === conv.candidate_id;

            const displayName = isUserCandidate
              ? conv.employer_name || "Nhà tuyển dụng"
              : conv.candidate_name || "Ứng viên";

            const displayAvatar = isUserCandidate
              ? conv.employer_avatar
              : conv.candidate_avatar;

            const companyName = conv.company_name;
            const companyLogo = conv.company_logo;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full text-left p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group relative",
                  conv.unread_count > 0 && "bg-emerald-50/30"
                )}
              >
                {/* Real-life Avatar with Embedded Company Badge */}
                <MessengerAvatar
                  name={displayName}
                  avatarUrl={displayAvatar}
                  companyName={companyName}
                  companyLogo={isUserCandidate ? companyLogo : null}
                  size="md"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                      {displayName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                      {formatRelativeTime(conv.last_message_at)}
                    </span>
                  </div>

                  {/* Company & Job Title Line */}
                  {(companyName || conv.job_title) && (
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mb-1 font-medium">
                      <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {companyName}
                        {conv.job_title ? ` • ${conv.job_title}` : ""}
                      </span>
                    </p>
                  )}

                  {/* Last Message Snippet */}
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-xs truncate",
                        conv.unread_count > 0
                          ? "font-semibold text-slate-900"
                          : "text-slate-500"
                      )}
                    >
                      {conv.last_message || "Chưa có tin nhắn nào"}
                    </p>

                    {/* Unread Badge */}
                    {conv.unread_count > 0 && (
                      <span className="shrink-0 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white shadow-xs">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Governance Flags */}
                  {conv.is_locked && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      <ShieldAlert className="w-3 h-3" />
                      Cuộc trò chuyện đang tạm khóa
                    </span>
                  )}
                  {!conv.is_locked && conv.is_reported && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <AlertCircle className="w-3 h-3" />
                      Đang xử lý vi phạm
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Mạng lưới trực tuyến bảo mật
        </span>
        <span className="text-slate-400">AI Job Portal Messenger</span>
      </div>
    </div>
  );
}

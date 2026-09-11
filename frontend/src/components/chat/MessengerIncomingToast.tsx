import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Briefcase } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { MessengerAvatar } from "./MessengerAvatar";

export function MessengerIncomingToast() {
  const { incomingAlert, openChatWithConversation, clearIncomingAlert } = useChatStore();

  if (!incomingAlert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 80, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 80, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className="fixed bottom-[160px] right-6 z-50 w-80 sm:w-96 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl ring-1 ring-emerald-500/20 font-sans"
      >
        <div className="flex items-start gap-3.5">
          {/* Avatar with Company Badge */}
          <div className="shrink-0 pt-0.5">
            <MessengerAvatar
              name={incomingAlert.senderName}
              avatarUrl={incomingAlert.senderAvatar}
              companyName={incomingAlert.companyName}
              companyLogo={incomingAlert.companyLogo}
              size="md"
            />
          </div>

          {/* Details */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => openChatWithConversation(incomingAlert.conversationId)}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {incomingAlert.senderName}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                Tin nhắn mới
              </span>
            </div>

            {(incomingAlert.companyName || incomingAlert.jobTitle) && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1.5 truncate">
                <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  {incomingAlert.companyName}
                  {incomingAlert.jobTitle ? ` • ${incomingAlert.jobTitle}` : ""}
                </span>
              </div>
            )}

            <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 rounded-xl p-2 border border-slate-100 leading-relaxed">
              "{incomingAlert.content}"
            </p>

            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                Mở cuộc trò chuyện
              </span>
              <span className="text-[10px] text-slate-400">Nhấp để trả lời</span>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearIncomingAlert();
            }}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

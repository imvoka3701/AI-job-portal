import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ShieldCheck } from "lucide-react";
import { useAssistantStore } from "@/stores/assistantStore";
import { AIAssistantDrawer } from "./AIAssistantDrawer";
import { cn } from "@/lib/utils";

const botAvatar = "/images/avatar_chat_bot.png";

export function AIAssistantWidget() {
  const { isOpen, toggleOpen, unreadCount } = useAssistantStore();
  const [showTooltip, setShowTooltip] = useState(false);

  // Show a diplomatic greeting tooltip after 3.2 seconds on first mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowTooltip(true);
      }
    }, 3200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <>
      {/* Floating Action Button Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
        {/* Contextual Diplomatic Greeting Bubble */}
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.94 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative max-w-xs rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-xl"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 p-0.5 shadow-xs overflow-hidden">
                  <img src={botAvatar} alt="AI Copilot" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-gray-900">JobPortal AI Copilot</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Xin chào! Tôi là trợ lý AI thông minh sẵn sàng tư vấn việc làm, tối ưu CV ATS và hỗ trợ tuyển dụng 24/7.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng thông báo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Action Trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowTooltip(false);
                  toggleOpen();
                }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                Trò chuyện với AI ngay
              </button>

              {/* Triangle Arrow */}
              <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-gray-200 bg-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Playful Hop AI Trigger Button */}
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={
            isOpen
              ? { opacity: 1, scale: 1, y: 0 }
              : {
                  opacity: 1,
                  scale: 1,
                  y: [0, -14, 0, -8, 0, -3, 0],
                  rotate: [0, 4, -4, 2, -1, 0],
                }
          }
          transition={
            isOpen
              ? { duration: 0.2 }
              : {
                  y: {
                    delay: 0.8,
                    duration: 1.25,
                    ease: "easeInOut",
                    times: [0, 0.22, 0.45, 0.65, 0.82, 0.92, 1],
                  },
                  rotate: {
                    delay: 0.8,
                    duration: 1.25,
                    ease: "easeInOut",
                  },
                  duration: 0.35,
                }
          }
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setShowTooltip(false);
            toggleOpen();
          }}
          aria-label={isOpen ? "Đóng cố vấn AI" : "Mở cố vấn AI JobPortal 24/7"}
          className={cn(
            "group relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 cursor-pointer",
            isOpen
              ? "bg-gray-900 text-white shadow-gray-900/30 border border-gray-800"
              : "bg-white border-2 border-emerald-500 shadow-emerald-600/25 hover:shadow-emerald-600/40"
          )}
        >
          {/* Animated Subtle Glow Ring when closed */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-2xl bg-emerald-500 opacity-20 blur-xs animate-pulse" />
          )}

          <div className="relative flex items-center justify-center w-full h-full p-1.5 overflow-hidden rounded-2xl">
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <>
                <img
                  src={botAvatar}
                  alt="AI Copilot Mascot"
                  className="w-full h-full object-contain transition-transform group-hover:scale-110 drop-shadow-xs"
                />
                <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-400 animate-pulse pointer-events-none" />
              </>
            )}
          </div>

          {/* Unread Badge */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* The AI Assistant Drawer */}
      <AIAssistantDrawer />
    </>
  );
}

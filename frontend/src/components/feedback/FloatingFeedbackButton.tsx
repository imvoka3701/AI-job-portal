import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareHeart, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { UserFeedbackModal } from "./UserFeedbackModal";

export function FloatingFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Hide on admin portal as Admin has dedicated moderation panel
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-6 z-40 font-sans">
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-[#00995C] border border-slate-200/90 hover:border-emerald-300 shadow-md hover:shadow-lg backdrop-blur-md transition-all cursor-pointer select-none"
          aria-label="Đóng góp ý kiến hoặc báo lỗi"
          title="Đóng góp ý kiến & Báo lỗi hệ thống"
        >
          {/* Subtle indicator dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B86B]" />
          </span>

          <div className="p-1 rounded-full bg-emerald-50 text-[#00995C] group-hover:bg-emerald-100 transition-colors">
            <MessageSquareHeart className="w-4 h-4" />
          </div>

          <span className="text-xs font-bold tracking-tight text-slate-800 group-hover:text-[#00995C] transition-colors">
            Góp ý & Báo lỗi
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-full border border-violet-200/60">
            <Sparkles className="w-2.5 h-2.5" />
            AI Portal
          </span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <UserFeedbackModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default FloatingFeedbackButton;

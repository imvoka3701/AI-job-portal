import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function AIMatchBanner() {
  return (
    <motion.div
      className="w-full relative overflow-hidden bg-gradient-to-r from-[#ECFDF5] via-white to-[#F0FDFA] border border-emerald-200/80 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs hover:shadow-md hover:border-[#00B86B]/40 transition-all duration-300 group"
      whileHover={{ y: -2 }}
    >
      {/* Soft ambient glow sweep on right */}
      <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-200/20 via-purple-100/10 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4">
        {/* AI Icon with subtle shimmer sweep */}
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B86B] to-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
            ✦ AI Matching Score
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E8F8F1] text-[#00995C] border border-emerald-200 uppercase tracking-wider">
              BETA
            </span>
          </h3>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Tải lên hồ sơ CV của bạn để AI tự động phân tích kỹ năng và đề xuất các vị trí việc làm có tỷ lệ phù hợp nhất!
          </p>
        </div>
      </div>

      {/* Action button */}
      <div className="relative z-10 shrink-0 w-full sm:w-auto">
        <Link to="/ai/matching" className="block w-full sm:w-auto">
          <motion.button
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00B86B] hover:bg-[#00995C] text-white text-sm font-semibold rounded-xl shadow-xs transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Phân tích CV ngay
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

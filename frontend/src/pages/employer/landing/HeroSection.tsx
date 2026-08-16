import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, PlayCircle, Users, Bot, Zap, Star, ShieldCheck, FileCheck, Layers } from "lucide-react";

// Rotating Dynamic Keywords
const ROTATING_PHRASES = [
  "Tự động sàng lọc CV 80%",
  "Khớp lệnh ứng viên chuẩn AI",
  "Rút ngắn quy trình từ 3 tuần còn 5 ngày",
  "Tối ưu ngân sách tuyển dụng thông minh",
];

// Live Candidate Feed with detailed preview
const CANDIDATE_FEED = [
  {
    id: 1,
    name: "Nguyễn Minh Tuấn",
    role: "Senior React / Fullstack Dev",
    exp: "5 năm kinh nghiệm",
    match: 96,
    avatar: "NT",
    tags: ["React", "TypeScript", "Node.js", "System Design"],
    matchReason: "Khớp 98% yêu cầu Core Skills & Tech Stack của JD",
  },
  {
    id: 2,
    name: "Trần Thùy Linh",
    role: "Product Manager (Fintech)",
    exp: "4 năm kinh nghiệm",
    match: 91,
    avatar: "TL",
    tags: ["Agile/Scrum", "Data Analytics", "Roadmap", "B2B SaaS"],
    matchReason: "Kinh nghiệm thực chiến tại các ngân hàng số lớn",
  },
  {
    id: 3,
    name: "Lê Hoàng Vũ",
    role: "Lead UI/UX & Design System",
    exp: "6 năm kinh nghiệm",
    match: 88,
    avatar: "LV",
    tags: ["Figma", "Design Tokens", "User Research", "Mobile App"],
    matchReason: "Portfolio chuẩn UX Enterprise và Design System sẵn có",
  },
];

export function HeroSection() {
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState(CANDIDATE_FEED[0]);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleCandidateClick = (cand: typeof CANDIDATE_FEED[0]) => {
    setIsSimulatingScan(true);
    setSelectedCandidate(cand);
    setTimeout(() => setIsSimulatingScan(false), 500);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-gray-50/50 py-16 lg:py-24">
      {/* ─────────────────────────────────────────────── */}
      {/* AMBIENT AURORA MESH BACKGROUND                 */}
      {/* ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#10b981 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient Glowing Orbs */}
        <motion.div
          className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-emerald-400/25 via-teal-300/15 to-transparent blur-[100px]"
          animate={{ scale: [1, 1.08, 0.96, 1], rotate: [0, 10, -5, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-teal-300/20 via-blue-200/15 to-transparent blur-[100px]"
          animate={{ scale: [1, 0.95, 1.06, 1], rotate: [0, -8, 6, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">

          {/* ═══════════════════════════════════════════════ */}
          {/* LEFT COLUMN — Dynamic Headline & Value Prop     */}
          {/* ═══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-7"
          >
            {/* Top AI Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-emerald-200/90 shadow-xs shadow-emerald-500/5 hover:border-emerald-300 transition-colors"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Toppy AI Recruiter 2.0
              </span>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>99.4% Khớp JD</span>
              </div>
            </motion.div>

            {/* H1 Headline with Rotating Morphing Phrase */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black text-gray-900 leading-[1.12] tracking-tight">
                Tuyển dụng đỉnh cao với{" "}
                <span className="relative inline-block mt-1">
                  <span className="relative z-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                    AI Thông Minh
                  </span>
                  <span className="absolute -bottom-1.5 left-0 right-0 h-2 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-full opacity-70 -z-0" />
                </span>
              </h1>

              {/* Dynamic rotating subtitle */}
              <div className="h-12 mt-4 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhraseIndex}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-2 text-base sm:text-lg font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl"
                  >
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{ROTATING_PHRASES[activePhraseIndex]}</span>
                  </motion.div>
                </AnimatePresence>
              </div>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mt-4 max-w-xl font-normal">
                Khám phá kho dữ liệu <strong className="text-gray-900 font-extrabold">9.5 triệu+ ứng viên chất lượng cao</strong>.
                AI tự động phân tích CV, xếp hạng mức độ phù hợp và hỗ trợ phỏng vấn khép kín.
              </p>
            </div>

            {/* Main CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <motion.a
                href="/employer/dashboard"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center justify-center gap-2 h-13 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all overflow-hidden whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Đăng tin miễn phí ngay</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </motion.a>

              <motion.a
                href="#ai-demo"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 h-13 px-5 rounded-2xl bg-white border-2 border-gray-200 text-gray-800 font-bold text-sm sm:text-base hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all shadow-xs whitespace-nowrap shrink-0"
              >
                <PlayCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="whitespace-nowrap">Trải nghiệm AI Sandbox</span>
              </motion.a>
            </div>

            {/* Micro Trust badges */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-200/60">
              {[
                { icon: ShieldCheck, text: "Không cần thẻ tín dụng" },
                { icon: FileCheck, text: "Duyệt tin dưới 30 phút" },
                { icon: Users, text: "200.000+ HR tin dùng" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <item.icon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════════════ */}
          {/* RIGHT COLUMN — Interactive Live AI Mockup       */}
          {/* ═══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.15 }}
            className="lg:col-span-6 relative"
          >
            {/* Ambient Background Glow behind Mockup */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/15 via-teal-400/10 to-blue-500/10 blur-2xl -z-10" />

            {/* Main Interactive Dashboard Card */}
            <div className="relative rounded-3xl bg-gray-900 border border-gray-700/80 p-5 sm:p-6 shadow-2xl overflow-hidden text-white">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-gray-400">toppy-ai://live-matching</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">Live AI Engine</span>
                </div>
              </div>

              {/* Mini Stats Bar */}
              <div className="grid grid-cols-3 gap-2.5 my-4">
                <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700/60">
                  <p className="text-[10px] text-gray-400 font-medium">CV Đã quét</p>
                  <p className="text-base font-black text-white mt-0.5">3.418 hồ sơ</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700/60">
                  <p className="text-[10px] text-gray-400 font-medium">Tỷ lệ chính xác</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">96.8%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700/60">
                  <p className="text-[10px] text-gray-400 font-medium">Tiết kiệm</p>
                  <p className="text-base font-black text-teal-300 mt-0.5">14.5 Giờ/Tuần</p>
                </div>
              </div>

              {/* Candidate Selection List (Interactive) */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium px-1">
                  <span>Ứng viên AI đề xuất hàng đầu:</span>
                  <span className="text-[10px] text-emerald-400">Click chọn để xem AI phân tích</span>
                </div>

                {CANDIDATE_FEED.map((cand) => {
                  const isSelected = selectedCandidate.id === cand.id;
                  return (
                    <motion.div
                      key={cand.id}
                      onClick={() => handleCandidateClick(cand)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`cursor-pointer p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-950/40 border-emerald-500/70 shadow-md shadow-emerald-950/50"
                          : "bg-gray-800/40 border-gray-700/40 hover:bg-gray-800/70 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {cand.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white truncate">{cand.name}</p>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{cand.role} · {cand.exp}</p>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-sm font-black text-emerald-400">{cand.match}%</span>
                        </div>
                        <span className="text-[10px] text-gray-400">Match score</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Selected Candidate Deep Dive Box */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCandidate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-3.5 rounded-2xl bg-gray-950/80 border border-emerald-500/30 space-y-2.5 relative overflow-hidden"
                >
                  {isSimulatingScan && (
                    <motion.div
                      className="absolute inset-0 bg-emerald-500/10 pointer-events-none"
                      animate={{ opacity: [0, 0.4, 0] }}
                      transition={{ duration: 0.5 }}
                    />
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-300 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      Nhận xét của Toppy AI:
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Độ tin cậy 99%</span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-normal">
                    {selectedCandidate.matchReason}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedCandidate.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating Trust Indicator Pill */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-2 bg-white rounded-2xl p-3 shadow-xl border border-gray-100 flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-900">ATS Tích hợp sẵn</p>
                <p className="text-[10px] text-emerald-600 font-bold">Kéo thả ứng viên 1 chạm</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

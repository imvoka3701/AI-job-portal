import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconBrain,
  IconCompass,
  IconFileText,
  IconSparkles,
  IconCalculator,
  IconTargetArrow,
  IconRoute,
  IconSearch,
  IconArrowRight,
  IconLayersIntersect,
  IconAward,
  IconBolt,
  IconCash,
  IconFileCheck,
  IconChevronDown,
  IconHelpCircle
} from "@tabler/icons-react";
import { Button } from "@/components/ui";
import { Header } from "@/pages/jobs/components/Header";
import { Footer } from "@/pages/jobs/components/Footer";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { useUser, useIsAuthenticated } from "@/stores/authStore";
import { getMyAssessmentAttempts, type AssessmentAttempt } from "@/lib/api/assessments";
import { GrossNetCalculator } from "./components/GrossNetCalculator";

interface ToolItem {
  id: string;
  category: "assessment" | "ai" | "calculator";
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number; stroke?: number }>;
  tags: string[];
  gradient: string;
  glowColor: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeTone?: string;
  stats?: { label: string; value: string };
  link?: string;
  actionText: string;
  isInteractiveCalculator?: boolean;
}

const TOOLS: ToolItem[] = [
  // 1. AI Job Matching Score
  {
    id: "ai-matching",
    category: "ai",
    title: "AI Job Matching Score 2.0",
    subtitle: "Vector Embedding & AI Semantic Search",
    description: "Tự động phân tích sâu hồ sơ CV, so khớp kỹ năng và kinh nghiệm thực tế với hàng ngàn việc làm IT theo thời gian thực.",
    icon: IconTargetArrow,
    tags: ["AI Semantic", "Vector DB", "Khớp kỹ năng 98%"],
    gradient: "from-teal-500/20 via-emerald-500/10 to-transparent",
    glowColor: "hover:border-teal-400/80 hover:shadow-teal-500/15",
    iconBg: "bg-teal-50 border border-teal-100 text-teal-600",
    iconColor: "text-teal-600",
    badge: "Đột phá AI",
    badgeTone: "bg-teal-50 text-teal-700 border-teal-200",
    stats: { label: "Độ chuẩn xác", value: "98.4%" },
    link: "/ai/matching",
    actionText: "Khám phá AI Matching",
  },
  // 2. MBTI Personality Test
  {
    id: "mbti",
    category: "assessment",
    title: "Trắc nghiệm Tính cách MBTI",
    subtitle: "16 Nhóm tính cách công sở",
    description: "Khám phá xu hướng làm việc, phong cách giao tiếp, điểm mạnh cốt lõi và môi trường văn hóa doanh nghiệp phù hợp nhất với bạn.",
    icon: IconBrain,
    tags: ["16 Types", "Văn hóa công ty", "Điểm mạnh"],
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    glowColor: "hover:border-emerald-400/80 hover:shadow-emerald-500/15",
    iconBg: "bg-emerald-50 border border-emerald-100 text-emerald-600",
    iconColor: "text-emerald-600",
    badge: "Phổ biến nhất",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    stats: { label: "Thời lượng", value: "15 phút · 40 câu" },
    link: "/tools/mbti",
    actionText: "Bắt đầu làm test",
  },
  // 3. Gross Net Salary Calculator
  {
    id: "salary-calc",
    category: "calculator",
    title: "Tính Lương Gross ⇆ Net 2026",
    subtitle: "Chuẩn Luật BHXH & Thuế TNCN mới nhất",
    description: "Quy đổi 2 chiều chính xác: Giảm trừ 11tr/tháng, Lương cơ sở 2.340.000đ, 7 bậc thuế TNCN lũy tiến và mức đóng BHXH, BHYT, BHTN.",
    icon: IconCalculator,
    tags: ["Gross sang Net", "Net sang Gross", "Thuế TNCN"],
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    glowColor: "hover:border-emerald-400/80 hover:shadow-emerald-500/15",
    iconBg: "bg-emerald-50 border border-emerald-100 text-emerald-600",
    iconColor: "text-emerald-600",
    badge: "Luật 2026",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    stats: { label: "Quy đổi", value: "Tức thì (2 chiều)" },
    isInteractiveCalculator: true,
    actionText: "Mở bảng tính lương",
  },
  // 4. MI Multiple Intelligences
  {
    id: "mi",
    category: "assessment",
    title: "Trắc nghiệm Đa trí thông minh (MI)",
    subtitle: "8 Nhóm trí thông minh Howard Gardner",
    description: "Nhận diện nhóm năng lực tư duy nổi trội (Logic-Toán, Ngôn ngữ, Không gian...) để định hướng cách học và chọn chuyên ngành công nghệ.",
    icon: IconCompass,
    tags: ["8 Trí thông minh", "Tư duy logic", "Chọn role IT"],
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    glowColor: "hover:border-blue-400/80 hover:shadow-blue-500/15",
    iconBg: "bg-blue-50 border border-blue-100 text-blue-600",
    iconColor: "text-blue-600",
    badge: "Chuẩn quốc tế",
    badgeTone: "bg-blue-50 text-blue-700 border-blue-200",
    stats: { label: "Thời lượng", value: "12 phút · 32 câu" },
    link: "/tools/mi",
    actionText: "Bắt đầu làm test",
  },
  // 5. AI Career Roadmap
  {
    id: "ai-roadmap",
    category: "ai",
    title: "AI Career Roadmap Builder",
    subtitle: "Lộ trình thăng tiến cá nhân hóa",
    description: "Nhập vị trí hiện tại và mục tiêu nghề nghiệp (VD: Mid Frontend → Solutions Architect) để AI sinh lộ trình 3-6-12 tháng chi tiết.",
    icon: IconRoute,
    tags: ["Thăng tiến", "Kỹ năng cần học", "Lộ trình 12 tháng"],
    gradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
    glowColor: "hover:border-indigo-400/80 hover:shadow-indigo-500/15",
    iconBg: "bg-indigo-50 border border-indigo-100 text-indigo-600",
    iconColor: "text-indigo-600",
    badge: "Cá nhân hóa",
    badgeTone: "bg-indigo-50 text-indigo-700 border-indigo-200",
    stats: { label: "Thời gian tạo", value: "1 phút" },
    link: "/ai/roadmap",
    actionText: "Tạo lộ trình AI",
  },
  // 6. AI CV Builder & ATS Audit
  {
    id: "cv-builder",
    category: "ai",
    title: "AI CV Builder & Tối Ưu ATS",
    subtitle: "Trình tạo CV chuẩn thuật toán lọc",
    description: "Thiết kế CV chuẩn quốc tế, tự động phân tích từ khóa chuyên môn và tối ưu tỷ lệ vượt qua hệ thống quét hồ sơ tự động của doanh nghiệp.",
    icon: IconFileText,
    tags: ["Điểm ATS 90+", "AI Reviewer", "Xuất PDF chuẩn"],
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    glowColor: "hover:border-amber-400/80 hover:shadow-amber-500/15",
    iconBg: "bg-amber-50 border border-amber-100 text-amber-600",
    iconColor: "text-amber-600",
    badge: "ATS 90+",
    badgeTone: "bg-amber-50 text-amber-700 border-amber-200",
    stats: { label: "Định dạng", value: "Chuẩn ATS Quốc tế" },
    link: "/cv",
    actionText: "Tạo & Tối ưu CV",
  },
];

// Interactive Personas for the Live Demo Radar
const PERSONA_DEMOS = [
  {
    id: "intj",
    name: "INTJ (Kiến Trúc Sư)",
    role: "Senior Fullstack / AI Engineer",
    matchScore: 96,
    mbtiBadge: "INTJ",
    salary: "35.500.000 đ",
    topSkill: "System Architecture",
    color: "emerald",
  },
  {
    id: "enfp",
    name: "ENFP (Người Truyền Cảm Hứng)",
    role: "Product Manager / AI Advocate",
    matchScore: 92,
    mbtiBadge: "ENFP",
    salary: "28.000.000 đ",
    topSkill: "Product Discovery",
    color: "teal",
  },
  {
    id: "entp",
    name: "ENTP (Người Nhìn Xa)",
    role: "Solutions Architect & Tech Lead",
    matchScore: 98,
    mbtiBadge: "ENTP",
    salary: "45.000.000 đ",
    topSkill: "Cloud Strategy",
    color: "indigo",
  },
];

const FAQS = [
  {
    q: "Các bài trắc nghiệm tính cách (MBTI, MI) có miễn phí không?",
    a: "Hoàn toàn miễn phí 100%. Bạn có thể làm bài kiểm tra bất kỳ lúc nào và lưu kết quả vĩnh viễn vào hồ sơ ứng viên cá nhân."
  },
  {
    q: "AI Job Matching Score hoạt động như thế nào?",
    a: "Hệ thống sử dụng Vector Embedding và giải thuật Cosine Similarity trong cơ sở dữ liệu pgvector để so khớp ngữ nghĩa sâu giữa kỹ năng trong CV và yêu cầu tuyển dụng thực tế."
  },
  {
    q: "Bảng tính lương Gross ⇆ Net đã áp dụng quy định mới nhất chưa?",
    a: "Đã cập nhật đầy đủ mức giảm trừ gia cảnh 11 triệu/tháng, 4.4 triệu/người phụ thuộc, lương cơ sở mới 2.340.000đ và mức lương tối thiểu 4 vùng theo quy định mới nhất 2026."
  }
];

export function ToolsLandingPage() {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "assessment" | "ai" | "calculator">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentAttempt, setRecentAttempt] = useState<AssessmentAttempt | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [activePersonaIdx, setActivePersonaIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const activePersona = PERSONA_DEMOS[activePersonaIdx];

  useEffect(() => {
    if (user?.role === "candidate") {
      getMyAssessmentAttempts()
        .then((attempts) => {
          if (attempts && attempts.length > 0) {
            setRecentAttempt(attempts[0]);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchCategory = selectedCategory === "all" || tool.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      <SEOMeta
        title="Trung Tâm Công Cụ AI & Định Hướng Nghề Nghiệp | AI Job Portal"
        description="Bộ công cụ định hướng thông minh: Trắc nghiệm MBTI, MI, bảng tính lương Gross ⇆ Net chuẩn 2026, AI Matching Score và Lộ trình thăng tiến AI."
        canonicalUrl="https://ai-job-portal.com/tools"
      />
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full space-y-12">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION WITH INTERACTIVE LIVE RADAR DEMO                          */}
        {/* ========================================================================= */}
        <section className="relative rounded-[32px] overflow-hidden bg-gradient-to-b from-white via-[#F0FDF4]/30 to-white border border-emerald-900/10 p-8 sm:p-12 lg:p-14 shadow-sm">
          {/* Ambient diffuse background glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content (7 Cols) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-extrabold tracking-wide backdrop-blur-sm shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="flex items-center gap-1.5">
                  <IconSparkles size={14} className="text-emerald-600" /> AI Career Hub 2026
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
                Định Hướng Năng Lực,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
                  Tối Ưu Sự Nghiệp
                </span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
                Hệ sinh thái công cụ hỗ trợ toàn diện: Trắc nghiệm tâm lý học chuẩn quốc tế, Trợ lý AI phân tích độ khớp CV và Tiện ích tính lương Gross ⇆ Net minh bạch.
              </p>

              {/* Value metrics row with interactive hover bounce */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                {[
                  { value: "50.000+", label: "Ứng viên đã test", color: "text-slate-900" },
                  { value: "98.4%", label: "Độ khớp AI Match", color: "text-emerald-600" },
                  { value: "100%", label: "Miễn phí trọn đời", color: "text-teal-600" },
                ].map((metric, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-shadow hover:shadow-md cursor-default"
                  >
                    <div className={`text-xl font-black ${metric.color}`}>{metric.value}</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{metric.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Live Interactive Showcase Card (5 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 relative"
            >
              <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-emerald-200/90 p-6 shadow-xl shadow-emerald-950/5 space-y-5">
                
                {/* Showcase Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-sm"
                    >
                      <IconSparkles size={20} />
                    </motion.div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">AI Profile Radar</h4>
                      <p className="text-[11px] text-slate-500">Mô phỏng phân tích ứng viên</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Demo
                  </span>
                </div>

                {/* Interactive Persona Tabs Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Chọn hồ sơ mẫu để mô phỏng:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    {PERSONA_DEMOS.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setActivePersonaIdx(idx)}
                        className={`relative py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activePersonaIdx === idx
                            ? "text-slate-900 shadow-2xs font-black"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {activePersonaIdx === idx && (
                          <motion.div
                            layoutId="activePersonaPill"
                            className="absolute inset-0 bg-white rounded-lg shadow-2xs"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{p.mbtiBadge}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Dynamic Results with Motion Transition */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePersona.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2.5"
                  >
                    <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconBrain size={16} className="text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700">MBTI Type:</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-800 px-2 py-0.5 bg-emerald-100/70 rounded-md">
                        {activePersona.name}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700 flex items-center gap-1.5">
                          <IconTargetArrow size={15} className="text-teal-600" /> AI Skill Match ({activePersona.role}):
                        </span>
                        <span className="text-emerald-600 font-extrabold">{activePersona.matchScore}% Phù hợp</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${activePersona.matchScore}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-bold flex items-center gap-1.5">
                        <IconCalculator size={15} className="text-amber-600" /> Lương Net đề xuất:
                      </span>
                      <span className="font-black text-slate-900 text-sm">{activePersona.salary}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Quick CTA */}
                <Link to="/tools/mbti" className="block w-full">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs py-3 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer">
                      <span>Bắt đầu làm bài test của bạn</span>
                      <IconArrowRight size={15} />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. RECENT ASSESSMENT RESULT BANNER (Authenticated Candidate)              */}
        {/* ========================================================================= */}
        {recentAttempt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-black shrink-0 shadow-xs">
                <span className="text-base leading-none">{recentAttempt.result.code}</span>
                <span className="text-[8px] uppercase tracking-wider text-emerald-200 mt-0.5">Profile</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                    Kết quả gần nhất ({recentAttempt.assessment_type.toUpperCase()})
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {recentAttempt.result.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                  {recentAttempt.result.summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              <Link to="/tools/assessments/history">
                <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white text-xs">
                  Xem lịch sử bài test
                </Button>
              </Link>
              <Link to="/jobs">
                <Button size="sm" className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  Xem việc làm phù hợp
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. CONTROL & SEARCH BAR (Liquid Tab Bar with layoutId)                    */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Category Tabs with Apple/Linear Liquid Glide Indicator */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto relative">
            {[
              { id: "all", label: "Tất cả công cụ", icon: IconLayersIntersect },
              { id: "assessment", label: "Trắc nghiệm", icon: IconBrain },
              { id: "ai", label: "Trợ lý AI", icon: IconSparkles },
              { id: "calculator", label: "Tính lương & Thuế", icon: IconCalculator },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id as typeof selectedCategory);
                    if (tab.id === "calculator") setShowCalculator(true);
                  }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap z-10 ${
                    active ? "text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 bg-emerald-600 rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Icon size={16} className={`relative z-10 ${active ? "text-white" : "text-slate-400"}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar with Focus Animation */}
          <div className="relative w-full md:w-72">
            <IconSearch size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công cụ..."
              className="w-full pl-9.5 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. EMBEDDED GROSS ⇆ NET CALCULATOR                                        */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {(showCalculator || selectedCategory === "calculator") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <GrossNetCalculator onClose={() => setShowCalculator(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 5. BENTO GRID OF TOOLS (Fluid Layout & Spring Physics)                    */}
        {/* ========================================================================= */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  whileHover={{ y: -8, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="flex"
                >
                  <div
                    className={`w-full flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs hover:shadow-2xl transition-all duration-300 relative group overflow-hidden ${tool.glowColor}`}
                  >
                    {/* Top ambient color stripe */}
                    <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${tool.gradient}`} />

                    <div className="space-y-4">
                      {/* Header: Icon with Hover Rotation + Badge */}
                      <div className="flex items-start justify-between">
                        <motion.div
                          whileHover={{ rotate: 12, scale: 1.1 }}
                          className={`w-12 h-12 rounded-2xl ${tool.iconBg} flex items-center justify-center font-bold shadow-2xs transition-transform`}
                        >
                          <Icon size={24} stroke={1.8} />
                        </motion.div>
                        {tool.badge && (
                          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs ${tool.badgeTone}`}>
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      {/* Titles */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {tool.subtitle}
                        </span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {tool.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3">
                        {tool.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tool.tags.map((t) => (
                          <span key={t} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200/70">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Meta & Action */}
                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                      {tool.stats ? (
                        <span className="text-xs font-semibold text-slate-500">
                          {tool.stats.value}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Hoàn toàn miễn phí</span>
                      )}

                      {tool.isInteractiveCalculator ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            onClick={() => setShowCalculator(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs py-2 px-3.5 shadow-sm cursor-pointer flex items-center gap-1.5 group-hover:shadow-md"
                          >
                            <span>{tool.actionText}</span>
                            <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </motion.div>
                      ) : (
                        <Link to={tool.link || "#"}>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              className="bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs py-2 px-3.5 shadow-sm transition-colors flex items-center gap-1.5 group-hover:shadow-md"
                            >
                              <span>{tool.actionText}</span>
                              <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </motion.div>
                        </Link>
                      )}
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ========================================================================= */}
        {/* 6. VALUE PROPOSITIONS SECTION WITH TILT & SPRING                          */}
        {/* ========================================================================= */}
        <section className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-10 shadow-xs space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
              <IconAward size={15} /> <span>Lợi ích độc quyền</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tại Sao Nên Định Hướng Cùng AI Job Portal?
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Mọi công cụ đều được thiết kế dựa trên tiêu chuẩn tuyển dụng công nghệ cao, giúp bạn tiết kiệm thời gian và tạo lợi thế cạnh tranh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: IconTargetArrow,
                title: "Định Vị Chuẩn Xác",
                desc: "Nhận diện chính xác phong cách làm việc, văn hóa doanh nghiệp phù hợp và nhóm năng lực tư duy nổi trội.",
                badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
              },
              {
                icon: IconBolt,
                title: "Tăng Tỷ Lệ Trúng Tuyển",
                desc: "Tự động gắn huy hiệu kết quả đánh giá vào CV Builder để tăng 40% độ tin cậy đối với các nhà tuyển dụng IT hàng đầu.",
                badgeBg: "bg-teal-50 text-teal-600 border-teal-100",
              },
              {
                icon: IconCash,
                title: "Minh Bạch Thu Nhập",
                desc: "Nắm rõ bảng lương thực nhận (Net) và chi phí doanh nghiệp chi trả (Gross) để đàm phán mức thu nhập tối ưu.",
                badgeBg: "bg-amber-50 text-amber-600 border-amber-100",
              },
            ].map((prop, idx) => {
              const PropIcon = prop.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="p-6 rounded-2xl bg-[#FAFCFB] border border-slate-200/70 space-y-3.5 hover:border-emerald-300 hover:shadow-md transition-all cursor-default"
                >
                  <div className={`w-11 h-11 rounded-xl ${prop.badgeBg} flex items-center justify-center font-bold border shadow-2xs`}>
                    <PropIcon size={22} />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">{prop.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{prop.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. INTERACTIVE FAQ ACCORDION SECTION                                      */}
        {/* ========================================================================= */}
        <section className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <IconHelpCircle size={20} className="text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">Câu Hỏi Thường Gặp Về Bộ Công Cụ</h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 hover:text-emerald-700 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconChevronDown size={18} className="text-slate-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. BOTTOM CTA SECTION WITH HIGH CONTRAST & RADIANT GLOW                   */}
        {/* ========================================================================= */}
        <div className="relative rounded-[32px] overflow-hidden bg-[#0A1A17] border border-emerald-900/30 p-8 sm:p-10 lg:p-12 text-white shadow-2xl shadow-emerald-950/20 mb-12">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/15 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3 text-left max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
                <IconFileCheck size={14} /> <span>Chuẩn định dạng ATS 2026</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Sẵn sàng tạo CV và tìm kiếm công việc mơ ước?
              </h3>
              <p className="text-emerald-50/80 text-sm sm:text-base font-light leading-relaxed">
                Đồng bộ hóa kết quả đánh giá năng lực của bạn vào CV chuẩn ATS ngay hôm nay để nhận gợi ý việc làm tự động từ AI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 shrink-0">
              {isAuthenticated ? (
                <Link to="/tools/assessments/history">
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      variant="outline"
                      className="h-12 px-6 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-sm transition-all cursor-pointer"
                    >
                      Lịch sử đánh giá
                    </Button>
                  </motion.div>
                </Link>
              ) : (
                <Link to="/login">
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      variant="outline"
                      className="h-12 px-6 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-sm transition-all cursor-pointer"
                    >
                      Đăng nhập
                    </Button>
                  </motion.div>
                </Link>
              )}
              <Link to="/cv">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    className="h-12 px-7 rounded-full font-bold text-sm bg-white text-[#0A1A17] hover:bg-emerald-50 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_45px_rgba(255,255,255,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Tạo CV chuẩn ATS ngay</span>
                    <IconArrowRight size={16} className="text-emerald-700" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* Render Footer without the duplicate negative margin CTA */}
      <Footer showTopCTA={false} />
    </div>
  );
}

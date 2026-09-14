import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  Wrench,
  Briefcase,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Bot,
  Users,
} from "lucide-react";

interface TalentDiscoveryHubProps {
  companyName: string;
  onSelectPreset: (queryText: string) => void;
}

const TALENT_ARCHETYPES = [
  {
    role: "Senior Fullstack Lead",
    level: "3-5+ năm kinh nghiệm",
    badge: "Toàn diện",
    query: "Senior Fullstack Engineer làm chủ cả Frontend React TypeScript và Backend Python FastAPI, có kinh nghiệm Docker",
    skills: ["React", "TypeScript", "FastAPI", "Docker", "PostgreSQL"],
    icon: Briefcase,
    iconBg: "bg-indigo-50 text-indigo-700",
    borderHover: "hover:border-indigo-400",
  },
  {
    role: "Backend & Systems Lead",
    level: "Chuyên sâu hiệu năng",
    badge: "API & CSDL",
    query: "Backend Developer thành thạo Python, FastAPI, PostgreSQL và kiến trúc Microservices",
    skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Kafka"],
    icon: Wrench,
    iconBg: "bg-purple-50 text-purple-700",
    borderHover: "hover:border-purple-400",
  },
  {
    role: "Frontend UI/UX Specialist",
    level: "Giao diện hiện đại",
    badge: "Web Application",
    query: "Frontend Engineer có kinh nghiệm React, TypeScript, Tailwind CSS và tối ưu trải nghiệm người dùng",
    skills: ["React", "TypeScript", "Tailwind CSS", "Zustand", "Next.js"],
    icon: Code2,
    iconBg: "bg-blue-50 text-blue-700",
    borderHover: "hover:border-blue-400",
  },
  {
    role: "GenAI & Data Engineer",
    level: "Trí tuệ nhân tạo",
    badge: "RAG & LLM",
    query: "Kỹ sư AI có kinh nghiệm tích hợp LLM, xây dựng RAG Pipeline và Vector Database",
    skills: ["LLM", "RAG", "pgvector", "LangChain", "Python"],
    icon: Sparkles,
    iconBg: "bg-amber-50 text-amber-700",
    borderHover: "hover:border-amber-400",
  },
];

export function TalentDiscoveryHub({
  companyName,
  onSelectPreset,
}: TalentDiscoveryHubProps) {
  return (
    <div className="space-y-6 pt-2">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Chân Dung Nhân Tài Mục Tiêu (Talent Archetypes)
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Chọn một nhóm kỹ năng bên dưới để quét nhanh hồ sơ đang nộp vào {companyName}
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          Khám phá 1-chạm bằng AI
        </span>
      </div>

      {/* ── 4 Talent Archetype Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TALENT_ARCHETYPES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.role}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelectPreset(item.query)}
              className={`p-5 rounded-2xl bg-white border border-slate-200/90 ${item.borderHover} hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.role}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {item.level}
                  </p>
                </div>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-50 text-slate-600 border border-slate-200/70"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Quét hồ sơ ngay</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 3 Enterprise Value Props ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">Bảo Mật Nội Bộ Tuyệt Đối</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              Hệ thống chỉ quét các ứng viên đã nộp đơn vào {companyName}. Dữ liệu tuyển dụng hoàn toàn độc lập và bảo mật.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">Tìm Kiếm Ngữ Nghĩa Kép</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              Kết hợp Vector Search (all-MiniLM-L6-v2) để hiểu ngữ cảnh dự án và BM25 bắt chuẩn xác từ khóa kỹ thuật.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">CV Copilot Bằng Chứng Thực</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              AI trả lời có dẫn chứng từng đoạn Chunk cụ thể từ CV gốc, tuyệt đối chống ảo giác (Zero Hallucination).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

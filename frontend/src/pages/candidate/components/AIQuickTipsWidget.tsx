import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Target, ArrowRight, Lightbulb, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui";

const INTERVIEW_TIPS = [
  {
    tag: "Phương pháp STAR",
    title: "Công thức vàng trả lời câu hỏi hành vi",
    desc: "Mô tả Tình huống (Situation) → Nhiệm vụ (Task) → Hành động cụ thể (Action) → Kết quả định lượng (Result).",
  },
  {
    tag: "Tối ưu ATS",
    title: "Khớp từ khóa kỹ thuật với JD tuyển dụng",
    desc: "Đảm bảo các kỹ năng chính trong JD (ví dụ: React, FastAPI, PostgreSQL) xuất hiện rõ nét trong mục Kinh nghiệm & Dự án.",
  },
  {
    tag: "Phỏng vấn AI",
    title: "Luyện phỏng vấn thử trước khi gặp HR",
    desc: "Sử dụng tính năng Lộ trình & Chatbot AI để nhận phản hồi chi tiết về độ trôi chảy và chiều sâu kiến trúc hệ thống.",
  },
];

export function AIQuickTipsWidget() {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % INTERVIEW_TIPS.length);
  };

  const tip = INTERVIEW_TIPS[currentTipIndex];

  return (
    <Card className="rounded-[32px] border-slate-200/90 shadow-xs bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 space-y-4 relative overflow-hidden group">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="p-0 border-b border-slate-800 pb-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Lightbulb size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Bí Kíp Phỏng Vấn AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Chiến thuật chinh phục nhà tuyển dụng</p>
          </div>
        </div>

        <button
          onClick={nextTip}
          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-1 cursor-pointer"
          title="Đổi mẹo tiếp theo"
        >
          <span>Đổi mẹo</span>
          <ChevronRight size={12} />
        </button>
      </CardHeader>

      <CardContent className="p-0 space-y-4 relative z-10">
        {/* Tip Box */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2 backdrop-blur-xs">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
            {tip.tag}
          </div>
          <h4 className="text-xs font-bold text-white leading-snug">
            {tip.title}
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            {tip.desc}
          </p>
        </div>

        {/* Quick Nav Action Links */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            to="/ai/roadmap"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/40 text-slate-200 hover:text-white transition-all flex flex-col gap-1 group/btn"
          >
            <div className="flex items-center justify-between text-emerald-400">
              <Bot size={15} />
              <ArrowRight size={12} className="opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
            </div>
            <span className="text-[11px] font-bold">Lộ Trình AI</span>
            <span className="text-[9px] text-slate-400">Ôn luyện kịch bản</span>
          </Link>

          <Link
            to="/ai/matching"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/40 text-slate-200 hover:text-white transition-all flex flex-col gap-1 group/btn"
          >
            <div className="flex items-center justify-between text-indigo-400">
              <Target size={15} />
              <ArrowRight size={12} className="opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
            </div>
            <span className="text-[11px] font-bold">Điểm Khớp JD</span>
            <span className="text-[9px] text-slate-400">Đo độ tương thích</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

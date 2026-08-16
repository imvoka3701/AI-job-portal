import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Play, RefreshCw, Layers } from "lucide-react";

interface RoleOption {
  id: string;
  title: string;
  department: string;
  requirements: string[];
}

interface SampleCandidate {
  id: string;
  name: string;
  experience: string;
  matchScore: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    culture: number;
  };
  strengths: string[];
  gaps: string[];
  suggestedQuestions: string[];
}

const SAMPLE_ROLES: RoleOption[] = [
  {
    id: "frontend",
    title: "Senior Frontend Engineer (React / Next.js)",
    department: "Engineering",
    requirements: ["React 18+", "TypeScript", "State Management", "Tailwind/CSS", "Performance Optimization"],
  },
  {
    id: "backend",
    title: "Lead Backend Developer (Python / FastAPI)",
    department: "Backend Team",
    requirements: ["FastAPI / Django", "PostgreSQL / pgvector", "Microservices Architecture", "Redis & Celery", "Docker / K8s"],
  },
  {
    id: "pm",
    title: "Senior Product Manager (B2B SaaS)",
    department: "Product",
    requirements: ["Product Roadmap", "User Research", "Data-driven Decision Making", "Fintech / B2B Experience", "Agile Leadership"],
  },
];

const CANDIDATES_BY_ROLE: Record<string, SampleCandidate[]> = {
  frontend: [
    {
      id: "c1",
      name: "Nguyễn Hoàng Nam",
      experience: "5 năm kinh nghiệm",
      matchScore: 94,
      breakdown: { skills: 96, experience: 92, education: 90, culture: 95 },
      strengths: [
        "Thành thạo React 18, Server Components & Next.js App Router",
        "Có kinh nghiệm lead team 6 frontend engineers",
        "Tối ưu Core Web Vitals xuất sắc (LCP < 1.2s)",
      ],
      gaps: ["Chưa có nhiều kinh nghiệm sâu với WebGL / 3D Canvas"],
      suggestedQuestions: [
        "Bạn tối ưu Bundle Size và Rendering Performance trong dự án Next.js quy mô lớn như thế nào?",
        "Chia sẻ cách bạn thiết lập Architecture Design System cho cả Web & Mobile?",
      ],
    },
    {
      id: "c2",
      name: "Phạm Thanh Thảo",
      experience: "3 năm kinh nghiệm",
      matchScore: 78,
      breakdown: { skills: 82, experience: 75, education: 85, culture: 80 },
      strengths: [
        "Code TypeScript chuẩn strict mode, nắm vững Tailwind CSS",
        "Tư duy UI/UX thẩm mỹ tốt, làm việc linh hoạt",
      ],
      gaps: ["Cần thêm kinh nghiệm về Kiến trúc Micro-frontend & CI/CD pipeline"],
      suggestedQuestions: [
        "Bạn đã từng giải quyết bài toán State synchronization phức tạp giữa các components như thế nào?",
      ],
    },
  ],
  backend: [
    {
      id: "c3",
      name: "Vũ Đức Long",
      experience: "6 năm kinh nghiệm",
      matchScore: 96,
      breakdown: { skills: 98, experience: 95, education: 92, culture: 96 },
      strengths: [
        "Chuyên sâu FastAPI, SQLAlchemy async và Vector Search (pgvector)",
        "Thiết kế kiến trúc chịu tải 20.000 QPS tại công ty cũ",
        "Tư duy bảo mật API OAuth2 & Data encryption chuẩn Enterprise",
      ],
      gaps: ["Cần làm quen với nghiệp vụ domain nhân sự (HR Tech)"],
      suggestedQuestions: [
        "Chiến lược scale database PostgreSQL khi lượng embedding vector vượt mốc 10 triệu bản ghi?",
        "Cách bạn xử lý idempotency và rate limiting trong distributed systems?",
      ],
    },
    {
      id: "c4",
      name: "Lê Quốc Trung",
      experience: "3.5 năm kinh nghiệm",
      matchScore: 72,
      breakdown: { skills: 75, experience: 70, education: 80, culture: 75 },
      strengths: ["Làm việc tốt với Python/Django, database relational cơ bản"],
      gaps: ["Chưa có kinh nghiệm thực tế với pgvector & LLM API integration"],
      suggestedQuestions: ["Sự khác biệt giữa synchronous vs asynchronous execution trong Python FastAPI?"],
    },
  ],
  pm: [
    {
      id: "c5",
      name: "Đỗ Mai Anh",
      experience: "5 năm kinh nghiệm",
      matchScore: 92,
      breakdown: { skills: 94, experience: 90, education: 95, culture: 92 },
      strengths: [
        "Từng build thành công sản phẩm B2B SaaS đạt ARR 2 triệu USD",
        "Kỹ năng Product Discovery & UX interview chuyên sâu",
        "Phân tích dữ liệu Amplitude, Mixpanel xuất sắc",
      ],
      gaps: ["Kiến thức kỹ thuật backend ở mức khái quát"],
      suggestedQuestions: [
        "Cách bạn ưu tiên Feature Backlog khi có sự xung đột giữa Sales Team và Engineering Team?",
        "Metrics quan trọng nhất bạn theo dõi trong giai đoạn Product-Market Fit là gì?",
      ],
    },
  ],
};

export function InteractiveAISimulatorSection() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>(SAMPLE_ROLES[0]);
  const candidates = CANDIDATES_BY_ROLE[selectedRole.id] || CANDIDATES_BY_ROLE.frontend;
  const [selectedCandidate, setSelectedCandidate] = useState<SampleCandidate>(candidates[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasScanned, setHasScanned] = useState(true);

  const handleRoleChange = (role: RoleOption) => {
    setSelectedRole(role);
    const newCandidates = CANDIDATES_BY_ROLE[role.id] || [];
    setSelectedCandidate(newCandidates[0] || candidates[0]);
  };

  const handleCandidateChange = (cand: SampleCandidate) => {
    setSelectedCandidate(cand);
  };

  const runSimulation = () => {
    setIsAnalyzing(true);
    setHasScanned(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasScanned(true);
    }, 1000);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50/80 via-white to-gray-50/50 relative overflow-hidden" id="ai-demo">
      {/* Background ambient orbs */}
      <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-96 h-96 rounded-full bg-teal-300/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Trải Nghiệm AI Trực Quan
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-4 leading-tight">
            Thử nghiệm{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Chấm Điểm CV
            </span>{" "}
            bằng Toppy AI
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-4 font-normal">
            Chọn vị trí tuyển dụng mẫu và xem Toppy AI phân tích độ tương thích, điểm mạnh, điểm yếu cùng bộ câu hỏi phỏng vấn đề xuất theo thời gian thực.
          </p>
        </div>

        {/* Main Interactive Sandbox Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ═══════════════════════════════════════════════ */}
          {/* LEFT: Role & Candidate Selection Controls      */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Pick Role */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Bước 1: Chọn Vị trí Tuyển dụng (JD)
                </span>
                <Layers className="w-4 h-4 text-gray-400" />
              </div>

              <div className="space-y-2.5">
                {SAMPLE_ROLES.map((role) => {
                  const isSelected = selectedRole.id === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleChange(role)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-500 shadow-xs text-emerald-950 font-bold"
                          : "bg-gray-50/60 border-gray-200/80 hover:bg-white hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">{role.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{role.department}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {role.requirements.slice(0, 3).map((req) => (
                            <span key={req} className="text-[10px] bg-white/80 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Pick Candidate */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                  Bước 2: Chọn Hồ sơ Ứng viên mẫu
                </span>
                <Bot className="w-4 h-4 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {candidates.map((cand) => {
                  const isSelected = selectedCandidate.id === cand.id;
                  return (
                    <button
                      key={cand.id}
                      onClick={() => handleCandidateChange(cand)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                          : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300 text-gray-800"
                      }`}
                    >
                      <p className="font-extrabold text-sm truncate">{cand.name}</p>
                      <p className={`text-xs mt-0.5 ${isSelected ? "text-emerald-100" : "text-gray-500"}`}>
                        {cand.experience}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/20">
                        <span className={`text-[11px] font-semibold ${isSelected ? "text-emerald-100" : "text-gray-600"}`}>
                          Match Score
                        </span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-white text-emerald-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {cand.matchScore}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action trigger button */}
              <button
                onClick={runSimulation}
                disabled={isAnalyzing}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Toppy AI đang quét CV...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Phân tích lại với Toppy AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* RIGHT: Live AI Assessment Result Card           */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-gray-900 text-white p-6 sm:p-8 border border-gray-700/80 shadow-2xl relative overflow-hidden">
              
              {/* Top ambient glow inside card */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Header inside result card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{selectedCandidate.name}</h3>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                        Đã xác minh
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Ứng tuyển: <strong className="text-gray-200">{selectedRole.title}</strong>
                    </p>
                  </div>
                </div>

                {/* Score badge */}
                <div className="flex items-center gap-3 bg-gray-800/80 border border-gray-700 px-4 py-2 rounded-2xl shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-400 leading-none">
                      {isAnalyzing ? "..." : `${selectedCandidate.matchScore}%`}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">Toppy AI Score</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
                </div>
              </div>

              {/* Scanning Overlay Animation when active */}
              {isAnalyzing && (
                <div className="py-20 text-center space-y-4">
                  <motion.div
                    className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-sm font-bold text-emerald-400">Đang bóc tách kỹ năng & so khớp với JD...</p>
                </div>
              )}

              {/* Assessment Content Details */}
              {!isAnalyzing && hasScanned && (
                <div className="space-y-6 pt-6">
                  {/* 4 Score Breakdown Bars */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                      Chi tiết mức độ phù hợp (Breakdown)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Kỹ năng chuyên môn", score: selectedCandidate.breakdown.skills },
                        { label: "Kinh nghiệm thực chiến", score: selectedCandidate.breakdown.experience },
                        { label: "Học vấn & Chứng chỉ", score: selectedCandidate.breakdown.education },
                        { label: "Độ phù hợp văn hóa", score: selectedCandidate.breakdown.culture },
                      ].map((item) => (
                        <div key={item.label} className="p-3 rounded-2xl bg-gray-800/70 border border-gray-700/60 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[11px] text-gray-400 font-medium truncate">{item.label}</span>
                            <span className="text-xs font-black text-emerald-400">{item.score}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-gray-700 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.score}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Gaps 2 Cols */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Điểm mạnh nổi bật</span>
                      </div>
                      <ul className="space-y-1.5">
                        {selectedCandidate.strengths.map((str, i) => (
                          <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Gaps / Needs Attention */}
                    <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Điểm cần lưu ý</span>
                      </div>
                      <ul className="space-y-1.5">
                        {selectedCandidate.gaps.map((gap, i) => (
                          <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suggested Interview Questions */}
                  <div className="p-4 rounded-2xl bg-gray-800/80 border border-gray-700/80 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-teal-300 text-xs font-bold">
                      <HelpCircle className="w-4 h-4" />
                      <span>Câu hỏi phỏng vấn Toppy AI đề xuất:</span>
                    </div>
                    <div className="space-y-2">
                      {selectedCandidate.suggestedQuestions.map((q, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-700/60 text-xs text-gray-300 font-sans flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">Q{i + 1}:</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA inside result */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-800">
                    <p className="text-xs text-gray-400">
                      Thử nghiệm trên dữ liệu mẫu của AI Job Portal
                    </p>
                    <a
                      href="/employer/dashboard"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-black text-xs transition-colors"
                    >
                      <span>Trải nghiệm trên CV thực tế của bạn</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

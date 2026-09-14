import { Sparkles, Building2, ShieldCheck, Database, Cpu, Target } from "lucide-react";

interface TalentSearchHeaderProps {
  companyName: string;
  candidateCount?: number;
  jobCount?: number;
}

export function TalentSearchHeader({
  companyName,
  candidateCount = 24,
  jobCount = 5,
}: TalentSearchHeaderProps) {
  return (
    <div className="space-y-4">
      {/* ── Main Studio Title & Tenant Badge ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  AI Talent Intelligence Studio
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                  RAG Hybrid
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Truy vấn ngữ nghĩa tự nhiên & trích xuất bằng chứng xác thực từ kho hồ sơ nội bộ doanh nghiệp
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Scope Pill */}
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0 self-start md:self-auto">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[200px]">
                {companyName}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Nội bộ
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Cách ly tenant • Không rò rỉ dữ liệu
            </span>
          </div>
        </div>
      </div>

      {/* ── Live Studio Micro-Metrics Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/50 shadow-2xs">
          <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 text-[11px] block">Kho ứng viên nội bộ</span>
            <span className="font-bold text-slate-800 text-xs">
              {candidateCount}+ hồ sơ đã nộp
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/50 shadow-2xs">
          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 text-[11px] block">Vị trí tuyển dụng</span>
            <span className="font-bold text-slate-800 text-xs">
              {jobCount} pipeline đang mở
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/50 shadow-2xs">
          <Cpu className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 text-[11px] block">Công nghệ truy vấn</span>
            <span className="font-bold text-slate-800 text-xs">
              Vector (HNSW) + BM25
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/50 shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 text-[11px] block">Độ trễ phản hồi</span>
            <span className="font-bold text-emerald-700 text-xs">
              Tức thì ~0.4s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

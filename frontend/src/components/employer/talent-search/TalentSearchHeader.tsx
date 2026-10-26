import { Sparkles, Building2, ShieldCheck } from "lucide-react";

interface TalentSearchHeaderProps {
  companyName: string;
  candidateCount?: number;
  jobCount?: number;
}

export function TalentSearchHeader({
  companyName,
  candidateCount = 24,
  jobCount = 4,
}: TalentSearchHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
      {/* ── Studio Title ── */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Tìm kiếm Nhân tài AI
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              RAG Hybrid
            </span>
            <span className="hidden md:inline text-xs text-slate-400 font-normal">
              • {candidateCount} hồ sơ trong kho nội bộ ({jobCount} vị trí tuyển)
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Truy vấn ngữ nghĩa tự nhiên & trích xuất đối sánh CV tự động
          </p>
        </div>
      </div>

      {/* ── Tenant Badge ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs self-start sm:self-auto text-xs">
        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
        <span className="font-semibold text-slate-800">{companyName}</span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Nội bộ
        </span>
      </div>
    </div>
  );
}

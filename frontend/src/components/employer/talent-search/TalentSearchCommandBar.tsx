import {
  Search,
  Sparkles,
  Briefcase,
  X,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  Target,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import type { Job } from "@/types/job";
import { TALENT_ARCHETYPES } from "./TalentDiscoveryHub";

const SCORE_THRESHOLDS = [
  { value: 0.5, label: "Khắt khe (≥ 50%)" },
  { value: 0.35, label: "Tiêu chuẩn (≥ 35%)" },
  { value: 0.25, label: "Mở rộng (≥ 25%)" },
];

const DOC_TYPE_OPTIONS = [
  { id: "all", label: "Tất cả hồ sơ" },
  { id: "cv_document", label: "CV Builder" },
  { id: "resume", label: "PDF Đính kèm" },
];

export interface TalentSearchCommandBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  onSelectPreset: (presetQuery: string) => void;
  jobs: Job[];
  selectedJobId: number | null;
  onJobChange: (jobIdStr: string) => void;
  selectedSection?: string | null;
  onSectionChange?: (secId: string | null) => void;
  selectedDocType: string;
  onDocTypeChange: (docType: string) => void;
  minScore: number;
  onMinScoreChange: (score: number) => void;
  viewMode?: "split" | "grid";
  onViewModeChange?: (mode: "split" | "grid") => void;
  onResetFilters?: () => void;
}

export function TalentSearchCommandBar({
  searchQuery,
  setSearchQuery,
  isLoading,
  onSubmit,
  onClear,
  onSelectPreset,
  jobs,
  selectedJobId,
  onJobChange,
  selectedDocType,
  onDocTypeChange,
  minScore,
  onMinScoreChange,
  onResetFilters,
}: TalentSearchCommandBarProps) {
  const isFiltered =
    selectedJobId !== null ||
    selectedDocType !== "all" ||
    minScore !== 0.35;

  return (
    <form
      onSubmit={onSubmit}
      className="p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-2"
    >
      {/* ── Main Search Input ── */}
      <div className="relative flex-1 min-w-[240px] flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Nhập tiêu chí, kỹ năng hoặc vị trí (Ví dụ: React, TypeScript, Python)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-8 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Filter 1: Job Selector ── */}
      <div className="relative">
        <select
          value={selectedJobId ?? "all"}
          onChange={(e) => onJobChange(e.target.value)}
          className="h-9 pl-7 pr-6 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100/70 transition-colors"
        >
          <option value="all">Tất cả vị trí ({jobs.length})</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* ── Filter 2: AI Match Precision ── */}
      <div className="relative">
        <select
          value={minScore}
          onChange={(e) => onMinScoreChange(Number(e.target.value))}
          className="h-9 pl-7 pr-6 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100/70 transition-colors"
        >
          {SCORE_THRESHOLDS.map((t) => (
            <option key={t.value} value={t.value}>
              Độ khớp: {t.label}
            </option>
          ))}
        </select>
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* ── Filter 3: Document Source ── */}
      <div className="relative hidden sm:block">
        <select
          value={selectedDocType}
          onChange={(e) => onDocTypeChange(e.target.value)}
          className="h-9 pl-7 pr-6 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100/70 transition-colors"
        >
          {DOC_TYPE_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* ── Filter 4: Quick Archetype Presets Dropdown ── */}
      <div className="relative hidden md:block">
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              onSelectPreset(e.target.value);
              e.target.value = "";
            }
          }}
          className="h-9 pl-7 pr-6 text-xs font-medium text-indigo-700 bg-indigo-50/60 border border-indigo-200/70 rounded-lg focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-indigo-100/60 transition-colors"
        >
          <option value="" disabled>
            Chân dung mẫu...
          </option>
          {TALENT_ARCHETYPES.map((arch) => (
            <option key={arch.role} value={arch.query}>
              {arch.role} ({arch.badge})
            </option>
          ))}
        </select>
        <Target className="w-3.5 h-3.5 text-indigo-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <ChevronDown className="w-3 h-3 text-indigo-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* ── Reset Button ── */}
      {isFiltered && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="h-9 px-2.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden lg:inline">Đặt lại</span>
        </button>
      )}

      {/* ── Search Submit Button ── */}
      <Button
        type="submit"
        disabled={isLoading || !searchQuery.trim()}
        className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-all border-0 shrink-0"
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <Spinner size="sm" className="text-white" />
            <span>Đang quét...</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tìm kiếm AI</span>
          </span>
        )}
      </Button>
    </form>
  );
}

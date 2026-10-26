import {
  Search,
  Sparkles,
  Briefcase,
  Wrench,
  Code2,
  FileText,
  GraduationCap,
  X,
  ChevronDown,
  SlidersHorizontal,
  Layers,
  Zap,
  LayoutGrid,
  Columns2,
  RotateCcw,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/job";

const SECTION_OPTIONS = [
  { id: null, label: "Toàn bộ CV", icon: Layers },
  { id: "skills", label: "Kỹ năng", icon: Wrench },
  { id: "experience", label: "Kinh nghiệm", icon: Briefcase },
  { id: "project", label: "Dự án", icon: Code2 },
  { id: "summary", label: "Tóm tắt", icon: FileText },
  { id: "education", label: "Học vấn", icon: GraduationCap },
];

const DOC_TYPE_OPTIONS = [
  { id: "all", label: "Tất cả hồ sơ" },
  { id: "cv_document", label: "CV Builder" },
  { id: "resume", label: "PDF Đính kèm" },
];

const SCORE_THRESHOLDS = [
  { value: 0.7, label: "Khắt khe", hint: "≥ 70%", icon: "🎯" },
  { value: 0.55, label: "Tiêu chuẩn", hint: "≥ 55%", icon: "⚡" },
  { value: 0.4, label: "Mở rộng", hint: "≥ 40%", icon: "🌐" },
];

const SUGGESTED_QUERIES = [
  { label: "Frontend React & TS", query: "Frontend Engineer có kinh nghiệm React, TypeScript và Tailwind CSS" },
  { label: "Backend Python & FastAPI", query: "Backend Developer thành thạo Python, FastAPI, PostgreSQL" },
  { label: "DevOps & Kubernetes", query: "DevOps Engineer chuyên sâu Kubernetes, Docker và CI/CD" },
  { label: "AI & Vector Search", query: "Kỹ sư AI có kinh nghiệm tích hợp LLM, RAG và Vector Database" },
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
  selectedSection: string | null;
  onSectionChange: (secId: string | null) => void;
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
  selectedSection,
  onSectionChange,
  selectedDocType,
  onDocTypeChange,
  minScore,
  onMinScoreChange,
  viewMode = "split",
  onViewModeChange,
  onResetFilters,
}: TalentSearchCommandBarProps) {
  const isFiltered =
    selectedJobId !== null ||
    selectedSection !== null ||
    selectedDocType !== "all" ||
    minScore !== 0.55;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
      {/* ── 1. Main Spotlight Search Input ── */}
      <div className="p-4 sm:p-5 space-y-3">
        <form onSubmit={onSubmit} className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-indigo-600 flex items-center">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              placeholder="Nhập tiêu chí nhân tài (Ví dụ: Frontend Engineer có kinh nghiệm React, TypeScript và Tailwind CSS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 sm:h-13 pl-12 pr-44 rounded-xl border border-slate-200/90 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                type="button"
                onClick={onClear}
                className="absolute right-36 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="absolute right-2 h-9 sm:h-10 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-all duration-200 border-0"
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
          </div>
        </form>

        {/* Suggested Quick Prompt Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3 text-amber-500" />
            Gợi ý nhanh:
          </span>
          {SUGGESTED_QUERIES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPreset(item.query)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/70 text-slate-600 font-medium transition-all cursor-pointer text-left"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Compact SaaS Filter Ribbon & Workspace Mode Switcher ── */}
      <div className="px-4 py-2.5 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: Scopes & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Job Filter Selector */}
          <div className="relative">
            <select
              value={selectedJobId ?? "all"}
              onChange={(e) => onJobChange(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <option value="all">Tất cả vị trí ({jobs.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Section Filter (Dropdown for cleanliness on all screen sizes) */}
          <div className="relative">
            <select
              value={selectedSection ?? "all"}
              onChange={(e) => onSectionChange(e.target.value === "all" ? null : e.target.value)}
              className="h-8 pl-8 pr-7 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
            >
              {SECTION_OPTIONS.map((sec) => (
                <option key={sec.id ?? "all"} value={sec.id ?? "all"}>
                  {sec.label}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Doc Type Selector */}
          <div className="flex items-center gap-0.5 bg-slate-200/60 p-0.5 rounded-lg">
            {DOC_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onDocTypeChange(opt.id)}
                className={cn(
                  "px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  selectedDocType === opt.id
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Reset Filters button */}
          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 font-medium px-2 py-1 rounded-md hover:bg-white transition-colors cursor-pointer"
              title="Đặt lại tất cả bộ lọc về mặc định"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Right Side: AI Precision + View Mode Switcher */}
        <div className="flex items-center gap-2.5">
          {/* AI Match Precision 3-tier Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 px-1.5">
              <SlidersHorizontal className="w-3 h-3" />
              Độ khớp:
            </span>
            {SCORE_THRESHOLDS.map((thresh) => {
              const isSelected = minScore === thresh.value;
              return (
                <button
                  key={thresh.value}
                  type="button"
                  onClick={() => onMinScoreChange(thresh.value)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title={`Ngưỡng tương đồng cosine tối thiểu ${thresh.hint}`}
                >
                  <span>{thresh.icon}</span>
                  <span>{thresh.label}</span>
                  <span className="opacity-80 text-[10px] hidden md:inline">({thresh.hint})</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher (Split Workspace vs Grid) */}
          {onViewModeChange && (
            <div className="flex items-center gap-0.5 bg-slate-200/60 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => onViewModeChange("split")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  viewMode === "split"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Bàn làm việc 2 cột (Danh sách + Chi tiết Inspector)"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split Board</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Dạng lưới thẻ (Grid Cards)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { List, Grid, ChevronDown, Check } from "lucide-react";
import { useViewMode, useSortMode, useJobStore } from "@/stores/jobStore";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface JobResultHeaderProps {
  totalCount: number;
}

const SORT_OPTIONS = [
  { value: "relevant", label: "Phù hợp nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "salary_desc", label: "Lương cao nhất" },
] as const;

export function JobResultHeader({ totalCount }: JobResultHeaderProps) {
  const viewMode = useViewMode();
  const sortMode = useSortMode();
  const setViewMode = useJobStore((s) => s.setViewMode);
  const setSortMode = useJobStore((s) => s.setSortMode);

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    if (isSortOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSortOpen]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortMode)?.label || "Phù hợp nhất";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div>
        <h2 className="text-xl font-bold text-[#172033]">Việc làm phù hợp</h2>
        <p className="text-[14px] text-[#64748B] mt-1">
          <span className="font-semibold text-[#00B86B]">
            {totalCount.toLocaleString()} kết quả
          </span>{" "}
          từ AI gợi ý
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5EAF0] rounded-lg text-[14px] font-medium text-[#172033] hover:bg-page-bg transition-colors"
          >
            {currentSortLabel} <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>

          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#E5EAF0]/80 overflow-hidden z-50 py-1"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortMode(opt.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[14px] hover:bg-page-bg transition-colors ${
                      sortMode === opt.value
                        ? "text-[#00B86B] font-semibold bg-emerald-50/50"
                        : "text-[#172033]"
                    }`}
                  >
                    {opt.label}
                    {sortMode === opt.value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center bg-white border border-[#E5EAF0] rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            title="Danh sách"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-page-bg text-[#172033] shadow-sm"
                : "text-[#64748B] hover:text-[#172033]"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            title="Dạng lưới"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-page-bg text-[#172033] shadow-sm"
                : "text-[#64748B] hover:text-[#172033]"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

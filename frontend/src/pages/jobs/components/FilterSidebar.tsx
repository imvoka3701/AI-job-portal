import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useJobStore } from "@/stores/jobStore";
import { JOB_LOCATION_OPTIONS } from "@/lib/locations";

// ─── Filter option maps ───────────────────────────────────────────────────────
const LOCATION_OPTIONS = JOB_LOCATION_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value,
}));

const JOB_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Remote", value: "remote" },
  { label: "Freelance", value: "freelance" },
];

const EXPERIENCE_OPTIONS: { label: string; value: string }[] = [
  { label: "Chưa có kinh nghiệm", value: "fresher" },
  { label: "1–2 năm (Junior)", value: "junior" },
  { label: "2–5 năm (Middle)", value: "middle" },
  { label: "5+ năm (Senior)", value: "senior" },
];

const SALARY_OPTIONS: { label: string; min?: number; max?: number }[] = [
  { label: "Dưới 10 triệu", max: 10_000_000 },
  { label: "10–15 triệu", min: 10_000_000, max: 15_000_000 },
  { label: "15–20 triệu", min: 15_000_000, max: 20_000_000 },
  { label: "20–30 triệu", min: 20_000_000, max: 30_000_000 },
  { label: "Trên 30 triệu", min: 30_000_000 },
];

// ─── Reusable collapsible section ─────────────────────────────────────────────
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="py-4 border-b border-[#E2E8F0] last:border-0">
      <button
        type="button"
        className="w-full flex items-center justify-between font-bold text-[#0F172A] text-[15px] mb-3 focus:outline-none group cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
        )}
      </button>
      {isOpen && <div className="space-y-2.5">{children}</div>}
    </div>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-0.5 select-none">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer appearance-none w-4 h-4 border border-[#CBD5E1] rounded-md bg-white checked:bg-[#00B86B] checked:border-[#00B86B] focus:ring-2 focus:ring-[#00B86B]/20 transition-all cursor-pointer"
        />
        <svg
          className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span className="text-[14px] font-medium text-[#475569] group-hover:text-[#0F172A] transition-colors">
        {label}
      </span>
    </label>
  );
}

export function FilterSidebar() {
  const filters = useJobStore((s) => s.filters);
  const setFilters = useJobStore((s) => s.setFilters);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLocation = (value: string, checked: boolean) => {
    const current = filters.locations ?? [];
    const next = checked
      ? [...current.filter((item) => item !== value), value]
      : current.filter((item) => item !== value);
    setFilters({ locations: next.length ? next : undefined });
  };

  const handleJobType = (value: string, checked: boolean) => {
    setFilters({ job_type: checked ? value : undefined });
  };

  const handleExperience = (value: string, checked: boolean) => {
    setFilters({ experience_level: checked ? value : undefined });
  };

  const handleSalary = (opt: (typeof SALARY_OPTIONS)[0], checked: boolean) => {
    if (!checked) {
      setFilters({ salary_min: undefined, salary_max: undefined });
      return;
    }
    setFilters({
      salary_min: opt.min,
      salary_max: opt.max,
    });
  };

  const handleReset = () => {
    setFilters({
      locations: undefined,
      job_type: undefined,
      experience_level: undefined,
      salary_min: undefined,
      salary_max: undefined,
    });
  };

  const selectedLocations = filters.locations ?? [];

  const hasActiveFilters =
    selectedLocations.length > 0 ||
    filters.job_type ||
    filters.experience_level ||
    filters.salary_min !== undefined ||
    filters.salary_max !== undefined;

  const activeCount =
    (selectedLocations.length > 0 ? 1 : 0) +
    (filters.job_type ? 1 : 0) +
    (filters.experience_level ? 1 : 0) +
    (filters.salary_min !== undefined || filters.salary_max !== undefined ? 1 : 0);

  const filterContent = (
    <div className="flex flex-col">
      {/* Location */}
      <FilterSection title="Địa điểm">
        {LOCATION_OPTIONS.map((opt) => (
          <CheckOption
            key={opt.value}
            label={opt.label}
            checked={selectedLocations.includes(opt.value)}
            onChange={(checked) => handleLocation(opt.value, checked)}
          />
        ))}
      </FilterSection>

      {/* Salary */}
      <FilterSection title="Mức lương">
        {SALARY_OPTIONS.map((opt) => (
          <CheckOption
            key={opt.label}
            label={opt.label}
            checked={
              filters.salary_min === opt.min &&
              filters.salary_max === opt.max
            }
            onChange={(checked) => handleSalary(opt, checked)}
          />
        ))}
      </FilterSection>

      {/* Experience */}
      <FilterSection title="Kinh nghiệm">
        {EXPERIENCE_OPTIONS.map((opt) => (
          <CheckOption
            key={opt.value}
            label={opt.label}
            checked={filters.experience_level === opt.value}
            onChange={(checked) => handleExperience(opt.value, checked)}
          />
        ))}
      </FilterSection>

      {/* Job Type */}
      <FilterSection title="Loại hình">
        {JOB_TYPE_OPTIONS.map((opt) => (
          <CheckOption
            key={opt.value}
            label={opt.label}
            checked={filters.job_type === opt.value}
            onChange={(checked) => handleJobType(opt.value, checked)}
          />
        ))}
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* MOBILE FILTER TOGGLE BUTTON */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-between px-5 py-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs text-sm font-bold text-[#0F172A] hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#00B86B]" />
            <span>Bộ lọc tìm kiếm</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#00B86B] text-white text-xs flex items-center justify-center font-extrabold">
                {activeCount}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* MOBILE DRAWER MODAL */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-xs h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <h3 className="font-extrabold text-base text-[#0F172A]">Bộ lọc tìm kiếm</h3>
                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Đóng bộ lọc"
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {filterContent}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3 mt-6">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Xóa tất cả
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex-1 py-2.5 bg-[#00B86B] hover:bg-[#00995C] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP STICKY SIDEBAR */}
      <div className="hidden lg:block w-full space-y-5 sticky top-[96px]">
        <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-extrabold text-[#0F172A]">Bộ lọc tìm kiếm</h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
          {filterContent}
        </div>

        {/* Mẹo tìm việc Card */}
        <div className="bg-gradient-to-br from-[#ECFDF5] via-white to-emerald-50/40 border border-emerald-200/80 rounded-[20px] p-5 shadow-xs">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#00B86B] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A] text-sm">💡 Mẹo tìm việc</h3>
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                Hoàn thiện hồ sơ giúp tăng gấp 3 lần cơ hội được nhà tuyển dụng hàng đầu liên hệ.
              </p>
            </div>
          </div>

          <div className="mb-3.5">
            <div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1">
              <span>Hoàn thiện hồ sơ</span>
              <span className="text-[#00B86B]">75%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#00B86B] rounded-full w-[75%]" />
            </div>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00995C] hover:text-[#00B86B] hover:underline"
          >
            Hoàn thiện ngay <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}

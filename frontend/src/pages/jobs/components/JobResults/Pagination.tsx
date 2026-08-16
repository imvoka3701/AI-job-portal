import { ChevronLeft, ChevronRight } from "lucide-react";
import { useJobStore, useJobPagination, useJobsLoading } from "@/stores/jobStore";

function buildPageItems(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);

  return items;
}

export function Pagination() {
  const { page, pageSize, total } = useJobPagination();
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const isLoading = useJobsLoading();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total <= 0 || totalPages <= 1) return null;

  const goTo = (next: number) => {
    if (next < 1 || next > totalPages || next === page || isLoading) return;
    void fetchJobs(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pages = buildPageItems(page, totalPages);

  return (
    <div className="flex items-center justify-center mt-10 mb-6 gap-2">
      <button
        type="button"
        aria-label="Trang trước"
        disabled={page <= 1 || isLoading}
        onClick={() => goTo(page - 1)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-[#94a3b8] hover:bg-page-bg hover:text-[#172033] transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex items-center justify-center w-10 h-10 text-[#94a3b8]"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Trang ${item}`}
            aria-current={item === page ? "page" : undefined}
            disabled={isLoading}
            onClick={() => goTo(item)}
            className={
              item === page
                ? "flex items-center justify-center w-10 h-10 rounded-lg bg-[#00B86B] text-white font-semibold shadow-sm"
                : "flex items-center justify-center w-10 h-10 rounded-lg text-[#475569] hover:bg-page-bg hover:text-[#172033] font-medium transition-colors disabled:opacity-40"
            }
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Trang sau"
        disabled={page >= totalPages || isLoading}
        onClick={() => goTo(page + 1)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-[#475569] hover:bg-page-bg hover:text-[#172033] transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

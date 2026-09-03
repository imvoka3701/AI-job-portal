import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  unitName?: string;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Standardized Admin Pagination Component
 * Formats: "Hiển thị {from} - {to} trong tổng số {total} {unitName} · Trang {page} / {totalPages}"
 * Handles zero-results by returning null (relies on EmptyState), and guards against out-of-bounds page values.
 */
export function AdminPagination({
  page,
  pageSize,
  total,
  unitName = "bản ghi",
  onPageChange,
  disabled = false,
  className = "",
}: AdminPaginationProps) {
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

  // Auto-clamp if page exceeds totalPages (e.g. after filter reduces results)
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      onPageChange(1);
    }
  }, [page, totalPages, onPageChange]);

  if (total <= 0) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5 shadow-xs ${className}`}
      data-testid="admin-pagination"
    >
      <span className="text-xs text-slate-500 font-medium">
        Hiển thị <span className="font-bold text-slate-900">{from}</span> -{" "}
        <span className="font-bold text-slate-900">{to}</span> trong tổng số{" "}
        <span className="font-bold text-slate-900">{total}</span> {unitName} &mdash; Trang{" "}
        <span className="font-bold text-slate-900">{page}</span> / {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1 || disabled}
          onClick={() => onPageChange(page - 1)}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= totalPages || disabled}
          onClick={() => onPageChange(page + 1)}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

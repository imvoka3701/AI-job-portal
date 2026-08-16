import { create } from "zustand";
import { getJobs, applyJob } from "@/lib/api/jobs";
import { getApiErrorMessage } from "@/lib/axios";
import type { Job } from "@/types/job";
import type { JobFilters } from "@/lib/api/jobs";
import { normalizeLocations } from "@/lib/locations";

// ─── Pagination state ─────────────────────────────────────────────────────────
interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ─── Per-job application state ────────────────────────────────────────────────
type ApplyStatus = "idle" | "loading" | "success" | "error";

// ─── Full store state ─────────────────────────────────────────────────────────
interface JobState {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  filters: JobFilters;
  pagination: PaginationState;
  applyStatusMap: Record<number, ApplyStatus>;

  viewMode: "list" | "grid";
  sortMode: "relevant" | "newest" | "salary_desc";

  setFilters: (partial: Partial<JobFilters>) => Promise<void>;
  fetchJobs: (page?: number) => Promise<void>;
  applyToJob: (jobId: number, resumeId?: number) => Promise<void>;
  clearError: () => void;
  setViewMode: (mode: "list" | "grid") => void;
  setSortMode: (mode: "relevant" | "newest" | "salary_desc") => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useJobStore = create<JobState>()((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: { page: 1, pageSize: 10, total: 0 },
  applyStatusMap: {},
  viewMode: "list",
  sortMode: "relevant",

  // ── Fetch jobs from the API ───────────────────────────────────────────────
  fetchJobs: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { filters, pagination } = get();
      const result = await getJobs({
        ...filters,
        page,
        page_size: pagination.pageSize,
      });
      set({
        jobs: result.items,
        isLoading: false,
        pagination: {
          ...get().pagination,
          page: result.page,
          total: result.total,
        },
      });
    } catch (err) {
      set({ isLoading: false, error: getApiErrorMessage(err) });
    }
  },

  // ── Set filters (merges + re-fetches from page 1) ─────────────────────────
  setFilters: async (partial) => {
    set((state) => {
      const next = { ...state.filters, ...partial };

      if (partial.locations !== undefined) {
        next.locations = partial.locations.length
          ? normalizeLocations(partial.locations)
          : undefined;
        delete next.location;
      } else if (partial.location !== undefined) {
        next.locations = partial.location
          ? normalizeLocations([partial.location])
          : undefined;
        delete next.location;
      }

      return { filters: next };
    });
    await get().fetchJobs(1);
  },

  // ── Apply to job ──────────────────────────────────────────────────────────
  applyToJob: async (jobId: number, resumeId?: number) => {
    set((state) => ({
      applyStatusMap: { ...state.applyStatusMap, [jobId]: "loading" },
    }));
    try {
      await applyJob({ job_id: jobId, resume_id: resumeId });
      set((state) => ({
        applyStatusMap: { ...state.applyStatusMap, [jobId]: "success" },
      }));
    } catch (err) {
      set((state) => ({
        applyStatusMap: { ...state.applyStatusMap, [jobId]: "error" },
        error: getApiErrorMessage(err),
      }));
    }
  },

  clearError: () => set({ error: null }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortMode: (mode) => set({ sortMode: mode }),
}));

// ─── Selector hooks ───────────────────────────────────────────────────────────
export const useJobs = () => useJobStore((s) => s.jobs);
export const useJobsLoading = () => useJobStore((s) => s.isLoading);
export const useJobsError = () => useJobStore((s) => s.error);
export const useJobFilters = () => useJobStore((s) => s.filters);
export const useJobPagination = () => useJobStore((s) => s.pagination);
export const useViewMode = () => useJobStore((s) => s.viewMode);
export const useSortMode = () => useJobStore((s) => s.sortMode);
export const useApplyStatus = (jobId: number) =>
  useJobStore((s) => s.applyStatusMap[jobId] ?? "idle");

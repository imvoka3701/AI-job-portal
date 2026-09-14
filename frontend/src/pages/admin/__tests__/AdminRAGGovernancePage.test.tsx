import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AdminRAGGovernancePage } from "../AdminRAGGovernancePage";
import * as adminRAG from "@/lib/api/adminRAG";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/lib/api/adminRAG", () => ({
  getAdminRAGStats: vi.fn(),
  getAdminRAGConfig: vi.fn(),
  updateAdminRAGConfig: vi.fn(),
  triggerAdminRAGReindex: vi.fn(),
  getAdminRAGSearchLogs: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  },
}));

// Mock ResizeObserver for Recharts
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

const mockStats: adminRAG.RAGVectorStats = {
  total_chunks: 1420,
  resume_chunks: 850,
  cv_document_chunks: 420,
  job_chunks: 150,
  total_resumes: 50,
  indexed_resumes: 48,
  total_cv_documents: 20,
  indexed_cv_documents: 19,
  total_jobs: 10,
  indexed_jobs: 10,
  overall_coverage_pct: 95.7,
  is_rag_enabled: true,
  hybrid_alpha_dense: 0.7,
  hybrid_alpha_sparse: 0.3,
  default_min_score: 0.55,
  total_searches_today: 45,
  total_searches_week: 310,
  avg_latency_ms: 48.5,
  daily_search_trends: [
    { date: "10/09", searches: 25, avg_latency_ms: 45 },
    { date: "11/09", searches: 40, avg_latency_ms: 50 },
    { date: "12/09", searches: 45, avg_latency_ms: 48.5 },
  ],
  top_searched_queries: [
    { query: "Frontend React Senior", count: 18 },
    { query: "Python FastAPI AI", count: 14 },
  ],
};

const mockConfig: adminRAG.RAGRuntimeConfig = {
  is_rag_enabled: true,
  hybrid_alpha_dense: 0.7,
  hybrid_alpha_sparse: 0.3,
  default_min_score: 0.55,
  default_top_k: 20,
  maintenance_message: "Hệ thống RAG đang bảo trì.",
  updated_at: new Date().toISOString(),
  updated_by_email: "admin@jobportal.vn",
};

const mockLogs: adminRAG.PaginatedSearchLogsResponse = {
  items: [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      user_id: 12,
      user_email: "hr@vinfast.vn",
      company_id: 4,
      company_name: "VinFast Auto",
      query: "React TypeScript Tailwind",
      job_id: 101,
      job_title: "Senior Frontend Engineer",
      section_types: ["skills", "experience"],
      min_score: 0.55,
      results_count: 5,
      duration_ms: 42,
      max_hybrid_score: 0.88,
      status: "success",
    },
  ],
  total: 1,
  page: 1,
  page_size: 15,
};

describe("AdminRAGGovernancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page header and sub-components successfully", async () => {
    vi.mocked(adminRAG.getAdminRAGStats).mockResolvedValue(mockStats);
    vi.mocked(adminRAG.getAdminRAGConfig).mockResolvedValue(mockConfig);
    vi.mocked(adminRAG.getAdminRAGSearchLogs).mockResolvedValue(mockLogs);

    render(
      <MemoryRouter>
        <AdminRAGGovernancePage />
      </MemoryRouter>
    );

    expect(screen.getByText("Quản Trị AI RAG & Hybrid Vector Store")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Khóa Khẩn Cấp RAG (Emergency Kill-Switch)")).toBeInTheDocument();
      expect(screen.getByText("HOẠT ĐỘNG BÌNH THƯỜNG")).toBeInTheDocument();
      expect(screen.getByText("1,420")).toBeInTheDocument();
      expect(screen.getByText("95.7%")).toBeInTheDocument();
      expect(screen.getByText("VinFast Auto")).toBeInTheDocument();
      expect(screen.getByText('"React TypeScript Tailwind"')).toBeInTheDocument();
    });
  });

  it("handles toggling the emergency kill switch", async () => {
    vi.mocked(adminRAG.getAdminRAGStats).mockResolvedValue(mockStats);
    vi.mocked(adminRAG.getAdminRAGConfig).mockResolvedValue(mockConfig);
    vi.mocked(adminRAG.getAdminRAGSearchLogs).mockResolvedValue(mockLogs);
    vi.mocked(adminRAG.updateAdminRAGConfig).mockResolvedValue({
      ...mockConfig,
      is_rag_enabled: false,
    });

    render(
      <MemoryRouter>
        <AdminRAGGovernancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Ngắt RAG Khẩn Cấp")).toBeInTheDocument();
    });

    const killSwitchBtn = screen.getByText("Ngắt RAG Khẩn Cấp");
    fireEvent.click(killSwitchBtn);

    await waitFor(() => {
      expect(adminRAG.updateAdminRAGConfig).toHaveBeenCalledWith({ is_rag_enabled: false });
    });
  });

  it("handles algorithm parameter saving", async () => {
    vi.mocked(adminRAG.getAdminRAGStats).mockResolvedValue(mockStats);
    vi.mocked(adminRAG.getAdminRAGConfig).mockResolvedValue(mockConfig);
    vi.mocked(adminRAG.getAdminRAGSearchLogs).mockResolvedValue(mockLogs);
    vi.mocked(adminRAG.updateAdminRAGConfig).mockResolvedValue(mockConfig);

    render(
      <MemoryRouter>
        <AdminRAGGovernancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Lưu Cấu Hình Thuật Toán")).toBeInTheDocument();
    });

    const saveBtn = screen.getByText("Lưu Cấu Hình Thuật Toán");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminRAG.updateAdminRAGConfig).toHaveBeenCalled();
    });
  });
});

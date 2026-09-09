import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/lib/axios";
import { exportCandidatesCSV, exportPipelineMetricsCSV } from "@/lib/api/exports";

describe("Enterprise Data Export API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL methods
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("exports candidate CSV with filters and triggers native download", async () => {
    const mockBlobData = "\ufeffMã hồ sơ,Họ và tên\n1,Nguyễn Văn A";
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: mockBlobData,
      headers: {
        "content-disposition": 'attachment; filename="danh_sach_ung_vien_job_12_2026.csv"',
      },
    });

    const appendSpy = vi.spyOn(document.body, "appendChild");

    await exportCandidatesCSV(12, "pending");

    expect(getSpy).toHaveBeenCalledWith("/employer/exports/candidates.csv", {
      params: { job_id: 12, status: "pending" },
      responseType: "blob",
    });

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("exports pipeline metrics CSV with default filename fallback", async () => {
    const mockBlobData = "\ufeffBÁO CÁO TỔNG QUAN\nTotal Jobs,5";
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: mockBlobData,
      headers: {},
    });

    await exportPipelineMetricsCSV();

    expect(getSpy).toHaveBeenCalledWith("/employer/exports/pipeline-metrics.csv", {
      responseType: "blob",
    });
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });
});

import { apiClient } from "@/lib/axios";

/**
 * Downloads candidate applications CSV with UTF-8 BOM encoding.
 * Triggers native browser download dialog with server-specified filename.
 */
export async function exportCandidatesCSV(jobId?: number | null, status?: string | null): Promise<void> {
  const params: Record<string, string | number> = {};
  if (jobId) params.job_id = jobId;
  if (status && status !== "all") params.status = status;

  const response = await apiClient.get("/employer/exports/candidates.csv", {
    params,
    responseType: "blob",
  });

  // Extract filename from Content-Disposition header if available
  const disposition = response.headers["content-disposition"] || "";
  let filename = "danh_sach_ung_vien.csv";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (filenameMatch && filenameMatch[1]) {
    filename = decodeURIComponent(filenameMatch[1]);
  }

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Downloads aggregated recruitment metrics and funnel analytics CSV.
 */
export async function exportPipelineMetricsCSV(): Promise<void> {
  const response = await apiClient.get("/employer/exports/pipeline-metrics.csv", {
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] || "";
  let filename = "bao_cao_hieu_suat_tuyen_dung.csv";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (filenameMatch && filenameMatch[1]) {
    filename = decodeURIComponent(filenameMatch[1]);
  }

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

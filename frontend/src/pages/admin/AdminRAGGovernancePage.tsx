import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Database, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { SEOMeta } from "@/components/seo/SEOMeta";
import {
  getAdminRAGStats,
  getAdminRAGConfig,
  updateAdminRAGConfig,
  triggerAdminRAGReindex,
  getAdminRAGSearchLogs,
  type RAGVectorStats,
  type RAGRuntimeConfig,
  type RAGRuntimeConfigUpdatePayload,
  type RAGSearchLogEntry,
  type BatchReindexResponse,
} from "@/lib/api/adminRAG";

import { RAGKillSwitchCard } from "./rag/RAGKillSwitchCard";
import { RAGMetricCards } from "./rag/RAGMetricCards";
import { RAGAlgorithmTuningCard } from "./rag/RAGAlgorithmTuningCard";
import { RAGBatchReindexCard } from "./rag/RAGBatchReindexCard";
import { RAGTrendCharts } from "./rag/RAGTrendCharts";
import { RAGSearchLogsTable } from "./rag/RAGSearchLogsTable";

export function AdminRAGGovernancePage() {
  const [stats, setStats] = useState<RAGVectorStats | null>(null);
  const [config, setConfig] = useState<RAGRuntimeConfig | null>(null);
  const [logs, setLogs] = useState<RAGSearchLogEntry[]>([]);
  const [logsTotal, setLogsTotal] = useState<number>(0);
  const [logsPage, setLogsPage] = useState<number>(1);
  const logsPageSize = 15;

  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [isTogglingKillSwitch, setIsTogglingKillSwitch] = useState<boolean>(false);
  const [isReindexing, setIsReindexing] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMinLatency, setFilterMinLatency] = useState<number | undefined>(undefined);

  // ── Fetchers ──
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await getAdminRAGStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load RAG stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await getAdminRAGConfig();
      setConfig(data);
    } catch (err) {
      console.error("Failed to load RAG runtime config:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const fetchLogs = useCallback(
    async (page: number, q?: string, minLat?: number) => {
      setLoadingLogs(true);
      try {
        const data = await getAdminRAGSearchLogs({
          page,
          page_size: logsPageSize,
          q: q || undefined,
          min_latency: minLat,
        });
        setLogs(data.items);
        setLogsTotal(data.total);
      } catch (err) {
        console.error("Failed to load search logs:", err);
      } finally {
        setLoadingLogs(false);
      }
    },
    [logsPageSize]
  );

  const handleRefreshAll = () => {
    fetchStats();
    fetchConfig();
    fetchLogs(logsPage, searchQuery, filterMinLatency);
  };

  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, [fetchStats, fetchConfig]);

  useEffect(() => {
    fetchLogs(logsPage, searchQuery, filterMinLatency);
  }, [fetchLogs, logsPage, searchQuery, filterMinLatency]);

  // ── Actions ──
  const handleToggleKillSwitch = async (enabled: boolean) => {
    setIsTogglingKillSwitch(true);
    try {
      const updated = await updateAdminRAGConfig({ is_rag_enabled: enabled });
      setConfig(updated);
      await fetchStats();
      if (enabled) {
        toast.success("Đã mở lại hoạt động AI RAG bình thường!");
      } else {
        toast.warning("Đã kích hoạt Khóa khẩn cấp RAG! Các truy vấn AI tạm dừng phục vụ.");
      }
    } catch (err) {
      console.error("Failed to toggle kill switch:", err);
      toast.error("Không thể cập nhật trạng thái Khóa khẩn cấp. Vui lòng thử lại!");
    } finally {
      setIsTogglingKillSwitch(false);
    }
  };

  const handleSaveConfig = async (payload: RAGRuntimeConfigUpdatePayload) => {
    setIsSavingConfig(true);
    try {
      const updated = await updateAdminRAGConfig(payload);
      setConfig(updated);
      await fetchStats();
      toast.success("Cập nhật cấu hình thuật toán Hybrid RAG thành công!");
    } catch (err) {
      console.error("Failed to update RAG config:", err);
      toast.error("Không thể lưu cấu hình thuật toán RAG. Vui lòng kiểm tra lại!");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleBatchReindex = async (
    scope: "all" | "resume" | "cv_document" | "job"
  ): Promise<BatchReindexResponse | null> => {
    setIsReindexing(true);
    try {
      const res = await triggerAdminRAGReindex({ scope });
      await fetchStats();
      toast.success(res.message || "Tái lập chỉ mục Vector thành công!");
      return res;
    } catch (err) {
      console.error("Failed to run batch reindexing:", err);
      toast.error("Lỗi khi tiến hành tái lập chỉ mục Vector!");
      return null;
    } finally {
      setIsReindexing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setLogsPage(newPage);
  };

  const handleSearchFilter = (query: string, minLatency?: number) => {
    setSearchQuery(query);
    setFilterMinLatency(minLatency);
    setLogsPage(1);
  };

  const isRAGActive = config?.is_rag_enabled ?? true;

  return (
    <>
      <SEOMeta
        title="Quản trị AI RAG & Vector Store | Admin Console"
        description="Giám sát kho vector, điều chỉnh thuật toán Hybrid Retrieval và nhật ký tìm kiếm AI"
      />

      <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Hạ tầng Vector & Thuật toán AI
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isRAGActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200 animate-pulse"
                }`}
              >
                {isRAGActive ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    Online & Active
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3 h-3" />
                    Emergency Lock Active
                  </>
                )}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quản Trị AI RAG & Hybrid Vector Store
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Giám sát độ phủ pgvector, tinh chỉnh trọng số Cosine / BM25 và kiểm soát an toàn truy vấn ứng viên
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-refresh-rag-governance"
              onClick={handleRefreshAll}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Làm mới số liệu</span>
            </button>
          </div>
        </div>

        {/* 1. Emergency Kill Switch Card */}
        <RAGKillSwitchCard
          config={config}
          loading={loadingConfig}
          isUpdating={isTogglingKillSwitch}
          onToggle={handleToggleKillSwitch}
        />

        {/* 2. Key Observability Metric Cards */}
        <RAGMetricCards stats={stats} loading={loadingStats} />

        {/* 3. Control & Tuning Panels (Grid) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RAGAlgorithmTuningCard
            config={config}
            loading={loadingConfig}
            onSave={handleSaveConfig}
            isSaving={isSavingConfig}
          />
          <RAGBatchReindexCard
            onReindex={handleBatchReindex}
            isReindexing={isReindexing}
          />
        </div>

        {/* 4. Trends & Query Intelligence */}
        <RAGTrendCharts stats={stats} loading={loadingStats} />

        {/* 5. Search Telemetry & Audit Logs */}
        <RAGSearchLogsTable
          logs={logs}
          total={logsTotal}
          page={logsPage}
          pageSize={logsPageSize}
          loading={loadingLogs}
          onPageChange={handlePageChange}
          onSearchFilter={handleSearchFilter}
        />
      </div>
    </>
  );
}
export default AdminRAGGovernancePage;

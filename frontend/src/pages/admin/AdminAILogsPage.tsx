import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Minus,
  ScrollText,
} from "lucide-react";
import { Skeleton } from "@/components/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminTabNavigation } from "./components/AdminTabNavigation";
import { SEOMeta } from "@/components/seo/SEOMeta";
import {
  getAICallLogs,
  getAIStats,
  type AICallLog,
  type AIFeature,
  type AILogFilters,
  type AIStatsResponse,
} from "@/lib/api/adminAI";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BarChartPoint {
  feature: string;
  success: number;
  failed: number;
}

type TrendDir = "up" | "down" | "flat";

// ── Constants — Design System palette only ────────────────────────────────────

const FEATURE_LABELS: Record<string, string> = {
  cv_evaluate: "Đánh giá CV",
  roadmap: "Lộ trình",
  summarize_cv: "Tóm tắt CV",
  interview_questions: "Câu hỏi PV",
  generate_email: "Tạo email",
};

const STATUS_LABELS: Record<string, string> = {
  success: "Thành công",
  failed: "Thất bại",
  retried_success: "Thử lại OK",
};



const PAGE_SIZE = 15;

// ── Trend helpers ─────────────────────────────────────────────────────────────

function getTrend(current: number, previous: number): { dir: TrendDir; pct: number } {
  if (previous === 0) return { dir: "flat", pct: 0 };
  const pct = ((current - previous) / previous) * 100;
  return { dir: pct > 2 ? "up" : pct < -2 ? "down" : "flat", pct: Math.abs(pct) };
}

interface TrendPillProps {
  current: number;
  previous: number;
  // "up" = good (more calls = activity), "up" for error rate = bad
  invertBad?: boolean;
}

function TrendPill({ current, previous, invertBad = false }: TrendPillProps) {
  const { dir, pct } = getTrend(current, previous);
  if (dir === "flat") return <span className="inline-flex items-center gap-0.5 text-xs text-gray-400"><Minus className="w-3 h-3" /> —</span>;

  const isPositive = invertBad ? dir === "down" : dir === "up";
  const colorClass = isPositive ? "text-success" : "text-error";
  const Icon = dir === "up" ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {pct.toFixed(1)}%
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  trendCurrent: number;
  trendPrevious: number;
  invertBad?: boolean;
  icon: React.ElementType;
  iconBg: string;    // from Design System tokens only
  iconText: string;
  loading?: boolean;
}

function KPICard({
  label, value, sub, trendCurrent, trendPrevious, invertBad,
  icon: Icon, iconBg, iconText, loading,
}: KPICardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-sm transition-all">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-3 w-36 rounded-md" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            <div className={`p-2 rounded-xl ${iconBg}`}>
              <Icon className={`w-4 h-4 ${iconText}`} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mb-1.5 tabular-nums">{value}</p>
          <div className="flex items-center gap-2">
            <TrendPill current={trendCurrent} previous={trendPrevious} invertBad={invertBad} />
            <span className="text-xs text-slate-400">{sub}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Log Row ────────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: AICallLog }) {
  const date = new Date(log.created_at);
  const timeStr = date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const statusColors: Record<string, string> = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    failed: "bg-red-50 border-red-200 text-red-700",
    retried_success: "bg-amber-50 border-amber-200 text-amber-700",
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm"
    >
      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{timeStr}</td>
      <td className="px-4 py-3 font-semibold text-slate-800">{FEATURE_LABELS[log.feature] ?? log.feature}</td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${statusColors[log.status] ?? "bg-slate-100 border-slate-200 text-slate-600"}`}>
          {STATUS_LABELS[log.status] ?? log.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{log.duration_ms != null ? `${log.duration_ms} ms` : "—"}</td>
      <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{log.input_tokens != null ? log.input_tokens.toLocaleString() : "—"}</td>
      <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{log.output_tokens != null ? log.output_tokens.toLocaleString() : "—"}</td>
      <td className="px-4 py-3 text-right font-bold text-slate-800 tabular-nums">{log.cost_usd != null ? `$${log.cost_usd.toFixed(5)}` : "—"}</td>
      <td className="px-4 py-3 max-w-[180px] truncate text-red-500 text-xs">{log.error_message ?? ""}</td>
    </motion.tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminAILogsPage() {
  const [stats, setStats] = useState<AIStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const [logs, setLogs] = useState<AICallLog[]>([]);
  const [total, setTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(false);

  const [filters, setFilters] = useState<AILogFilters>({ page: 1, page_size: PAGE_SIZE });

  const [chartData, setChartData] = useState<BarChartPoint[]>([]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const data = await getAIStats();
      setStats(data);
      // Stacked bar: 1 bar group per feature
      const points: BarChartPoint[] = data.by_feature.map((f) => ({
        feature: FEATURE_LABELS[f.feature] ?? f.feature,
        success: f.success_calls,
        failed: f.failed_calls,
      }));
      setChartData(points);
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(false);
    try {
      const data = await getAICallLogs(filters);
      setLogs(data.items);
      setTotal(data.total);
    } catch {
      setLogsError(true);
    } finally {
      setLogsLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Filter helpers ─────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleRefresh() { fetchStats(); fetchLogs(); }

  const hasActiveFilter = !!(filters.feature || filters.status || filters.from_date || filters.to_date);

  function clearFilters() { setFilters({ page: 1, page_size: PAGE_SIZE }); }

  // Approximate previous-period values from week data
  // today vs (week / 7) as rough previous day estimate
  const prevDayCallsEst = stats ? Math.round(stats.total_calls_week / 7) : 0;
  const prevDayCostEst = stats ? stats.total_cost_week_usd / 7 : 0;

  // ── Render ─────────────────────────────────────────────────────────────────



  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <SEOMeta title="AI Call Logs — Admin" description="Theo dõi lịch sử gọi AI, chi phí và tỉ lệ lỗi theo tính năng" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 bg-violet-500/20 border border-violet-400/30 rounded-lg flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Admin · AI Control</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Call Logs</h1>
              <p className="text-slate-400 text-sm mt-1.5">Theo dõi lịch sử gọi AI, latency và chi phí theo từng tính năng</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {stats && (
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-white tabular-nums">${stats.total_cost_month_usd.toFixed(2)}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Chi phí tháng này</p>
                </div>
              )}
              <button
                id="btn-refresh-ai-logs"
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <AdminTabNavigation />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard
            label="Calls hôm nay"
            value={String(stats?.total_calls_today ?? "—")}
            sub="so với trung bình ngày"
            trendCurrent={stats?.total_calls_today ?? 0}
            trendPrevious={prevDayCallsEst}
            icon={Activity}
            iconBg="bg-violet-50"
            iconText="text-violet-600"
            loading={statsLoading}
          />
          <KPICard
            label="Chi phí hôm nay"
            value={stats ? `$${stats.total_cost_today_usd.toFixed(4)}` : "—"}
            sub={`Tháng này: $${stats?.total_cost_month_usd.toFixed(3) ?? "—"}`}
            trendCurrent={stats?.total_cost_today_usd ?? 0}
            trendPrevious={prevDayCostEst}
            invertBad
            icon={TrendingUp}
            iconBg="bg-[#ECFDF5]"
            iconText="text-[#00B86B]"
            loading={statsLoading}
          />
          <KPICard
            label="Tỉ lệ lỗi"
            value={stats ? `${stats.error_rate_pct.toFixed(1)}%` : "—"}
            sub="tính trên toàn bộ calls"
            trendCurrent={stats?.error_rate_pct ?? 0}
            trendPrevious={0}
            invertBad
            icon={AlertTriangle}
            iconBg={(stats?.error_rate_pct ?? 0) > 5 ? "bg-red-50" : "bg-amber-50"}
            iconText={(stats?.error_rate_pct ?? 0) > 5 ? "text-red-600" : "text-amber-600"}
            loading={statsLoading}
          />
        </div>

        {/* Stacked Bar Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700">Calls theo tính năng — Success vs Failed</h2>
          </div>
          {statsLoading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : statsError ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400">Không thể tải dữ liệu biểu đồ</div>
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="feature" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="success" name="Thành công" stackId="a" fill="#00B86B" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" name="Thất bại" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="filter-feature"
              value={filters.feature ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, feature: e.target.value === "" ? undefined : e.target.value as AIFeature, page: 1 }))}
              className="h-9 rounded-xl border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]"
            >
              <option value="">Tất cả tính năng</option>
              {Object.entries(FEATURE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              id="filter-status"
              value={filters.status ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value === "" ? undefined : e.target.value as AILogFilters["status"], page: 1 }))}
              className="h-9 rounded-xl border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="retried_success">Thử lại OK</option>
            </select>
            <input id="filter-from-date" type="date" value={filters.from_date ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, from_date: e.target.value || undefined, page: 1 }))}
              className="h-9 rounded-xl border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]" />
            <span className="text-slate-300 text-sm select-none">→</span>
            <input id="filter-to-date" type="date" value={filters.to_date ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, to_date: e.target.value || undefined, page: 1 }))}
              className="h-9 rounded-xl border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]" />
            {hasActiveFilter && (
              <button id="btn-clear-filters" onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline-offset-2 hover:underline">
                Xoá bộ lọc
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400 tabular-nums">{total.toLocaleString()} bản ghi</span>
            <button id="btn-refresh-inline" onClick={handleRefresh} aria-label="Làm mới"
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          {logsLoading ? (
            <div className="p-5 space-y-2.5">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
          ) : logsError ? (
            <div className="p-6"><ErrorState message="Không thể tải danh sách logs" onRetry={fetchLogs} /></div>
          ) : logs.length === 0 ? (
            <div className="p-6"><EmptyState title="Chưa có log nào" description="Hệ thống sẽ ghi nhận khi AI được gọi từ các tính năng tuyển dụng." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Thời gian", "Tính năng", "Trạng thái", "Latency", "Input tokens", "Output tokens", "Chi phí", "Lỗi"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{logs.map((log) => <LogRow key={log.id} log={log} />)}</tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!logsLoading && !logsError && total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Trang <span className="font-bold text-slate-900">{filters.page ?? 1}</span> / {totalPages}
                <span className="text-slate-400 ml-2">({total.toLocaleString()} bản ghi)</span>
              </span>
              <div className="flex gap-2">
                <button
                  id="btn-prev-page"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                ><ChevronLeft className="w-4 h-4" /></button>
                <button
                  id="btn-next-page"
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                ><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

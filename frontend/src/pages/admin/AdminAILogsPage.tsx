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
import { Badge, Button, Card, Skeleton } from "@/components/ui";
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

// Badge variants only — no ad-hoc bg/text classes (Design System §6.3)
const STATUS_BADGE: Record<string, "success" | "danger" | "warning"> = {
  success: "success",
  failed: "danger",
  retried_success: "warning",
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
    <Card className="p-5">
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
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <div className={`p-2 rounded-lg ${iconBg}`}>
              <Icon className={`w-4 h-4 ${iconText}`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          <div className="flex items-center gap-2">
            <TrendPill current={trendCurrent} previous={trendPrevious} invertBad={invertBad} />
            <span className="text-xs text-gray-400">{sub}</span>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

// ── Log Row ────────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: AICallLog }) {
  const date = new Date(log.created_at);
  const timeStr = date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm"
    >
      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{timeStr}</td>
      <td className="px-4 py-3 font-medium text-gray-800">
        {FEATURE_LABELS[log.feature] ?? log.feature}
      </td>
      <td className="px-4 py-3">
        <Badge variant={STATUS_BADGE[log.status] ?? "default"}>
          {STATUS_LABELS[log.status] ?? log.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
        {log.duration_ms != null ? `${log.duration_ms} ms` : "—"}
      </td>
      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
        {log.input_tokens != null ? log.input_tokens.toLocaleString() : "—"}
      </td>
      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
        {log.output_tokens != null ? log.output_tokens.toLocaleString() : "—"}
      </td>
      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
        {log.cost_usd != null ? `$${log.cost_usd.toFixed(5)}` : "—"}
      </td>
      <td className="px-4 py-3 max-w-[180px] truncate text-error text-xs">
        {log.error_message ?? ""}
      </td>
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

  const inputBase =
    "h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 " +
    "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

  return (
    <div className="min-h-screen bg-page-bg">
      <SEOMeta title="AI Call Logs — Admin" description="Theo dõi lịch sử gọi AI, chi phí và tỉ lệ lỗi theo tính năng" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Page Header — Design System §6.6 */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Admin · AI Control</p>
            <h1 className="text-3xl font-semibold text-gray-900">AI Call Logs</h1>
            <p className="mt-1 text-sm text-gray-600">
              Theo dõi lịch sử gọi AI, latency và chi phí theo từng tính năng
            </p>
          </div>
          <Button
            id="btn-refresh-ai-logs"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 mt-1"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
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
            iconBg="bg-primary-light"
            iconText="text-primary"
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
            iconBg="bg-primary-soft"
            iconText="text-primary-dark"
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
            iconText={(stats?.error_rate_pct ?? 0) > 5 ? "text-error" : "text-warning"}
            loading={statsLoading}
          />
        </div>

        {/* Stacked Bar Chart */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Calls theo tính năng — Success vs Failed</h2>
          </div>
          {statsLoading ? (
            <Skeleton className="h-52 w-full rounded-md" />
          ) : statsError ? (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">
              Không thể tải dữ liệu biểu đồ
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">
              Chưa có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="feature"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                {/* Design System: color-success + color-error */}
                <Bar dataKey="success" name="Thành công" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed"  name="Thất bại"   stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Filter Bar — 1 hàng ngang gọn (Design System §4) */}
        <Card className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Feature */}
            <select
              id="filter-feature"
              value={filters.feature ?? ""}
              onChange={(e) => setFilters(f => ({
                ...f,
                feature: e.target.value === "" ? undefined : e.target.value as AIFeature,
                page: 1,
              }))}
              className={inputBase}
            >
              <option value="">Tất cả tính năng</option>
              {Object.entries(FEATURE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {/* Status */}
            <select
              id="filter-status"
              value={filters.status ?? ""}
              onChange={(e) => setFilters(f => ({
                ...f,
                status: e.target.value === "" ? undefined : e.target.value as AILogFilters["status"],
                page: 1,
              }))}
              className={inputBase}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="retried_success">Thử lại OK</option>
            </select>

            {/* Date range */}
            <input
              id="filter-from-date"
              type="date"
              value={filters.from_date ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, from_date: e.target.value || undefined, page: 1 }))}
              className={inputBase}
            />
            <span className="text-gray-300 text-sm select-none">→</span>
            <input
              id="filter-to-date"
              type="date"
              value={filters.to_date ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, to_date: e.target.value || undefined, page: 1 }))}
              className={inputBase}
            />

            {/* Clear */}
            {hasActiveFilter && (
              <button
                id="btn-clear-filters"
                onClick={clearFilters}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline"
              >
                Xoá bộ lọc
              </button>
            )}

            {/* Record count — pushed right */}
            <span className="ml-auto text-xs text-gray-400 tabular-nums">
              {total.toLocaleString()} bản ghi
            </span>

            {/* Refresh inside filter row */}
            <Button
              id="btn-refresh-inline"
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-gray-400 hover:text-gray-600 px-2"
              aria-label="Làm mới"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Log Table */}
        <Card className="overflow-hidden">
          {logsLoading ? (
            <div className="p-5 space-y-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : logsError ? (
            <div className="p-6">
              <ErrorState message="Không thể tải danh sách logs" onRetry={fetchLogs} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Chưa có log nào"
                description="Hệ thống sẽ ghi nhận khi AI được gọi từ các tính năng tuyển dụng."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {[
                      "Thời gian", "Tính năng", "Trạng thái",
                      "Latency", "Input tokens", "Output tokens", "Chi phí", "Lỗi",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => <LogRow key={log.id} log={log} />)}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!logsLoading && !logsError && total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Trang {filters.page ?? 1} / {totalPages}
                <span className="text-gray-400 ml-2">({total.toLocaleString()} bản ghi)</span>
              </span>
              <div className="flex gap-2">
                <Button
                  id="btn-prev-page"
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  className="gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trước
                </Button>
                <Button
                  id="btn-next-page"
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  className="gap-1"
                >
                  Sau <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

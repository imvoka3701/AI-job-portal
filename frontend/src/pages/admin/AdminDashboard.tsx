import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminStats,
  getAdminAlerts,
  type AdminStats,
  type AdminAlertsSummary,
} from "@/lib/api/admin";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Skeleton, EmptyState } from "@/components/ui";
import {
  Users,
  Building2,
  Briefcase,
  FileCheck,
  TrendingUp,
  Shield,
  Clock,
  Target,
  UserCheck,
  Activity,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Zap,
  RefreshCw,
  Brain,
  Layers,
  Radio,
  MessageSquareHeart,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { SEOMeta } from "@/components/seo/SEOMeta";

// ── Animated Counter Hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setVal(0);
      return;
    }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ── Primary KPI Card ────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  accentGradient: string;
  link: string;
}

function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconBg,
  iconColor,
  accentGradient,
  link,
}: KpiCardProps) {
  const count = useCountUp(value);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link to={link}>
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all group cursor-pointer relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentGradient}`} />
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 tracking-normal">
                {label}
              </p>
              <p className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
                {count.toLocaleString("vi-VN")}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-600">{sublabel}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 border border-slate-200/60 shadow-xs`}
            >
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#00995C] font-bold opacity-90 group-hover:opacity-100 transition-opacity">
            <span>Chi tiết quản lý</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Incident Alert Tile ─────────────────────────────────────────────────────
interface AlertTileProps {
  label: string;
  count: number;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  warn?: boolean;
  link: string;
  linkLabel: string;
}

function AlertTile({
  label,
  count,
  sublabel,
  icon: Icon,
  danger,
  warn,
  link,
  linkLabel,
}: AlertTileProps) {
  const isAlert = count > 0 && (danger || warn);
  const cs = danger
    ? {
        ring: "border-rose-200 bg-rose-50/40",
        ib: "bg-rose-100 text-rose-700",
        num: "text-rose-700",
        link: "text-rose-700 hover:text-rose-800",
      }
    : warn
    ? {
        ring: "border-amber-200 bg-amber-50/40",
        ib: "bg-amber-100 text-amber-800",
        num: "text-amber-800",
        link: "text-amber-800 hover:text-amber-900",
      }
    : {
        ring: "border-slate-200 bg-white",
        ib: "bg-slate-100 text-slate-600",
        num: "text-slate-900",
        link: "text-slate-600 hover:text-slate-900",
      };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isAlert ? cs.ring : "border-slate-200 bg-white shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 tracking-normal">
            {label}
          </p>
          <p className={`mt-2 text-2xl sm:text-3xl font-black tabular-nums ${cs.num}`}>
            {count > 0 ? (
              count
            ) : (
              <span className="text-[#00995C] text-lg font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Bình thường
              </span>
            )}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-600">{sublabel}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${cs.ib}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {count > 0 && (
        <Link
          to={link}
          className={`mt-3 inline-flex items-center gap-1.5 text-xs font-bold ${cs.link} transition-colors`}
        >
          {linkLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const user = useUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0 || !user || user.role !== "admin") return;
    const interval = setInterval(() => {
      handleRefresh();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, user]);

  const handleExportSummary = () => {
    if (!stats) return;
    const lines = [
      "BÁO CÁO TỔNG QUAN VẬN HÀNH HỆ THỐNG - AI JOB PORTAL",
      `Thời điểm kết xuất: ${new Date().toLocaleString("vi-VN")}`,
      "",
      "1. CHỈ SỐ HOẠT ĐỘNG CỐT LÕI (CORE KPIS)",
      `Tổng ứng viên,${stats.total_candidates}`,
      `Nhà tuyển dụng,${stats.total_employers}`,
      `Việc làm đang mở,${stats.total_active_jobs}`,
      `Tổng lượt ứng tuyển,${stats.total_applications}`,
      `Nguồn trực tiếp (%),${stats.candidate_source_pct?.direct ?? 0}%`,
      `Nguồn Google OAuth (%),${stats.candidate_source_pct?.google_oauth ?? 0}%`,
      `Thời gian tuyển trung bình (ngày),${stats.time_to_hire_avg_days ?? 0}`,
      "",
      "2. PHỄU TUYỂN DỤNG & VÒNG PHỎNG VẤN",
      "Vòng phỏng vấn,Ứng viên tham gia,Đạt,Tỷ lệ đạt (%)",
      ...(stats.funnel?.map((f) => `"${f.round_name}",${f.entered},${f.passed},${f.pass_rate}%`) ?? []),
      "",
      "3. CẢNH BÁO VẬN HÀNH & SỰ CỐ KHẨN CẤP",
      `Phản hồi người dùng chờ xử lý,${alerts?.pending_feedbacks ?? 0}`,
      `Ý kiến phản hồi khẩn cấp / CSAT thấp,${alerts?.urgent_feedbacks ?? 0}`,
      `Phỏng vấn quá hạn,${alerts?.overdue_interviews?.length ?? 0}`,
      `Lỗi gọi AI Provider (24h),${alerts?.ai_errors_24h ?? 0}`,
      `Hồ sơ chờ xem xét >14 ngày,${alerts?.pending_actions?.length ?? 0}`,
      `Tin tuyển dụng mở >30 ngày,${alerts?.stale_jobs?.length ?? 0}`,
    ];

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `Bao_cao_KPI_Admin_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    let isCancelled = false;

    Promise.all([
      getAdminStats().then((data) => {
        if (!isCancelled) setStats(data);
      }),
      getAdminAlerts()
        .then((data) => {
          if (!isCancelled) setAlerts(data);
        })
        .catch(() => {}),
    ])
      .catch(() => {
        if (!isCancelled) setError("Không thể tải thông số điều hành hệ thống.");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const retry = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a] = await Promise.all([
        getAdminStats(),
        getAdminAlerts().catch(() => null),
      ]);
      setStats(s);
      if (a) setAlerts(a);
    } catch {
      setError("Không thể tải thống kê. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [s, a] = await Promise.all([
        getAdminStats(),
        getAdminAlerts().catch(() => null),
      ]);
      setStats(s);
      if (a) setAlerts(a);
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-md max-w-sm w-full">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Chưa xác thực</h1>
          <p className="mt-2 text-sm text-slate-600">
            Vui lòng đăng nhập để truy cập Admin Console.
          </p>
          <Link to="/login" className="mt-5 inline-block">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center shadow-sm max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Truy cập bị từ chối</h1>
          <p className="mt-2 text-sm text-slate-600">
            Khu vực này yêu cầu đặc quyền Quản trị viên (Admin).
          </p>
        </div>
      </div>
    );
  }

  const totalAlertsCount =
    (alerts?.overdue_interviews?.length ?? 0) +
    (alerts?.pending_actions?.length ?? 0) +
    (alerts?.stale_jobs?.length ?? 0) +
    (alerts?.ai_errors_24h ?? 0) +
    (alerts?.pending_feedbacks ?? 0);

  const now = new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <>
      <SEOMeta
        title="Trung tâm Điều hành Hệ thống | Admin Console"
        description="Bảng điều hành và giám sát thời gian thực toàn bộ nền tảng AI Job Portal"
      />

      <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
        {/* ── Page Header (Enterprise SaaS Standard) ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[#00995C] text-[11px] font-mono font-bold uppercase tracking-wider">
                <Radio className="w-3 h-3 text-[#00B86B] animate-pulse" />
                Live Mission Control
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-slate-500 text-xs font-mono">
                Cập nhật: {now}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Trung tâm Điều hành Hệ thống
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Giám sát lưu lượng người dùng, hoạt động tuyển dụng, sự cố và tải lượng AI theo thời gian thực
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Auto-refresh interval selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Tự động:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                aria-label="Chu kỳ tự động làm mới"
              >
                <option value={0}>Tắt</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={300}>5 phút</option>
              </select>
              {autoRefreshInterval > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#00B86B] animate-pulse" title="Đang bật đồng bộ tự động" />
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin text-[#00B86B]" : ""}`}
              />
              <span>{refreshing ? "Đang đồng bộ..." : "Làm mới"}</span>
            </button>

            <button
              onClick={handleExportSummary}
              disabled={loading || !stats}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              title="Xuất bảng tổng hợp KPI hệ thống dạng CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất KPI CSV</span>
            </button>

            <Link to="/admin/ai/logs">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00B86B] hover:bg-[#00995C] text-white text-xs font-bold transition-all shadow-xs shadow-[#00B86B]/20">
                <Brain className="w-3.5 h-3.5" />
                <span>AI Logs & Chi phí</span>
              </button>
            </Link>

            <Link to="/admin/audit-logs">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span>Nhật ký bảo mật</span>
              </button>
            </Link>
          </div>
        </div>

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
                >
                  <Skeleton className="h-3 w-28 bg-slate-100 mb-4" />
                  <Skeleton className="h-10 w-24 bg-slate-100 mb-2" />
                  <Skeleton className="h-3 w-36 bg-slate-100" />
                </div>
              ))}
            </div>
            <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <Skeleton className="h-full w-full bg-slate-100 rounded-xl" />
            </div>
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-5 text-sm text-rose-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={retry}>
              Thử lại ngay
            </Button>
          </div>
        )}

        {/* ── Live Operational Content ── */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ── Section: Triage & Incident Hub ── */}
            {alerts && (
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[#00995C]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                        Cảnh báo Vận hành & Sự cố Khẩn cấp
                      </h2>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        Giám sát 4 tín hiệu an toàn và thời gian chờ của quy trình
                      </p>
                    </div>
                  </div>

                  {totalAlertsCount === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Hạ tầng tối ưu (0 sự cố)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-rose-800 text-xs font-bold animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      {totalAlertsCount} cảnh báo cần can thiệp
                    </span>
                  )}
                </div>

                <div className="grid gap-3.5 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 bg-slate-50/50">
                  <AlertTile
                    label="Phản hồi chờ xử lý"
                    count={alerts.pending_feedbacks ?? 0}
                    sublabel={
                      (alerts.urgent_feedbacks ?? 0) > 0
                        ? `${alerts.urgent_feedbacks} ý kiến khẩn cấp / CSAT thấp`
                        : "Ý kiến đóng góp & báo lỗi cần xem xét"
                    }
                    icon={MessageSquareHeart}
                    danger={(alerts.urgent_feedbacks ?? 0) > 0}
                    warn={(alerts.pending_feedbacks ?? 0) > 0 && (alerts.urgent_feedbacks ?? 0) === 0}
                    link="/admin/feedback"
                    linkLabel="Xử lý phản hồi"
                  />
                  <AlertTile
                    label="Phỏng vấn quá hạn"
                    count={alerts.overdue_interviews.length}
                    sublabel="Đã qua giờ nhưng chưa cập nhật kết quả"
                    icon={Clock}
                    danger
                    link="/admin/interviews"
                    linkLabel="Xử lý phỏng vấn"
                  />
                  <AlertTile
                    label="Lỗi AI Provider (24h)"
                    count={alerts.ai_errors_24h}
                    sublabel="Sự cố gọi DeepSeek API / Embedding"
                    icon={Sparkles}
                    warn={alerts.ai_errors_24h > 0}
                    link="/admin/ai/logs"
                    linkLabel="Xem chi tiết log AI"
                  />
                  <AlertTile
                    label="Hồ sơ chờ >14 ngày"
                    count={alerts.pending_actions.length}
                    sublabel="Chưa được nhà tuyển dụng xem xét"
                    icon={FileCheck}
                    warn={alerts.pending_actions.length > 0}
                    link="/admin/jobs"
                    linkLabel="Rà soát tin đăng"
                  />
                  <AlertTile
                    label="Tin tuyển dụng >30 ngày"
                    count={alerts.stale_jobs.length}
                    sublabel="Tin mở lâu, cần nhắc nhở cập nhật"
                    icon={Briefcase}
                    warn={alerts.stale_jobs.length > 0}
                    link="/admin/jobs"
                    linkLabel="Quản lý tin đăng"
                  />
                </div>
              </div>
            )}

            {/* ── Section: Core Primary KPIs ── */}
            {stats && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCard
                    label="Tổng Ứng viên"
                    value={stats.total_candidates}
                    sublabel="Tài khoản tìm việc kích hoạt"
                    icon={Users}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    accentGradient="bg-gradient-to-r from-blue-500 to-indigo-500"
                    link="/admin/users"
                  />
                  <KpiCard
                    label="Nhà tuyển dụng"
                    value={stats.total_employers}
                    sublabel="Doanh nghiệp đã đăng ký"
                    icon={Building2}
                    iconBg="bg-emerald-50"
                    iconColor="text-[#00995C]"
                    accentGradient="bg-gradient-to-r from-[#00B86B] to-emerald-400"
                    link="/admin/companies"
                  />
                  <KpiCard
                    label="Tin đang mở tuyển"
                    value={stats.total_active_jobs}
                    sublabel="Vị trí tuyển dụng đang nhận hồ sơ"
                    icon={Briefcase}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                    accentGradient="bg-gradient-to-r from-amber-500 to-orange-400"
                    link="/admin/jobs"
                  />
                  <KpiCard
                    label="Lượt Ứng tuyển"
                    value={stats.total_applications}
                    sublabel="Tổng hồ sơ nộp vào hệ thống"
                    icon={FileCheck}
                    iconBg="bg-violet-50"
                    iconColor="text-violet-600"
                    accentGradient="bg-gradient-to-r from-violet-500 to-purple-400"
                    link="/admin/jobs"
                  />
                </div>

                {/* ── Section: Secondary Performance Metrics ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "Nguồn Trực tiếp",
                      val: stats.candidate_source_pct?.direct ?? 0,
                      sub: "Đăng ký trực tiếp tại web",
                      icon: UserCheck,
                      ibg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      ic: "text-emerald-600",
                      bar: "bg-[#00B86B]",
                      isPct: true,
                    },
                    {
                      label: "Nguồn Google OAuth",
                      val: stats.candidate_source_pct?.google_oauth ?? 0,
                      sub: "Đăng nhập nhanh qua Google",
                      icon: Users,
                      ibg: "bg-rose-50 text-rose-700 border-rose-200",
                      ic: "text-rose-600",
                      bar: "bg-rose-500",
                      isPct: true,
                    },
                    {
                      label: "Tỷ lệ Vượt lọc CV",
                      val:
                        stats.funnel?.find(
                          (f) => f.round_type === "cv_screen"
                        )?.pass_rate ?? 0,
                      sub: "Vượt qua thẩm định hồ sơ",
                      icon: Target,
                      ibg: "bg-emerald-50 text-emerald-800 border-emerald-200",
                      ic: "text-[#00995C]",
                      bar: "bg-[#00B86B]",
                      isPct: true,
                    },
                    {
                      label: "Thời gian Tuyển TB",
                      val: stats.time_to_hire_avg_days ?? 0,
                      sub: "Số ngày trung bình đến lúc chốt tuyển",
                      icon: Clock,
                      ibg: "bg-amber-50 text-amber-800 border-amber-200",
                      ic: "text-amber-600",
                      bar: "bg-amber-500",
                      isPct: false,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs font-bold text-slate-700 tracking-normal">
                            {item.label}
                          </p>
                          <p className="mt-2 text-3xl font-black text-slate-900 tabular-nums">
                            {item.val}
                            {item.isPct ? (
                              <span className="text-base font-bold text-slate-600 ml-0.5">
                                %
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-slate-600 ml-1.5">
                                ngày
                              </span>
                            )}
                          </p>
                        </div>
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.ibg}`}
                        >
                          <item.icon className={`w-5 h-5 ${item.ic}`} />
                        </div>
                      </div>
                      {item.isPct && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
                          <motion.div
                            className={`h-1.5 rounded-full ${item.bar}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(item.val, 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.15 }}
                          />
                        </div>
                      )}
                      <p className="text-xs font-medium text-slate-600">{item.sub}</p>
                    </div>
                  ))}
                </div>

                {/* ── Section: Full Pipeline Funnel ── */}
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                        Phễu Tuyển Dụng & Vòng Phỏng Vấn Hệ Thống
                      </h2>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        Tỷ lệ chuyển đổi ứng viên qua từng chặng sàng lọc và phỏng vấn
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-slate-700 text-xs font-semibold">
                      <Layers className="w-3.5 h-3.5 text-[#00995C]" />
                      Toàn hệ thống
                    </span>
                  </div>

                  <div className="p-5">
                    {stats.funnel && stats.funnel.length > 0 ? (
                      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.funnel.map((f, idx) => {
                          const colors = [
                            {
                              g: "from-emerald-500 to-teal-500",
                              b: "bg-emerald-50 border-emerald-200 text-emerald-800",
                            },
                            {
                              g: "from-blue-500 to-cyan-500",
                              b: "bg-blue-50 border-blue-200 text-blue-800",
                            },
                            {
                              g: "from-violet-500 to-purple-500",
                              b: "bg-violet-50 border-violet-200 text-violet-800",
                            },
                            {
                              g: "from-amber-500 to-orange-500",
                              b: "bg-amber-50 border-amber-200 text-amber-800",
                            },
                          ];
                          const c = colors[idx % colors.length];
                          return (
                            <motion.div
                              key={f.round_type || f.round_name}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.08 }}
                              className="border border-slate-200/90 rounded-xl p-4 bg-slate-50/50"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {f.round_name}
                                </span>
                                <span
                                  className={`text-xs font-bold border rounded-md px-2 py-0.5 ml-2 ${c.b}`}
                                >
                                  {f.pass_rate}%
                                </span>
                              </div>
                              <div className="flex items-baseline gap-1.5 mb-3">
                                <span className="text-2xl font-black text-slate-900 tabular-nums">
                                  {f.passed}
                                </span>
                                <span className="text-xs text-slate-600 font-semibold">
                                  / {f.entered} ứng viên
                                </span>
                              </div>
                              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  className={`h-2 rounded-full bg-gradient-to-r ${c.g}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(f.pass_rate, 100)}%` }}
                                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8">
                        <EmptyState
                          title="Chưa có dữ liệu vòng phỏng vấn"
                          description="Hệ thống chưa ghi nhận ứng viên hoàn thành các vòng phỏng vấn tuyển dụng."
                          className="py-6 border-none bg-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Section: Live Analytics Charts ── */}
                <div className="grid gap-5 lg:grid-cols-2">
                  {/* User Growth Chart */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                          Tăng trưởng Người dùng (30 ngày)
                        </h2>
                        <p className="text-xs font-medium text-slate-600 mt-0.5">
                          Tài khoản ứng viên và nhà tuyển dụng mới đăng ký
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#00995C] font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Tăng trưởng</span>
                      </div>
                    </div>
                    <div className="p-5">
                      {(() => {
                        const raw = stats.new_users_last_30d ?? [];
                        const data = raw.map((d) => ({
                          date: d.date.split("-").slice(1).join("/"),
                          count: Number(d.count),
                        }));
                        if (data.length === 0) {
                          return (
                            <div className="h-[230px] flex items-center justify-center">
                              <EmptyState
                                title="Chưa có người dùng mới"
                                description="Chưa có tài khoản mới nào đăng ký trong 30 ngày qua."
                                className="py-4 border-none bg-transparent"
                              />
                            </div>
                          );
                        }
                        return (
                          <div className="h-[230px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={data}
                                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="gusr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00B86B" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#00B86B" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke="#E2E8F0"
                                />
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 10, fill: "#64748b" }}
                                  dy={6}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 10, fill: "#64748b" }}
                                  allowDecimals={false}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                    fontSize: "12px",
                                    color: "#0f172a",
                                  }}
                                  formatter={(v: unknown) => [
                                    `${v} người dùng`,
                                    "Đăng ký mới",
                                  ]}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="count"
                                  stroke="#00B86B"
                                  strokeWidth={2.5}
                                  fill="url(#gusr)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Application Volume Chart */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                          Lưu lượng Ứng tuyển (30 ngày)
                        </h2>
                        <p className="text-xs font-medium text-slate-600 mt-0.5">
                          Số lượt nộp hồ sơ ứng tuyển trên toàn nền tảng
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Hoạt động cao</span>
                      </div>
                    </div>
                    <div className="p-5">
                      {(() => {
                        const raw = stats.new_applications_last_30d ?? [];
                        const data = raw.map((d) => ({
                          date: d.date.split("-").slice(1).join("/"),
                          count: Number(d.count),
                        }));
                        if (data.length === 0) {
                          return (
                            <div className="h-[230px] flex items-center justify-center">
                              <EmptyState
                                title="Chưa có lượt ứng tuyển mới"
                                description="Chưa có hồ sơ nào được nộp trong 30 ngày qua."
                                className="py-4 border-none bg-transparent"
                              />
                            </div>
                          );
                        }
                        return (
                          <div className="h-[230px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={data}
                                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="gapp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke="#E2E8F0"
                                />
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 10, fill: "#64748b" }}
                                  dy={6}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 10, fill: "#64748b" }}
                                  allowDecimals={false}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                    fontSize: "12px",
                                    color: "#0f172a",
                                  }}
                                  formatter={(v: unknown) => [
                                    `${v} hồ sơ`,
                                    "Lượt ứng tuyển",
                                  ]}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="count"
                                  stroke="#2563eb"
                                  strokeWidth={2.5}
                                  fill="url(#gapp)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* ── Section: Fast Operational Dispatch Grid ── */}
                <div className="grid gap-3.5 sm:grid-cols-3 lg:grid-cols-7">
                  {[
                    {
                      label: "Phản hồi Người dùng",
                      icon: MessageSquareHeart,
                      link: "/admin/feedback",
                      color: "text-[#00995C]",
                      bg: "bg-emerald-50 border-emerald-200",
                    },
                    {
                      label: "Doanh nghiệp & KYC",
                      icon: Building2,
                      link: "/admin/companies",
                      color: "text-blue-700",
                      bg: "bg-blue-50 border-blue-200",
                    },
                    {
                      label: "Kiểm duyệt Việc làm",
                      icon: Briefcase,
                      link: "/admin/jobs",
                      color: "text-amber-700",
                      bg: "bg-amber-50 border-amber-200",
                    },
                    {
                      label: "Người dùng hệ thống",
                      icon: Users,
                      link: "/admin/users",
                      color: "text-indigo-700",
                      bg: "bg-indigo-50 border-indigo-200",
                    },
                    {
                      label: "Giám sát Chat Zero-K",
                      icon: Shield,
                      link: "/admin/chat",
                      color: "text-rose-700",
                      bg: "bg-rose-50 border-rose-200",
                    },
                    {
                      label: "Phiên Phỏng vấn AI",
                      icon: Clock,
                      link: "/admin/interviews",
                      color: "text-violet-700",
                      bg: "bg-violet-50 border-violet-200",
                    },
                    {
                      label: "AI System Prompts",
                      icon: Sparkles,
                      link: "/admin/ai/prompts",
                      color: "text-pink-700",
                      bg: "bg-pink-50 border-pink-200",
                    },
                  ].map((item) => (
                    <Link key={item.link} to={item.link}>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-2xl p-4 text-center shadow-xs transition-all cursor-pointer group"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${item.bg} border flex items-center justify-center mx-auto mb-2.5`}
                        >
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                          {item.label}
                        </p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}

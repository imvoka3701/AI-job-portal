import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, getAdminAlerts, type AdminStats, type AdminAlertsSummary } from "@/lib/api/admin";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, CardHeader, CardContent, Skeleton, Badge } from "@/components/ui";
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
} from "lucide-react";
import { AdminTabNavigation } from "./components/AdminTabNavigation";

export function AdminDashboard() {
  const user = useUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      getAdminAlerts().then((data) => {
        if (!isCancelled) setAlerts(data);
      }).catch(() => {}),
    ])
      .catch(() => {
        if (!isCancelled) setError("Không thể tải thống kê.");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const retry = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      getAdminStats().then(setStats),
      getAdminAlerts().then(setAlerts).catch(() => {}),
    ])
      .catch(() => setError("Không thể tải thống kê. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-page-bg px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Bạn chưa đăng nhập</h1>
            <p className="mt-3 text-sm text-gray-600">Đăng nhập để truy cập.</p>
            <div className="mt-6">
              <Link to="/login">
                <Button>Đăng nhập</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-page-bg px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Không có quyền truy cập</h1>
            <p className="mt-3 text-sm text-gray-600">Trang này chỉ dành cho Quản trị viên.</p>
          </Card>
        </div>
      </div>
    );
  }

  const totalAlertsCount =
    (alerts?.overdue_interviews?.length ?? 0) +
    (alerts?.pending_actions?.length ?? 0) +
    (alerts?.stale_jobs?.length ?? 0) +
    (alerts?.ai_errors_24h ?? 0);

  return (
    <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" className="flex items-center gap-1.5 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Admin Operations Hub
              </Badge>
              {totalAlertsCount > 0 && (
                <Badge variant="warning" size="sm" className="animate-pulse">
                  {totalAlertsCount} cảnh báo cần xử lý
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">Tổng quan hệ thống</h1>
            <p className="text-sm text-gray-500 mt-1">Giám sát và vận hành trung tâm quản trị toàn nền tảng</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/interviews">
              <Button variant="outline" size="sm" leftIcon={<Clock className="w-4 h-4" />}>
                Giám sát phỏng vấn
              </Button>
            </Link>
            <Link to="/admin/audit-logs">
              <Button variant="primary" size="sm" leftIcon={<Activity className="w-4 h-4" />}>
                Nhật ký quản trị
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <AdminTabNavigation />

        {loading && (
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={retry}>
              Thử lại
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* System Operations & Alerts Command Center */}
            {alerts && (
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Cảnh báo vận hành hệ thống</h2>
                    </div>
                    {totalAlertsCount === 0 ? (
                      <Badge variant="success" size="sm" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Hệ thống hoạt động tối ưu
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        {totalAlertsCount} mục cần rà soát
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Alert 1: Overdue Interviews */}
                    <div className={`p-4 rounded-lg border transition-all ${
                      alerts.overdue_interviews.length > 0
                        ? "border-red-200 bg-red-50/50 hover:bg-red-50"
                        : "border-gray-200 bg-gray-50/50"
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phỏng vấn quá hạn</p>
                          <p className="mt-2 text-2xl font-bold text-gray-900">
                            {alerts.overdue_interviews.length}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Đã qua giờ nhưng chưa có kết quả</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          alerts.overdue_interviews.length > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      {alerts.overdue_interviews.length > 0 && (
                        <Link to="/admin/interviews?result=pending" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800">
                          Rà soát ngay <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {/* Alert 2: AI Health */}
                    <div className={`p-4 rounded-lg border transition-all ${
                      alerts.ai_errors_24h > 0
                        ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
                        : "border-gray-200 bg-gray-50/50"
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Provider 24h</p>
                          <p className="mt-2 text-2xl font-bold text-gray-900">
                            {alerts.ai_errors_24h > 0 ? `${alerts.ai_errors_24h} lỗi` : "100% OK"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Trạng thái Deepseek / Embeddings</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          alerts.ai_errors_24h > 0 ? "bg-amber-100 text-warning" : "bg-green-100 text-success"
                        }`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                      </div>
                      <Link to="/admin/audit-logs" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover">
                        Xem log chi tiết <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Alert 3: Pending Applications */}
                    <div className={`p-4 rounded-lg border transition-all ${
                      alerts.pending_actions.length > 0
                        ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                        : "border-gray-200 bg-gray-50/50"
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hồ sơ chờ &gt;14 ngày</p>
                          <p className="mt-2 text-2xl font-bold text-gray-900">
                            {alerts.pending_actions.length}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Chưa được nhà tuyển dụng xử lý</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          alerts.pending_actions.length > 0 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          <FileCheck className="w-4 h-4" />
                        </div>
                      </div>
                      <Link to="/admin/jobs" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800">
                        Kiểm tra jobs <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Alert 4: Stale Jobs */}
                    <div className={`p-4 rounded-lg border transition-all ${
                      alerts.stale_jobs.length > 0
                        ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
                        : "border-gray-200 bg-gray-50/50"
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tin mở &gt;30 ngày</p>
                          <p className="mt-2 text-2xl font-bold text-gray-900">
                            {alerts.stale_jobs.length}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Tin tuyển dụng hoạt động lâu ngày</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          alerts.stale_jobs.length > 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          <Briefcase className="w-4 h-4" />
                        </div>
                      </div>
                      <Link to="/admin/jobs" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800">
                        Quản lý tin tuyển dụng <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main KPI Cards with Icons and Trends */}
            {stats && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Ứng viên</p>
                          <p className="mt-3 text-4xl font-bold text-gray-900">{stats.total_candidates}</p>
                          <p className="mt-2 text-xs text-gray-500">Tổng số tài khoản ứng viên</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Nhà tuyển dụng</p>
                          <p className="mt-3 text-4xl font-bold text-gray-900">{stats.total_employers}</p>
                          <p className="mt-2 text-xs text-gray-500">Tài khoản employer trong hệ thống</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-success" />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Tin đang hoạt động</p>
                          <p className="mt-3 text-4xl font-bold text-gray-900">{stats.total_active_jobs}</p>
                          <p className="mt-2 text-xs text-gray-500">Tin đang mở nhận hồ sơ</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-warning" />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Tổng ứng tuyển</p>
                          <p className="mt-3 text-4xl font-bold text-gray-900">{stats.total_applications}</p>
                          <p className="mt-2 text-xs text-gray-500">Tổng hồ sơ đã gửi</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-sky-600" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Secondary KPI Cards with Progress Indicators */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Nguồn trực tiếp</p>
                          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.candidate_source_pct?.direct ?? 0}%</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${stats.candidate_source_pct?.direct ?? 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Đăng ký trực tiếp trên nền tảng</p>
                    </div>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Google OAuth</p>
                          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.candidate_source_pct?.google_oauth ?? 0}%</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-red-500 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${stats.candidate_source_pct?.google_oauth ?? 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Đăng nhập qua Google</p>
                    </div>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Tỷ lệ qua vòng CV</p>
                          <p className="mt-2 text-3xl font-bold text-gray-900">
                            {stats.funnel?.find(f => f.round_type === 'cv_screen')?.pass_rate ?? 0}%
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <Target className="w-5 h-5 text-success" />
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                          className="bg-success h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${stats.funnel?.find(f => f.round_type === 'cv_screen')?.pass_rate ?? 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Ứng viên vượt qua sàng lọc CV</p>
                    </div>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">T/gian tuyển TB</p>
                          <p className="mt-2 text-3xl font-bold text-gray-900">
                            {stats.time_to_hire_avg_days != null ? `${stats.time_to_hire_avg_days}` : "—"}
                            {stats.time_to_hire_avg_days != null && <span className="text-lg text-gray-500 ml-1">ngày</span>}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Activity className="w-4 h-4 text-warning" />
                        <p className="text-xs text-gray-500">Thời gian trung bình từ đăng tin đến tuyển thành công</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Funnel bar chart */}
                {stats.funnel && stats.funnel.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h2 className="text-lg font-semibold text-gray-900">Tỷ lệ qua từng vòng (toàn hệ thống)</h2>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.funnel.map((f) => (
                          <div key={f.round_type}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-700">{f.round_name}</span>
                              <span className="text-gray-500">{f.passed}/{f.entered} ({f.pass_rate}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(f.pass_rate, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 30-day Trends Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Người dùng mới (30 ngày)</h2>
                        <Badge variant="info" size="sm">Hàng ngày</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stats.new_users_last_30d.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Chưa có dữ liệu</p>
                          <p className="text-xs text-gray-500">Dữ liệu người dùng mới sẽ xuất hiện ở đây</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="flex items-end gap-1 h-40 relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-light/20 to-transparent rounded-lg pointer-events-none" />
                            {stats.new_users_last_30d.map((d) => {
                              const max = Math.max(...stats.new_users_last_30d.map((x) => Number(x.count)), 1);
                              const heightPercent = (Number(d.count) / max) * 100;
                              return (
                                <div 
                                  key={d.date} 
                                  className="flex-1 flex flex-col items-center gap-1 relative group cursor-pointer" 
                                  title={`${d.date}: ${d.count} người dùng`}
                                >
                                  <span className="text-[9px] text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                                  <div 
                                    className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary-dark min-h-[4px] hover:from-primary-hover hover:to-primary transition-all shadow-sm" 
                                    style={{ height: `${heightPercent}%` }} 
                                  />
                                  <span className="text-[8px] text-gray-400 w-full text-center truncate">{d.date.slice(5)}</span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-success" />
                            Tổng: <span className="font-semibold text-gray-700">{stats.new_users_last_30d.reduce((sum, d) => sum + Number(d.count), 0)}</span> người dùng mới trong 30 ngày
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Ứng tuyển mới (30 ngày)</h2>
                        <Badge variant="success" size="sm">Hàng ngày</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stats.new_applications_last_30d.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <FileCheck className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Chưa có dữ liệu</p>
                          <p className="text-xs text-gray-500">Dữ liệu ứng tuyển mới sẽ xuất hiện ở đây</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="flex items-end gap-1 h-40 relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-green-50 to-transparent rounded-lg pointer-events-none" />
                            {stats.new_applications_last_30d.map((d) => {
                              const max = Math.max(...stats.new_applications_last_30d.map((x) => Number(x.count)), 1);
                              const heightPercent = (Number(d.count) / max) * 100;
                              return (
                                <div 
                                  key={d.date} 
                                  className="flex-1 flex flex-col items-center gap-1 relative group cursor-pointer" 
                                  title={`${d.date}: ${d.count} ứng tuyển`}
                                >
                                  <span className="text-[9px] text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                                  <div 
                                    className="w-full rounded-t-md bg-gradient-to-t from-sky-500 to-sky-400 min-h-[4px] hover:from-sky-600 hover:to-sky-500 transition-all shadow-sm" 
                                    style={{ height: `${heightPercent}%` }} 
                                  />
                                  <span className="text-[8px] text-gray-400 w-full text-center truncate">{d.date.slice(5)}</span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-success" />
                            Tổng: <span className="font-semibold text-gray-700">{stats.new_applications_last_30d.reduce((sum, d) => sum + Number(d.count), 0)}</span> ứng tuyển mới trong 30 ngày
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

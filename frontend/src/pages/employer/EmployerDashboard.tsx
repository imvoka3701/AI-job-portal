import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEmployerStats, type EmployerStats, type ActiveJobSummary } from "@/lib/api/employer";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, EmptyState, ErrorState, PageTransition } from "@/components/ui";
import { EmployerStatsWidget } from "./components/EmployerStatsWidget";
import { ActiveJobsTable } from "./components/ActiveJobsTable";
import { EmployerRoleOverview } from "./components/EmployerRoleOverview";
import {
  Briefcase,
  AlertCircle,
  Plus,
  Users,
  Building2,
  ClipboardList,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";

export function EmployerDashboard() {
  const user = useUser();
  const navigate = useNavigate();
  const { data: companyContext } = useEmployerCompany();
  const isDepartmentHead =
    companyContext?.membership.member_role === "department_head" && !companyContext.membership.is_owner;

  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Auth hydration
  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
    }
  }, [user]);

  // Fetch stats
  useEffect(() => {
    if (!user || user.role !== "employer") return;
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);
    getEmployerStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStatsError("Không thể tải thống kê dashboard.");
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSelectJob = (job: ActiveJobSummary) => {
    navigate(`/employer/candidates?jobId=${job.id}`);
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4 font-sans">
        <Card className="p-8 text-center max-w-md w-full rounded-3xl border-slate-200 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00B86B] flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Bàn Điều Hành Tuyển Dụng</h1>
          <p className="mt-2 text-sm text-slate-600">
            Đang tải dữ liệu tài khoản doanh nghiệp...
          </p>
        </Card>
      </div>
    );
  }

  // Not an employer
  if (user.role !== "employer") {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4 font-sans">
        <Card className="p-8 text-center max-w-md w-full shadow-sm border-slate-200 rounded-3xl">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Cổng Dành Riêng Cho Doanh Nghiệp</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Tài khoản hiện tại của bạn là Ứng viên. Vui lòng đăng nhập với tài khoản Nhà tuyển dụng để truy cập bảng điều khiển này.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/employer/landing">
              <Button className="w-full bg-[#00B86B] hover:bg-[#00995C] text-white font-bold rounded-xl py-2.5 shadow-sm">
                Tìm hiểu Cổng Nhà Tuyển Dụng
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full rounded-xl">Quay lại trang chủ</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const companyName = companyContext?.company.name || user.company_name || user.full_name;

  return (
    <PageTransition className="w-full font-sans pb-16 text-slate-900">
      <div className="w-full space-y-8">
        {/* ── 1. COMMAND HERO BENTO HEADER ───────────────────────────────── */}
        <section className="rounded-[32px] bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Company Identity */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-800 flex items-center justify-center text-white font-black text-3xl shadow-md shadow-emerald-500/20 border-4 border-white shrink-0 overflow-hidden">
                {companyContext?.company.logo_url ? (
                  <img src={companyContext.company.logo_url} alt={companyName} className="w-full h-full object-cover" />
                ) : (
                  <span>{companyName.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B] animate-pulse" />
                    Doanh Nghiệp Xác Thực
                  </span>
                  {companyContext && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {companyContext.membership.is_owner
                        ? "Chủ Sở Hữu / Owner"
                        : companyContext.membership.member_role === "hr"
                        ? "Quản Lý Nhân Sự"
                        : `Trưởng Bộ Phận · ${companyContext.membership.department_name || ""}`}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {companyName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {isDepartmentHead
                    ? `Dữ liệu thuộc ${companyContext?.membership.department_name ?? "phòng ban"} và các vị trí tuyển dụng được phân công.`
                    : "Trung tâm điều hành tuyển dụng thông minh & Tự động hóa sàng lọc ứng viên bằng AI."}
                </p>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/employer/jobs/new">
                <Button className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-full px-5 py-2.5 shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5">
                  <Plus size={15} />
                  <span>Đăng Tin Tuyển Mới</span>
                </Button>
              </Link>

              <Link to="/employer/candidates">
                <Button variant="outline" className="rounded-full text-xs font-bold px-4 py-2.5 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <Users size={15} className="text-[#00B86B]" />
                  <span>Phễu Ứng Viên</span>
                </Button>
              </Link>

              <Link to="/employer/recruitment-requests">
                <Button variant="outline" className="rounded-full text-xs font-bold px-4 py-2.5 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <ClipboardList size={15} className="text-blue-600" />
                  <span>Nhu Cầu Tuyển Dụng</span>
                </Button>
              </Link>

              <Link to="/employer/team">
                <Button variant="outline" className="rounded-full text-xs font-bold px-4 py-2.5 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <UserPlus size={15} className="text-purple-600" />
                  <span>Đội Ngũ</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. STATS & ANALYTICS WIDGET ─────────────────────────────────── */}
        {statsError ? (
          <ErrorState title="Không tải được dữ liệu" message={statsError} onRetry={() => window.location.reload()} />
        ) : stats ? (
          <div className="space-y-8">
            {companyContext && <EmployerRoleOverview context={companyContext} stats={stats} />}

            {/* 4 KPIs + Funnel & Trend charts */}
            <EmployerStatsWidget stats={stats} loading={statsLoading} error={null} scoped={Boolean(isDepartmentHead)} />

            {/* Active Jobs Table */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <ActiveJobsTable
                jobs={stats.active_jobs}
                loading={statsLoading}
                onSelectJob={handleSelectJob}
                canManageJobs={!isDepartmentHead}
                scoped={Boolean(isDepartmentHead)}
              />
            </motion.div>
          </div>
        ) : (
          <EmptyState
            icon={<AlertCircle className="w-8 h-8 text-slate-400" />}
            title={statsLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu tuyển dụng"}
            description="Bảng thống kê tuyển dụng sẽ hiển thị sau khi bạn bắt đầu đăng tin và nhận hồ sơ ứng viên."
            className="py-16 bg-white rounded-3xl border border-slate-200 shadow-xs"
          />
        )}
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEmployerStats, type EmployerStats, type ActiveJobSummary } from "@/lib/api/employer";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, EmptyState, ErrorState, PageTransition } from "@/components/ui";
import { EmployerStatsWidget } from "./components/EmployerStatsWidget";
import { ActiveJobsTable } from "./components/ActiveJobsTable";
import { EmployerRoleOverview } from "./components/EmployerRoleOverview";
import { Briefcase, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";

export function EmployerDashboard() {
  const user = useUser();
  const navigate = useNavigate();
  const { data: companyContext } = useEmployerCompany();
  const isDepartmentHead = companyContext?.membership.member_role === "department_head" && !companyContext.membership.is_owner;

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
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Đang tải...</h1>
        </div>
      </div>
    );
  }

  // Not an employer
  if (user.role !== "employer") {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Card className="p-8 text-center max-w-md w-full shadow-sm border-red-100">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Briefcase className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Truy cập bị từ chối</h1>
          <p className="mt-3 text-sm text-gray-600">
            Trang này chỉ dành cho tài khoản Nhà tuyển dụng. Vui lòng đăng nhập với tài khoản phù hợp.
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button variant="outline" className="w-full">Quay lại trang chủ</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-8 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      {/* Tier 1: Overview Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white border border-gray-200 rounded-3xl p-8 shadow-sm overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                Dashboard
              </span>
              {companyContext && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${companyContext.membership.is_owner ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' : 'bg-gray-100 text-gray-700 border-gray-200/60'}`}>
                  {companyContext.membership.is_owner
                    ? "Owner · Nhân sự"
                    : companyContext.membership.member_role === "hr"
                      ? "Nhân sự"
                      : `Trưởng bộ phận${companyContext.membership.department_name ? ` · ${companyContext.membership.department_name}` : ""}`}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Chào mừng trở lại, {companyContext?.company.name || user.company_name || user.full_name}
            </h1>
            <p className="text-base text-gray-500 mt-2 leading-relaxed">
              {isDepartmentHead
                ? `Dữ liệu thuộc ${companyContext?.membership.department_name ?? "phòng ban"} và các job được phân công trong 30 ngày qua.`
                : "Theo dõi tổng quan hiệu suất tuyển dụng toàn doanh nghiệp trong 30 ngày qua."}
            </p>
          </div>

          {stats && stats.active_jobs.length > 0 && (
            <div className="shrink-0 bg-blue-50/50 border border-blue-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="relative flex h-3 w-3 mt-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900/80 mb-1">Ứng viên mới cần xử lý</p>
                  <p className="text-2xl font-bold text-blue-900 mb-3">{stats.total_applications}</p>
                  <Link to="/employer/candidates" className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                    Xử lý ngay <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {statsError ? (
        <ErrorState title="Không tải được dashboard" message={statsError} onRetry={() => window.location.reload()} />
      ) : stats ? (
        <div className="space-y-8">
          {companyContext && <EmployerRoleOverview context={companyContext} stats={stats} />}
          
          {/* Tier 2: Insights Grid is inside EmployerStatsWidget */}
          <EmployerStatsWidget stats={stats} loading={statsLoading} error={null} scoped={Boolean(isDepartmentHead)} />
          
          {/* Tier 3: Workspace */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-4"
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
          icon={<AlertCircle className="w-7 h-7 text-gray-400" />}
          title={statsLoading ? "Đang tải dashboard" : "Chưa có dữ liệu"}
          description="Tổng quan tuyển dụng sẽ hiện ở đây sau khi dữ liệu được tải."
          className="py-16 bg-white rounded-3xl border border-gray-200"
        />
      )}
    </PageTransition>
  );
}

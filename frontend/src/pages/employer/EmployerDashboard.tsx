import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEmployerStats, type EmployerStats, type ActiveJobSummary } from "@/lib/api/employer";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Badge, Button, Card, EmptyState, ErrorState, PageTransition } from "@/components/ui";
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
    <PageTransition className="space-y-6 pb-12 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">Dashboard Nhà tuyển dụng</p>
            {companyContext && (
              <Badge variant={companyContext.membership.is_owner ? "primary" : "default"} size="sm">
                {companyContext.membership.is_owner
                  ? "Owner · Nhân sự"
                  : companyContext.membership.member_role === "hr"
                    ? "Nhân sự"
                    : `Trưởng bộ phận${companyContext.membership.department_name ? ` · ${companyContext.membership.department_name}` : ""}`}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Chào mừng trở lại, {companyContext?.company.name || user.company_name || user.full_name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isDepartmentHead
              ? `Dữ liệu thuộc ${companyContext?.membership.department_name ?? "phòng ban"} và các job được phân công trong 30 ngày qua.`
              : "Dữ liệu tuyển dụng toàn doanh nghiệp trong 30 ngày qua."}
          </p>
        </div>

        {stats && stats.active_jobs.length > 0 && (
          <Card className="px-4 py-3 border-blue-100 bg-blue-50/50 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
              </span>
              <span className="text-sm text-blue-900 font-medium">
                Có <strong>{stats.total_applications}</strong> ứng viên trong phạm vi của bạn
              </span>
              <Link to="/employer/candidates" className="text-sm font-semibold text-blue-700 inline-flex items-center hover:text-blue-800 transition-colors">
                Xem ngay <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </Card>
        )}
      </motion.div>

      {statsError ? (
        <ErrorState title="Không tải được dashboard" message={statsError} onRetry={() => window.location.reload()} />
      ) : stats ? (
        <>
          {companyContext && <EmployerRoleOverview context={companyContext} stats={stats} />}
          <EmployerStatsWidget stats={stats} loading={statsLoading} error={null} scoped={Boolean(isDepartmentHead)} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ActiveJobsTable
              jobs={stats.active_jobs}
              loading={statsLoading}
              onSelectJob={handleSelectJob}
              canManageJobs={!isDepartmentHead}
              scoped={Boolean(isDepartmentHead)}
            />
          </motion.div>
        </>
      ) : (
        <EmptyState
          icon={<AlertCircle className="w-7 h-7 text-gray-400" />}
          title={statsLoading ? "Đang tải dashboard" : "Chưa có dữ liệu"}
          description="Tổng quan tuyển dụng sẽ hiện ở đây sau khi dữ liệu được tải."
          className="py-16"
        />
      )}
    </PageTransition>
  );
}

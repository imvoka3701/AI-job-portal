import { ArrowRight, Briefcase, Calendar, Crown, ShieldCheck, UserCog, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button, Card } from "@/components/ui";
import type { EmployerStats } from "@/lib/api/employer";
import type { CompanyContext } from "@/types/company";

export function EmployerRoleOverview({ context, stats }: { context: CompanyContext; stats: EmployerStats }) {
  const isOwner = context.membership.is_owner;
  const isHead = context.membership.member_role === "department_head" && !isOwner;
  const RoleIcon = isOwner ? Crown : isHead ? ShieldCheck : UserCog;
  const roleLabel = isOwner ? "Owner · Nhân sự" : isHead ? "Trưởng bộ phận" : "Nhân sự";
  const scopeLabel = isHead
    ? context.membership.department_name ?? "Phạm vi được phân công"
    : "Toàn doanh nghiệp";

  const actions = isHead
    ? [
        { label: "Ứng viên cần đánh giá", href: "/employer/candidates", icon: Users },
        { label: "Lịch phỏng vấn", href: "/employer/interviews", icon: Calendar },
        { label: "Quyền của tôi", href: "/employer/team", icon: ShieldCheck },
      ]
    : [
        { label: "Đăng tin mới", href: "/employer/jobs/new", icon: Briefcase },
        { label: "Xem pipeline", href: "/employer/candidates", icon: Users },
        ...(isOwner ? [{ label: "Quản lý đội ngũ", href: "/employer/team", icon: UserCog }] : []),
      ];

  return (
    <Card noPadding className="overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(420px,1fr)]">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            <RoleIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {isHead ? "Không gian đánh giá chuyên môn" : "Trung tâm vận hành tuyển dụng"}
              </h2>
              <Badge variant="primary" size="sm">{roleLabel}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {isHead
                ? "Tập trung đánh giá ứng viên, ghi đề xuất và phối hợp với Nhân sự. Bạn không thể tự đưa ra quyết định tuyển dụng cuối."
                : "Theo dõi toàn bộ pipeline, điều phối phỏng vấn và ra quyết định tuyển dụng dựa trên đánh giá của con người."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((action) => (
                <Link key={action.href + action.label} to={action.href}>
                  <Button variant="secondary" size="sm" leftIcon={<action.icon className="h-3.5 w-3.5" />} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-gray-200 bg-gray-50 lg:border-l lg:border-t-0">
          <RoleMetric label="Phạm vi" value={scopeLabel} />
          <RoleMetric label={isHead ? "Job phụ trách" : "Job hoạt động"} value={String(stats.active_jobs.length)} />
          <RoleMetric label="Ứng viên" value={String(stats.total_applications)} />
        </div>
      </div>
    </Card>
  );
}

function RoleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col justify-center border-r border-gray-200 px-4 py-5 last:border-r-0">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-gray-900" title={value}>{value}</p>
    </div>
  );
}

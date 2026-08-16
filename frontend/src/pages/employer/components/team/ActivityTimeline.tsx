import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  Crown,
  ClipboardList,
  History,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { getCompanyActivity } from "@/lib/api/company";
import { cn } from "@/lib/utils";
import type { CompanyActivity } from "@/types/company";

interface ActivityTimelineProps {
  refreshKey?: number;
}

const PAGE_SIZE = 10;

const TARGET_FILTERS = [
  ["", "Tất cả đối tượng"],
  ["membership", "Thành viên"],
  ["invitation", "Lời mời"],
  ["department", "Phòng ban"],
  ["job", "Job"],
  ["job_assignment_batch", "Phân công job"],
  ["recruitment_request", "Nhu cầu tuyển dụng"],
] as const;

const ACTION_FILTERS = [
  ["", "Tất cả hoạt động"],
  ["membership.updated", "Thay đổi thành viên"],
  ["membership.ownership_transferred", "Chuyển ownership"],
  ["membership.invited", "Tạo lời mời"],
  ["job.assignments_batch_updated", "Phân công job hàng loạt"],
  ["department.updated", "Cập nhật phòng ban"],
  ["recruitment_request.submitted", "Gửi nhu cầu tuyển dụng"],
  ["recruitment_request.approved", "Duyệt nhu cầu tuyển dụng"],
] as const;

const ACTION_META: Record<string, { label: string; icon: typeof History; tone: string }> = {
  "company.approved": { label: "Doanh nghiệp đã được phê duyệt", icon: ShieldCheck, tone: "bg-primary-light text-primary" },
  "department.created": { label: "Đã tạo phòng ban", icon: Building2, tone: "bg-blue-50 text-blue-600" },
  "department.updated": { label: "Đã cập nhật phòng ban", icon: Building2, tone: "bg-blue-50 text-blue-600" },
  "membership.invited": { label: "Đã tạo lời mời", icon: Mail, tone: "bg-primary-light text-primary" },
  "membership.accepted": { label: "Thành viên đã tham gia", icon: UserCheck, tone: "bg-primary-light text-primary" },
  "membership.invitation_resent": { label: "Đã gửi lại lời mời", icon: Mail, tone: "bg-amber-50 text-amber-600" },
  "membership.invitation_revoked": { label: "Đã thu hồi lời mời", icon: Mail, tone: "bg-red-50 text-red-600" },
  "membership.invitation_delivery_updated": { label: "Đã cập nhật trạng thái gửi email", icon: Mail, tone: "bg-blue-50 text-blue-600" },
  "membership.invitation_bounced": { label: "Email lời mời bị trả lại", icon: Mail, tone: "bg-red-50 text-red-600" },
  "membership.updated": { label: "Đã thay đổi thành viên", icon: ShieldCheck, tone: "bg-amber-50 text-amber-600" },
  "membership.ownership_transferred": { label: "Đã chuyển ownership", icon: Crown, tone: "bg-primary-light text-primary" },
  "job.assignments_updated": { label: "Đã cập nhật phạm vi job", icon: BriefcaseBusiness, tone: "bg-blue-50 text-blue-600" },
  "job.assignments_batch_updated": { label: "Đã đồng bộ phạm vi job", icon: ArrowLeftRight, tone: "bg-primary-light text-primary" },
  "recruitment_request.created": { label: "Đã tạo nhu cầu tuyển dụng", icon: ClipboardList, tone: "bg-blue-50 text-blue-600" },
  "recruitment_request.updated": { label: "Đã cập nhật nhu cầu tuyển dụng", icon: ClipboardList, tone: "bg-blue-50 text-blue-600" },
  "recruitment_request.submitted": { label: "Đã gửi nhu cầu cho HR", icon: ClipboardList, tone: "bg-amber-50 text-amber-600" },
  "recruitment_request.approved": { label: "Đã phê duyệt nhu cầu tuyển dụng", icon: UserCheck, tone: "bg-primary-light text-primary" },
  "recruitment_request.rejected": { label: "Đã yêu cầu chỉnh sửa nhu cầu", icon: ClipboardList, tone: "bg-red-50 text-red-600" },
  "recruitment_request.cancelled": { label: "Đã hủy nhu cầu tuyển dụng", icon: ClipboardList, tone: "bg-gray-100 text-gray-600" },
  "recruitment_request.converted": { label: "Đã chuyển nhu cầu thành tin tuyển dụng", icon: BriefcaseBusiness, tone: "bg-primary-light text-primary" },
};

function detailSummary(activity: CompanyActivity): string {
  const details = activity.details_json;
  if (activity.action === "company.approved") {
    return "Hồ sơ doanh nghiệp đã được Admin xác minh và kích hoạt.";
  }
  if (activity.action === "job.assignments_batch_updated") {
    const changes = Array.isArray(details.changes) ? details.changes.length : 0;
    return changes > 0 ? `${changes} job có thay đổi phạm vi.` : "Phạm vi đã được kiểm tra, không có thay đổi mới.";
  }
  if (activity.action.startsWith("recruitment_request.")) {
    if (activity.action === "recruitment_request.converted") {
      return "Yêu cầu đã được liên kết với một tin tuyển dụng chính thức.";
    }
    return "Vòng đời nhu cầu tuyển dụng đã được cập nhật và lưu vết.";
  }
  if (activity.action === "membership.updated") {
    const labels: string[] = [];
    if ("member_role" in details) labels.push("vai trò");
    if ("department_id" in details) labels.push("phòng ban");
    if ("status" in details) labels.push("trạng thái truy cập");
    return labels.length > 0 ? `Thay đổi ${labels.join(", ")}.` : "Thông tin thành viên đã được cập nhật.";
  }
  if (activity.action === "membership.ownership_transferred") {
    return "Quyền quản trị cao nhất đã được chuyển cho Owner mới.";
  }
  if (activity.action === "membership.invited") {
    return "Lời mời tham gia doanh nghiệp đã được tạo.";
  }
  if (activity.action === "membership.accepted") {
    return "Thành viên đã xác nhận lời mời và nhận phạm vi được cấp.";
  }
  if (activity.action.startsWith("membership.invitation")) {
    return "Vòng đời lời mời đã được cập nhật và ghi nhận.";
  }
  return "Thao tác đã được ghi nhận trong nhật ký bất biến.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ActivityTimeline({ refreshKey = 0 }: ActivityTimelineProps) {
  const [items, setItems] = useState<CompanyActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCompanyActivity({
        page,
        page_size: PAGE_SIZE,
        action: action || undefined,
        target_type: targetType || undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("Không thể tải nhật ký hoạt động của doanh nghiệp.");
    } finally {
      setLoading(false);
    }
  }, [action, page, targetType]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const updateFilter = (setter: (value: string) => void, value: string) => {
    setPage(1);
    setter(value);
  };

  return (
    <Card noPadding>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 p-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">Nhật ký hoạt động</h2>
            <Badge variant="default">Bất biến</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">Theo dõi ai đã thay đổi quyền, phòng ban, lời mời và phạm vi tuyển dụng.</p>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />} onClick={() => void load()} disabled={loading}>
          Làm mới
        </Button>
      </div>

      <div className="grid gap-3 border-b border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
        <select aria-label="Lọc nhật ký theo đối tượng" value={targetType} onChange={(event) => updateFilter(setTargetType, event.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          {TARGET_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Lọc nhật ký theo hoạt động" value={action} onChange={(event) => updateFilter(setAction, event.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          {ACTION_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-0 divide-y divide-gray-100" aria-label="Đang tải nhật ký hoạt động">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3 p-5"><Skeleton circle className="h-10 w-10" /><div className="flex-1"><Skeleton className="h-4 w-56" /><Skeleton className="mt-2 h-3 w-80" /></div></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-5"><ErrorState title="Không tải được nhật ký" message={error} onRetry={() => void load()} /></div>
      ) : items.length === 0 ? (
        <div className="p-5"><EmptyState icon={<History className="h-7 w-7 text-gray-400" />} title="Chưa có hoạt động phù hợp" description="Các thay đổi quyền và phạm vi tuyển dụng sẽ xuất hiện tại đây." /></div>
      ) : (
        <ol className="divide-y divide-gray-100">
          {items.map((activity, index) => {
            const meta = ACTION_META[activity.action] ?? { label: activity.action, icon: History, tone: "bg-gray-100 text-gray-600" };
            const Icon = meta.icon;
            return (
              <motion.li key={activity.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: Math.min(index * 0.025, 0.15) }} className="flex gap-4 p-5">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", meta.tone)}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                    <time dateTime={activity.created_at} className="text-xs text-gray-400">{formatDate(activity.created_at)}</time>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{activity.target_label ?? "Dữ liệu doanh nghiệp"} · {detailSummary(activity)}</p>
                  <p className="mt-1 truncate text-xs text-gray-400" title={activity.actor_email}>Thực hiện bởi {activity.actor_email}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <p className="text-xs text-gray-500">Trang {page}/{totalPages} · {total} hoạt động</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Trang nhật ký trước" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Trang nhật ký tiếp theo" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </Card>
  );
}

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, RefreshCw, Shield } from "lucide-react";
import { AdminTabNavigation } from "./components/AdminTabNavigation";
import {
  getAdminAuditLogs,
  type AdminAuditLogItem,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/axios";
import { Badge, Button, Card, Skeleton } from "@/components/ui";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  "company.approved": "Duyệt công ty",
  "company.deactivated": "Khóa công ty",
  "user.activated": "Mở khóa người dùng",
  "user.deactivated": "Khóa người dùng",
  "job.activated": "Mở lại tin",
  "job.deactivated": "Đóng tin",
  "job.deleted": "Xóa vĩnh viễn tin",
};

const TARGET_LABELS: Record<string, string> = {
  company: "Công ty",
  user: "Người dùng",
  job: "Tin tuyển dụng",
};

export function AdminAuditLogs() {
  const [data, setData] = useState<{ items: AdminAuditLogItem[]; total: number }>({
    items: [],
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminAuditLogs({
        target_type: targetType || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setData({ items: result.items, total: result.total });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, targetType]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Badge variant="primary" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Badge>
          <h1 className="text-3xl font-semibold text-gray-900">Nhật ký quản trị</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi các thao tác có ảnh hưởng đến tài khoản và dữ liệu tuyển dụng.
          </p>
        </div>

        <AdminTabNavigation />

        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-gray-700">
            Đối tượng
            <select
              aria-label="Lọc đối tượng nhật ký"
              className="ml-3 h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              <option value="company">Công ty</option>
              <option value="user">Người dùng</option>
              <option value="job">Tin tuyển dụng</option>
            </select>
          </label>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadLogs()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Làm mới
          </Button>
        </div>

        {loading && (
          <div className="space-y-3" aria-label="Đang tải nhật ký">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="p-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-2 h-3 w-72" />
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <Card className="border-red-200 bg-red-50 p-5" role="alert">
            <p className="text-sm font-medium text-red-700">Không tải được nhật ký quản trị.</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <Button className="mt-4" size="sm" variant="secondary" onClick={() => void loadLogs()}>
              Thử lại
            </Button>
          </Card>
        )}

        {!loading && !error && data.items.length === 0 && (
          <Card className="p-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-900">Chưa có thao tác quản trị</p>
            <p className="mt-1 text-sm text-gray-500">Nhật ký sẽ xuất hiện sau khi Admin duyệt, khóa hoặc mở dữ liệu.</p>
          </Card>
        )}

        {!loading && !error && data.items.length > 0 && (
          <Card noPadding>
            <div className="divide-y divide-gray-100">
              {data.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {ACTION_LABELS[item.action] ?? item.action}
                      </p>
                      <Badge variant="default" size="sm">
                        {TARGET_LABELS[item.target_type] ?? item.target_type}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-600">
                      {item.target_label ?? `ID ${item.target_id ?? "-"}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Thực hiện bởi {item.actor_email}</p>
                  </div>
                  <time className="shrink-0 text-xs text-gray-500" dateTime={item.created_at}>
                    {new Date(item.created_at).toLocaleString("vi-VN")}
                  </time>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 p-4">
              <span className="text-xs text-gray-500">
                {data.total} bản ghi · Trang {page}/{Math.ceil(data.total / PAGE_SIZE) || 1}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                  Trước
                </Button>
                <Button variant="secondary" size="sm" disabled={page * PAGE_SIZE >= data.total} onClick={() => setPage((value) => value + 1)}>
                  Sau
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

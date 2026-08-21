import { useCallback, useEffect, useState } from "react";
import { getAdminJobs, setAdminJobStatus, type AdminJobItem } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, Badge, Input, Skeleton } from "@/components/ui";
import { Shield } from "lucide-react";
import { AdminTabNavigation } from "./components/AdminTabNavigation";

export function AdminJobs() {
  const user = useUser();
  const [data, setData] = useState<{ items: AdminJobItem[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetch = useCallback(() => {
    let c = false; setLoading(true); setError(null);
    getAdminJobs({
      keyword: keyword || undefined,
      is_active: statusFilter ? statusFilter === "active" : undefined,
      page,
      page_size: 20,
    })
      .then((d) => { if (!c) { setData(d); setLoading(false); } })
      .catch(() => { if (!c) { setError("Không thể tải danh sách."); setLoading(false); } });
    return () => { c = true; };
  }, [keyword, statusFilter, page]);

  useEffect(() => {
    if (!user && tokenStorage.get()) { useAuthStore.getState().fetchMe().catch(() => {}); return; }
    if (!user) { setLoading(false); return; }
    return fetch();
  }, [user, fetch]);

  const handleStatus = async (job: AdminJobItem) => {
    const nextActive = !job.is_active;
    if (!confirm(`${nextActive ? "Mở lại" : "Đóng"} tin "${job.title}"?`)) return;
    setActionId(job.id);
    try {
      const updated = await setAdminJobStatus(job.id, nextActive);
      setData((previous) => ({
        ...previous,
        items: previous.items.map((item) => item.id === job.id ? updated : item),
      }));
      setMsg(`${nextActive ? "Đã mở lại" : "Đã đóng"} tin "${job.title}".`);
    } catch (e) { setMsg(getApiErrorMessage(e)); }
    finally { setActionId(null); }
    setTimeout(() => setMsg(null), 3000);
  };

  if (!user) return <GuestPage>Vui lòng đăng nhập để truy cập.</GuestPage>;
  if (user.role !== "admin") return <GuestPage>Không có quyền truy cập.</GuestPage>;

  return (
    <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Badge */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="primary" className="flex items-center gap-1.5 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">Quản lý tin tuyển dụng</h1>
          <p className="text-sm text-gray-500 mt-1">Xem và quản lý tất cả tin tuyển dụng trên nền tảng</p>
        </div>

        {/* Tab Navigation */}
        <AdminTabNavigation />

        {msg && <div className="rounded-lg bg-primary-light border border-primary/20 p-3 text-sm text-primary-dark">{msg}</div>}

        <div className="flex flex-wrap gap-2">
          <div className="min-w-64 flex-1">
            <Input
              aria-label="Tìm kiếm tin tuyển dụng"
              placeholder="Tiêu đề, công ty hoặc email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setPage(1);
                  setKeyword(searchInput.trim());
                }
              }}
            />
          </div>
          <select
            aria-label="Lọc trạng thái tin"
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang mở</option>
            <option value="inactive">Đã đóng</option>
          </select>
          <Button size="md" onClick={() => { setPage(1); setKeyword(searchInput.trim()); }}>Tìm</Button>
        </div>

        {loading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><div className="p-4 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/4" /></div></Card>)}</div>}
        {!loading && error && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}<Button className="ml-3" size="sm" variant="secondary" onClick={fetch}>Thử lại</Button></div>}
        {!loading && !error && data.items.length === 0 && <Card><div className="py-8 text-center"><p className="text-sm text-gray-500">Không có tin tuyển dụng nào.</p></div></Card>}

        {!loading && !error && data.items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 text-left">
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Công ty</th>
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Loại</th>
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase text-right">Hành động</th>
                </tr></thead>
                <tbody>
                  {data.items.map((j) => (
                    <tr key={j.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900 truncate max-w-[200px]">{j.title}</td>
                      <td className="p-3 text-gray-600 hidden sm:table-cell">{j.company_name ?? j.employer_email}</td>
                      <td className="p-3 hidden sm:table-cell"><Badge variant="default" size="sm">{j.job_type === "full_time" ? "Full-time" : j.job_type === "part_time" ? "Part-time" : j.job_type === "remote" ? "Remote" : j.job_type === "internship" ? "Internship" : "Freelance"}</Badge></td>
                      <td className="p-3"><Badge variant={j.is_active ? "success" : "default"} size="sm" dot>{j.is_active ? "Đang mở" : "Đã đóng"}</Badge></td>
                      <td className="p-3 text-right">
                        <Button
                          variant={j.is_active ? "destructive" : "primary"}
                          size="sm"
                          isLoading={actionId === j.id}
                          onClick={() => void handleStatus(j)}
                        >
                          {j.is_active ? "Đóng tin" : "Mở lại"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">{data.total} tin — Trang {page} / {Math.ceil(data.total / 20) || 1}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
                <Button variant="secondary" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function GuestPage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-page-bg px-4 py-10"><div className="max-w-6xl mx-auto"><Card className="p-8 text-center"><p className="text-gray-600">{children}</p></Card></div></div>;
}

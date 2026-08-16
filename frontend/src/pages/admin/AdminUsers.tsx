import { useEffect, useState } from "react";
import { getAdminUsers, toggleUserStatus, type AdminUserItem } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, Badge, Input, Skeleton } from "@/components/ui";
import { Shield } from "lucide-react";
import { AdminTabNavigation } from "./components/AdminTabNavigation";

export function AdminUsers() {
  const user = useUser();
  const [data, setData] = useState<{ items: AdminUserItem[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetch = () => {
    let c = false; setLoading(true); setError(null);
    getAdminUsers({
      keyword: keyword || undefined,
      role: roleFilter || undefined,
      is_active: statusFilter ? statusFilter === "active" : undefined,
      page,
      page_size: 20,
    })
      .then((d) => { if (!c) { setData(d); setLoading(false); } })
      .catch(() => { if (!c) { setError("Không thể tải danh sách."); setLoading(false); } });
    return () => { c = true; };
  };

  useEffect(() => {
    if (!user && tokenStorage.get()) { useAuthStore.getState().fetchMe().catch(() => {}); return; }
    if (!user) { setLoading(false); return; }
    return fetch();
  }, [user, page, roleFilter, statusFilter, keyword]);

  const handleToggle = async (userId: number, currentActive: boolean, name: string) => {
    const newState = !currentActive;
    setActionId(userId);
    try {
      await toggleUserStatus(userId, newState);
      setData((p) => ({ ...p, items: p.items.map((u) => u.id === userId ? { ...u, is_active: newState } : u) }));
      setMsg(`${newState ? "Đã mở khóa" : "Đã khóa"} tài khoản "${name}".`);
    } catch (e) { setMsg(getApiErrorMessage(e)); }
    finally { setActionId(null); }
    setTimeout(() => setMsg(null), 3000);
  };

  if (!user) return <GuestPage>Vui lòng đăng nhập để truy cập.</GuestPage>;
  if (user.role !== "admin") return <GuestPage>Không có quyền truy cập.</GuestPage>;

  const roleLabel = (r: string) => r === "candidate" ? "Ứng viên" : r === "employer" ? "Nhà tuyển dụng" : "Admin";

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
          <h1 className="text-3xl font-semibold text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Xem và quản lý tất cả người dùng trên nền tảng</p>
        </div>

        {/* Tab Navigation */}
        <AdminTabNavigation />

        {msg && <div className="rounded-lg bg-primary-light border border-primary/20 p-3 text-sm text-primary-dark">{msg}</div>}

        <div className="flex flex-wrap gap-2">
          <div className="min-w-64 flex-1">
            <Input
              aria-label="Tìm kiếm người dùng"
              placeholder="Tên, email hoặc công ty..."
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
          <select className="h-10 rounded-lg border border-gray-200 bg-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Lọc vai trò người dùng"
            value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả vai trò</option>
            <option value="candidate">Ứng viên</option>
            <option value="employer">Nhà tuyển dụng</option>
            <option value="admin">Admin</option>
          </select>
          <select
            aria-label="Lọc trạng thái người dùng"
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
          <Button size="md" onClick={() => { setPage(1); setKeyword(searchInput.trim()); }}>Tìm</Button>
        </div>

        {loading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><div className="p-4 flex justify-between items-center"><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-32" /></div><Skeleton className="h-8 w-16 rounded-lg" /></div></Card>)}</div>}
        {!loading && error && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}<Button className="ml-3" size="sm" variant="secondary" onClick={fetch}>Thử lại</Button></div>}
        {!loading && !error && data.items.length === 0 && <Card><div className="py-8 text-center"><p className="text-sm text-gray-500">Không có người dùng nào.</p></div></Card>}

        {!loading && !error && data.items.length > 0 && (
          <>
            <div className="space-y-3">
              {data.items.map((u) => (
                <Card key={u.id}>
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900">{u.full_name}</h3>
                        <Badge variant="default" size="sm">{roleLabel(u.role)}</Badge>
                        <Badge variant={u.is_active ? "success" : "danger"} size="sm" dot>{u.is_active ? "Hoạt động" : "Đã khóa"}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{u.email}{u.company_name ? ` — ${u.company_name}` : ""}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Đăng ký: {new Date(u.created_at).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <div className="shrink-0">
                      {u.id === user.id ? (
                        <Badge variant="primary" size="sm">Đang đăng nhập</Badge>
                      ) : (
                      <Button variant={u.is_active ? "destructive" : "primary"} size="sm"
                        isLoading={actionId === u.id}
                        onClick={() => handleToggle(u.id, u.is_active, u.full_name)}>
                        {u.is_active ? "Khóa" : "Mở khóa"}
                      </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{data.total} người dùng — Trang {page} / {Math.ceil(data.total / 20) || 1}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
                <Button variant="secondary" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GuestPage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-page-bg px-4 py-10"><div className="max-w-6xl mx-auto"><Card className="p-8 text-center"><p className="text-gray-600">{children}</p></Card></div></div>;
}

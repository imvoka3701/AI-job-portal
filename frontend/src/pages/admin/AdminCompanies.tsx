import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCompanies, approveCompany, rejectCompany, type CompanySummary } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, Badge, Input, Skeleton } from "@/components/ui";
import { Shield } from "lucide-react";
import { AdminTabNavigation } from "./components/AdminTabNavigation";

export function AdminCompanies() {
  const user = useUser();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  const fetch = () => {
    let c = false;
    setLoading(true); setError(null);
    getCompanies({
      keyword: keyword || undefined,
      is_active: statusFilter ? statusFilter === "active" : undefined,
    }).then((d) => { if (!c) { setCompanies(d); setLoading(false); } })
      .catch(() => { if (!c) { setError("Không thể tải danh sách."); setLoading(false); } });
    return () => { c = true; };
  };

  useEffect(() => {
    if (!user && tokenStorage.get()) { useAuthStore.getState().fetchMe().catch(() => {}); return; }
    if (!user) { setLoading(false); return; }
    return fetch();
  }, [user, keyword, statusFilter]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    try { await approveCompany(id); setCompanies((p) => p.map((c) => c.id === id ? { ...c, is_active: true } : c)); setActionMsg("Đã duyệt tài khoản."); }
    catch (e) { setActionMsg(getApiErrorMessage(e)); }
    finally { setActionId(null); }
    setTimeout(() => setActionMsg(null), 3000);
  };
  const handleReject = async (id: number) => {
    setActionId(id);
    try { await rejectCompany(id); setCompanies((p) => p.map((c) => c.id === id ? { ...c, is_active: false } : c)); setActionMsg("Đã từ chối tài khoản."); }
    catch (e) { setActionMsg(getApiErrorMessage(e)); }
    finally { setActionId(null); }
    setTimeout(() => setActionMsg(null), 3000);
  };

  if (!user) return <GuestPage><Link to="/login"><Button>Đăng nhập</Button></Link></GuestPage>;
  if (user.role !== "admin") return <GuestPage><h1 className="text-2xl font-semibold text-gray-900">Không có quyền truy cập</h1></GuestPage>;

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
          <h1 className="text-3xl font-semibold text-gray-900">Quản lý công ty</h1>
          <p className="text-sm text-gray-500 mt-1">Duyệt và quản lý tài khoản nhà tuyển dụng</p>
        </div>

        {/* Tab Navigation */}
        <AdminTabNavigation />

        {actionMsg && <div className="rounded-lg bg-primary-light border border-primary/20 p-3 text-sm text-primary-dark">{actionMsg}</div>}

        <div className="flex flex-wrap gap-2">
          <div className="min-w-64 flex-1">
            <Input
              aria-label="Tìm kiếm công ty"
              placeholder="Tên công ty, người đại diện hoặc email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setKeyword(searchInput.trim());
              }}
            />
          </div>
          <select
            aria-label="Lọc trạng thái công ty"
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
          <Button size="md" onClick={() => setKeyword(searchInput.trim())}>Tìm</Button>
        </div>

        {loading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><div className="p-4 flex justify-between"><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-60" /></div><Skeleton className="h-8 w-20 rounded-lg" /></div></Card>)}</div>}

        {!loading && error && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}<Button className="ml-3" size="sm" variant="secondary" onClick={fetch}>Thử lại</Button></div>}

        {!loading && !error && companies.length === 0 && (
          <Card><div className="py-8 text-center"><p className="text-sm font-medium text-gray-700">Chưa có tài khoản nhà tuyển dụng nào.</p></div></Card>
        )}

        {!loading && !error && companies.length > 0 && (
          <div className="space-y-3">
            {companies.map((c) => (
              <Card key={c.id}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{c.company_name ?? c.full_name}</h3>
                      <Badge variant={c.is_active ? "success" : "default"} size="sm" dot>{c.is_active ? "Đang hoạt động" : "Đã khóa"}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{c.full_name} — {c.email}</p>
                    {c.company_description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.company_description}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">Đăng ký: {new Date(c.created_at).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!c.is_active && <Button variant="primary" size="sm" isLoading={actionId === c.id} onClick={() => handleApprove(c.id)}>Duyệt</Button>}
                    {c.is_active && <Button variant="destructive" size="sm" isLoading={actionId === c.id} onClick={() => handleReject(c.id)}>Khóa</Button>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GuestPage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-page-bg px-4 py-10"><div className="max-w-6xl mx-auto"><Card className="p-8 text-center">{children}</Card></div></div>;
}

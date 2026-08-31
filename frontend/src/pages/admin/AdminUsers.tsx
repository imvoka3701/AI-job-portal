import { useCallback, useEffect, useState } from "react";
import { getAdminUsers, toggleUserStatus, type AdminUserItem } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Input, Skeleton } from "@/components/ui";
import { Shield, Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminTabNavigation } from "./components/AdminTabNavigation";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { motion } from "framer-motion";

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

  const fetch = useCallback(() => {
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
  }, [keyword, roleFilter, statusFilter, page]);

  useEffect(() => {
    if (!user && tokenStorage.get()) { useAuthStore.getState().fetchMe().catch(() => {}); return; }
    if (!user) { setLoading(false); return; }
    return fetch();
  }, [user, fetch]);

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
  const roleBadgeColor = (r: string) => r === "candidate" ? "bg-blue-50 border-blue-200 text-blue-700" : r === "employer" ? "bg-[#ECFDF5] border-emerald-200 text-[#00B86B]" : "bg-violet-50 border-violet-200 text-violet-700";
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <SEOMeta title="Quản lý Người dùng — Admin" description="Xem và quản lý toàn bộ người dùng" />
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Hero Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="absolute -top-16 -right-16 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Quản lý Người dùng</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Người dùng hệ thống</h1>
                <p className="text-slate-400 text-sm mt-1.5">Xem, tìm kiếm và quản lý toàn bộ tài khoản trên nền tảng</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-3xl font-extrabold text-white tabular-nums">{data.total}</p>
                <p className="text-slate-400 text-xs mt-0.5">Tổng người dùng</p>
              </div>
            </div>
          </div>

          <AdminTabNavigation />

          {/* Flash message */}
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-[#ECFDF5] border border-emerald-200 p-3.5 text-sm text-[#00995C] font-medium">
              {msg}
            </motion.div>
          )}

          {/* Filters */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap gap-2.5">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  aria-label="Tìm kiếm người dùng"
                  placeholder="Tên, email hoặc công ty..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); setKeyword(searchInput.trim()); } }}
                  className="pl-9"
                />
              </div>
              <select
                aria-label="Lọc vai trò"
                className="h-10 rounded-xl border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]"
                value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              >
                <option value="">Tất cả vai trò</option>
                <option value="candidate">Ứng viên</option>
                <option value="employer">Nhà tuyển dụng</option>
                <option value="admin">Admin</option>
              </select>
              <select
                aria-label="Lọc trạng thái"
                className="h-10 rounded-xl border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]"
                value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Đã khóa</option>
              </select>
              <button
                onClick={() => { setPage(1); setKeyword(searchInput.trim()); }}
                className="px-5 h-10 bg-[#00B86B] hover:bg-[#00995C] text-white text-sm font-bold rounded-xl transition-all shadow-xs"
              >
                Tìm kiếm
              </button>
            </div>
          </div>


          {/* Loading */}
          {loading && (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <Button className="ml-3" size="sm" variant="secondary" onClick={fetch}>Thử lại</Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && data.items.length === 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl py-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Không tìm thấy người dùng nào.</p>
            </div>
          )}

          {/* User list */}
          {!loading && !error && data.items.length > 0 && (
            <>
              <div className="space-y-2">
                {data.items.map((u, idx) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Avatar initials */}
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-extrabold ${
                          u.role === "candidate" ? "bg-blue-100 text-blue-700" : u.role === "employer" ? "bg-[#ECFDF5] text-[#00B86B]" : "bg-violet-100 text-violet-700"
                        }`}>
                          {getInitials(u.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">{u.full_name}</h3>
                            <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${roleBadgeColor(u.role)}`}>
                              {roleLabel(u.role)}
                            </span>
                            <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${
                              u.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                            }`}>
                              {u.is_active ? "• Hoạt động" : "✕ Đã khóa"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{u.email}{u.company_name ? ` — ${u.company_name}` : ""}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Đăng ký: {new Date(u.created_at).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {u.id === user.id ? (
                          <span className="text-[11px] font-bold text-[#00B86B] bg-[#ECFDF5] border border-emerald-200 rounded-xl px-3 py-2">✓ Đang đăng nhập</span>
                        ) : (
                          <button
                            disabled={actionId === u.id}
                            onClick={() => handleToggle(u.id, u.is_active, u.full_name)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all disabled:opacity-50 ${
                              u.is_active
                                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border-emerald-200 bg-[#ECFDF5] text-[#00B86B] hover:bg-emerald-100"
                            }`}
                          >
                            {actionId === u.id ? "⋯" : u.is_active ? "Khóa" : "Mở khóa"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5">
                <span className="text-xs text-slate-500 font-medium">
                  <span className="font-bold text-slate-900">{data.total}</span> người dùng &mdash; Trang <span className="font-bold text-slate-900">{page}</span> / {Math.ceil(data.total / 20) || 1}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page * 20 >= data.total}
                    onClick={() => setPage(p => p + 1)}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function GuestPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-sm">
        <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 text-sm">{children}</p>
      </div>
    </div>
  );
}

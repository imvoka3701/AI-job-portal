import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminUsers,
  toggleUserStatus,
  type AdminUserItem,
} from "@/lib/api/admin";
import { getApiErrorMessage, tokenStorage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { Button, Input, Skeleton, EmptyState } from "@/components/ui";
import {
  Shield,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  Building2,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { AdminPagination } from "./components/AdminPagination";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { motion } from "framer-motion";

export function AdminUsers() {
  const user = useUser();
  const [data, setData] = useState<{ items: AdminUserItem[]; total: number }>({
    items: [],
    total: 0,
  });
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
    let c = false;
    setLoading(true);
    setError(null);
    getAdminUsers({
      keyword: keyword || undefined,
      role: roleFilter || undefined,
      is_active: statusFilter ? statusFilter === "active" : undefined,
      page,
      page_size: 20,
    })
      .then((d) => {
        if (!c) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!c) {
          setError("Không thể tải danh sách người dùng.");
          setLoading(false);
        }
      });
    return () => {
      c = true;
    };
  }, [keyword, roleFilter, statusFilter, page]);

  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    return fetch();
  }, [user, fetch]);

  const handleToggle = async (
    userId: number,
    currentActive: boolean,
    name: string
  ) => {
    const newState = !currentActive;
    setActionId(userId);
    try {
      await toggleUserStatus(userId, newState);
      setData((p) => ({
        ...p,
        items: p.items.map((u) =>
          u.id === userId ? { ...u, is_active: newState } : u
        ),
      }));
      setMsg(
        `${newState ? "Đã mở khóa hoạt động cho" : "Đã tạm khóa tài khoản của"} "${name}".`
      );
    } catch (e) {
      setMsg(getApiErrorMessage(e));
    } finally {
      setActionId(null);
    }
    setTimeout(() => setMsg(null), 3000);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm max-w-sm w-full">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Yêu cầu quyền Quản trị viên</h1>
          <p className="mt-2 text-sm text-slate-600">
            Bạn cần đăng nhập bằng tài khoản Admin để truy cập trang này.
          </p>
          <Link to="/login" className="mt-5 inline-block">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  const roleLabel = (r: string) =>
    r === "candidate"
      ? "Ứng viên"
      : r === "employer"
      ? "Nhà tuyển dụng"
      : "Quản trị viên (Admin)";

  const roleBadgeStyle = (r: string) =>
    r === "candidate"
      ? "bg-blue-50 border-blue-200 text-blue-800"
      : r === "employer"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-purple-50 border-purple-200 text-purple-800";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      <SEOMeta
        title="Quản trị Người dùng | Admin Console"
        description="Tra cứu, phân quyền vai trò và quản lý trạng thái kích hoạt tài khoản trên nền tảng"
      />

      <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
        {/* ── Page Header (Enterprise Standard) ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
                Quản trị Danh tính & Tài khoản
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">
                {data.total} tài khoản trong hệ thống
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Người Dùng Toàn Hệ Thống
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Tra cứu danh tính người dùng, kiểm soát trạng thái khóa/mở và phân quyền vai trò
            </p>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Tổng tài khoản:</span>
              <span className="font-mono font-bold text-slate-900">{data.total}</span>
            </div>

            <button
              onClick={fetch}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#00B86B]" : ""}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Flash Message */}
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-[#00B86B] flex-shrink-0" />
            <span>{msg}</span>
          </motion.div>
        )}

        {/* ── Filters Toolbar ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                aria-label="Tìm kiếm người dùng"
                placeholder="Tìm theo họ tên, email hoặc tên doanh nghiệp liên kết..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setKeyword(searchInput.trim());
                  }
                }}
                className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs h-10 focus:bg-white focus:ring-[#00B86B]/30 focus:border-[#00B86B]"
              />
            </div>

            <select
              aria-label="Lọc vai trò"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-xs px-3.5 text-slate-700 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#00B86B]/30 focus:border-[#00B86B]"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="candidate">Ứng viên</option>
              <option value="employer">Nhà tuyển dụng</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>

            <select
              aria-label="Lọc trạng thái"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-xs px-3.5 text-slate-700 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#00B86B]/30 focus:border-[#00B86B]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã bị khóa</option>
            </select>

            <button
              onClick={() => {
                setPage(1);
                setKeyword(searchInput.trim());
              }}
              className="px-5 h-10 bg-[#00B86B] hover:bg-[#00995C] text-white text-xs font-bold rounded-xl transition-all shadow-xs shadow-[#00B86B]/20"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <Skeleton className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48 bg-slate-100" />
                    <Skeleton className="h-3 w-36 bg-slate-100" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* ── Error Banner ── */}
        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-800 flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetch}>
              Thử lại
            </Button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && data.items.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-xs">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <EmptyState
              title="Không tìm thấy người dùng"
              description="Không có tài khoản người dùng nào khớp với bộ lọc hiện tại."
              className="border-none bg-transparent"
            />
          </div>
        )}

        {/* ── Dense Data Table (Enterprise Grid) ── */}
        {!loading && !error && data.items.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold">
                      <th className="py-3.5 px-4">Người dùng</th>
                      <th className="py-3.5 px-4">Email & Doanh nghiệp</th>
                      <th className="py-3.5 px-4">Vai trò hệ thống</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4">Ngày đăng ký</th>
                      <th className="py-3.5 px-4 text-right">Điều hành</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {data.items.map((u) => {
                      const isCurrentUser = u.id === user.id;
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* User Name & Initials */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-700 flex-shrink-0">
                                {getInitials(u.full_name)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[180px] sm:max-w-[240px]">
                                  {u.full_name}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ID: #{u.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email & Company */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[200px]">{u.email}</span>
                            </div>
                            {u.company_name && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{u.company_name}</span>
                              </div>
                            )}
                          </td>

                          {/* Role Badge */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${roleBadgeStyle(
                                u.role
                              )}`}
                            >
                              {u.role === "admin" && <Shield className="w-3 h-3" />}
                              {u.role === "employer" && <Building2 className="w-3 h-3" />}
                              {u.role === "candidate" && <UserCheck className="w-3 h-3" />}
                              {roleLabel(u.role).toUpperCase()}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                                u.is_active
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                  : "bg-rose-50 border-rose-200 text-rose-800"
                              }`}
                            >
                              {u.is_active ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  HOẠT ĐỘNG
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  ĐÃ KHÓA
                                </>
                              )}
                            </span>
                          </td>

                          {/* Created Date */}
                          <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(u.created_at).toLocaleDateString("vi-VN")}</span>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-4 text-right">
                            {isCurrentUser ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#00995C] bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Bạn (Hiện tại)
                              </span>
                            ) : (
                              <button
                                disabled={actionId === u.id}
                                onClick={() => handleToggle(u.id, u.is_active, u.full_name)}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all disabled:opacity-50 ${
                                  u.is_active
                                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                {actionId === u.id
                                  ? "⋯"
                                  : u.is_active
                                  ? "Khóa tài khoản"
                                  : "Mở khóa"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <AdminPagination
                page={page}
                pageSize={20}
                total={data.total}
                unitName="tài khoản"
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

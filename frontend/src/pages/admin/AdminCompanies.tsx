import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCompanies, approveCompany, rejectCompany, verifyCompany, type CompanySummary } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Input, Skeleton } from "@/components/ui";
import { Shield, Building2, Search, CheckCircle2, XCircle, Mail, Calendar, BadgeCheck } from "lucide-react";
import { AdminTabNavigation } from "./components/AdminTabNavigation";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { motion } from "framer-motion";

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
  const [verifyActionId, setVerifyActionId] = useState<number | null>(null);

  const fetch = useCallback(() => {
    let c = false;
    setLoading(true); setError(null);
    getCompanies({
      keyword: keyword || undefined,
      is_active: statusFilter ? statusFilter === "active" : undefined,
    }).then((d) => { if (!c) { setCompanies(d); setLoading(false); } })
      .catch(() => { if (!c) { setError("Không thể tải danh sách."); setLoading(false); } });
    return () => { c = true; };
  }, [keyword, statusFilter]);

  useEffect(() => {
    if (!user && tokenStorage.get()) { useAuthStore.getState().fetchMe().catch(() => {}); return; }
    if (!user) { setLoading(false); return; }
    return fetch();
  }, [user, fetch]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      await approveCompany(id);
      setCompanies((p) => p.map((c) => c.id === id ? { ...c, is_active: true } : c));
      setActionMsg("✓ Đã duyệt tài khoản nhà tuyển dụng.");
    } catch (e) { setActionMsg(getApiErrorMessage(e)); }
    finally { setActionId(null); }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleReject = async (id: number, name: string) => {
    if (!confirm(`Khóa tài khoản "${name}"?`)) return;
    setActionId(id);
    try {
      await rejectCompany(id);
      setCompanies((p) => p.map((c) => c.id === id ? { ...c, is_active: false } : c));
      setActionMsg("Đã khóa tài khoản nhà tuyển dụng.");
    } catch (e) { setActionMsg(getApiErrorMessage(e)); }
    finally { setActionId(null); }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleToggleVerify = async (id: number, currentVerified: boolean) => {
    setVerifyActionId(id);
    try {
      const nextState = !currentVerified;
      await verifyCompany(id, nextState);
      setCompanies((p) => p.map((c) => (c.id === id ? { ...c, is_verified: nextState } : c)));
      setActionMsg(nextState ? "✓ Đã cấp huy hiệu xác thực doanh nghiệp." : "Đã gỡ huy hiệu xác thực doanh nghiệp.");
    } catch (e) {
      setActionMsg(getApiErrorMessage(e));
    } finally {
      setVerifyActionId(null);
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  if (!user) return <GuestPage><Link to="/login"><Button>Đăng nhập</Button></Link></GuestPage>;
  if (user.role !== "admin") return <GuestPage><p>Không có quyền truy cập.</p></GuestPage>;

  const pendingCount = companies.filter(c => !c.is_active).length;
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <SEOMeta title="Quản lý Công ty — Admin" description="Duyệt và quản lý tài khoản nhà tuyển dụng" />
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Hero Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="absolute -top-16 -right-16 w-60 h-60 bg-[#00B86B]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 bg-[#00B86B]/20 border border-[#00B86B]/30 rounded-lg flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-[#00B86B]" />
                  </div>
                  <span className="text-xs font-bold text-[#00B86B] uppercase tracking-widest">Quản lý Công ty</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Nhà tuyển dụng hệ thống</h1>
                <p className="text-slate-400 text-sm mt-1.5">Duyệt hồ sơ, phê duyệt và quản lý tài khoản doanh nghiệp</p>
              </div>
              <div className="flex gap-5 flex-shrink-0">
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-white tabular-nums">{companies.length}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Tổng công ty</p>
                </div>
                {pendingCount > 0 && (
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-amber-400 tabular-nums">{pendingCount}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Chờ duyệt</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AdminTabNavigation />

          {/* Flash message */}
          {actionMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-3.5 text-sm font-medium ${
                actionMsg.startsWith("✓")
                  ? "bg-[#ECFDF5] border-emerald-200 text-[#00995C]"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
              {actionMsg}
            </motion.div>
          )}

          {/* Filter bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap gap-2.5">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  aria-label="Tìm kiếm công ty"
                  placeholder="Tên công ty, người đại diện hoặc email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") setKeyword(searchInput.trim()); }}
                  className="pl-9"
                />
              </div>
              <select
                aria-label="Lọc trạng thái công ty"
                className="h-10 rounded-xl border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã khóa / Chờ duyệt</option>
              </select>
              <button
                onClick={() => setKeyword(searchInput.trim())}
                className="px-5 h-10 bg-[#00B86B] hover:bg-[#00995C] text-white text-sm font-bold rounded-xl transition-all shadow-xs"
              >
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-60" /></div>
                  </div>
                  <Skeleton className="h-8 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="secondary" onClick={fetch}>Thử lại</Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && companies.length === 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl py-16 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Chưa có tài khoản nhà tuyển dụng nào.</p>
            </div>
          )}

          {/* Company list */}
          {!loading && !error && companies.length > 0 && (
            <div className="space-y-2">
              {companies.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`bg-white border rounded-2xl p-4 hover:shadow-sm transition-all ${
                    !c.is_active ? "border-amber-200/80 bg-amber-50/30" : "border-slate-200/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Company avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] flex items-center justify-center text-sm font-extrabold text-[#00B86B] flex-shrink-0 border border-emerald-100">
                        {getInitials(c.company_name ?? c.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">{c.company_name ?? c.full_name}</h3>
                          <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${
                            c.is_active
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}>
                            {c.is_active ? "● Đang hoạt động" : "⏳ Chờ duyệt"}
                          </span>
                          {c.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 bg-blue-50 border-blue-200 text-blue-700">
                              <BadgeCheck className="w-3 h-3 text-blue-600" />
                              Đã xác thực
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5 bg-slate-50 border-slate-200 text-slate-500">
                              Chưa xác thực
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />{c.full_name} — {c.email}
                          </span>

                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />{new Date(c.created_at).toLocaleDateString("vi-VN")}
                          </span>

                          {c.tax_code && (
                            <span className="text-[11px] text-slate-600 font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              MST: {c.tax_code}
                            </span>
                          )}

                          {c.company_size && (
                            <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                              Quy mô: {c.company_size}
                            </span>
                          )}
                        </div>
                        {c.company_description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{c.company_description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        disabled={verifyActionId === c.id}
                        onClick={() => handleToggleVerify(c.id, Boolean(c.is_verified))}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all disabled:opacity-50 ${
                          c.is_verified
                            ? "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {verifyActionId === c.id ? "⋯" : c.is_verified ? "Gỡ xác thực" : "Cấp xác thực"}
                      </button>
                      {!c.is_active && (
                        <button
                          disabled={actionId === c.id}
                          onClick={() => handleApprove(c.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-[#ECFDF5] text-[#00B86B] hover:bg-emerald-100 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {actionId === c.id ? "⋯" : "Duyệt"}
                        </button>
                      )}
                      {c.is_active && (
                        <button
                          disabled={actionId === c.id}
                          onClick={() => handleReject(c.id, c.company_name ?? c.full_name)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {actionId === c.id ? "⋯" : "Khóa"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
        <div className="text-slate-600 text-sm">{children}</div>
      </div>
    </div>
  );
}


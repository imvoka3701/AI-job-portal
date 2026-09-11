import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCompanies,
  approveCompany,
  rejectCompany,
  verifyCompany,
  type CompanySummary,
} from "@/lib/api/admin";
import { getApiErrorMessage, tokenStorage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { Button, Input, Skeleton, EmptyState } from "@/components/ui";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  BadgeCheck,
  Globe,
  RefreshCw,
  X,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { motion, AnimatePresence } from "framer-motion";

export function AdminCompanies() {
  const user = useUser();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [verifyActionId, setVerifyActionId] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);

  const fetch = useCallback(() => {
    let c = false;
    setLoading(true);
    setError(null);
    getCompanies({
      keyword: keyword || undefined,
      is_active: statusFilter ? statusFilter === "active" : undefined,
    })
      .then((d) => {
        if (!c) {
          setCompanies(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!c) {
          setError("Không thể tải danh sách doanh nghiệp.");
          setLoading(false);
        }
      });
    return () => {
      c = true;
    };
  }, [keyword, statusFilter]);

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

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      await approveCompany(id);
      setCompanies((p) =>
        p.map((c) => (c.id === id ? { ...c, is_active: true } : c))
      );
      if (selectedCompany?.id === id) {
        setSelectedCompany((prev) => (prev ? { ...prev, is_active: true } : null));
      }
      setActionMsg("Đã phê duyệt và kích hoạt tài khoản doanh nghiệp.");
    } catch (e) {
      setActionMsg(getApiErrorMessage(e));
    } finally {
      setActionId(null);
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleReject = async (id: number, name: string) => {
    if (!confirm(`Khóa tài khoản "${name}"?`)) return;
    setActionId(id);
    try {
      await rejectCompany(id);
      setCompanies((p) =>
        p.map((c) => (c.id === id ? { ...c, is_active: false } : c))
      );
      if (selectedCompany?.id === id) {
        setSelectedCompany((prev) => (prev ? { ...prev, is_active: false } : null));
      }
      setActionMsg("Đã tạm khóa tài khoản doanh nghiệp.");
    } catch (e) {
      setActionMsg(getApiErrorMessage(e));
    } finally {
      setActionId(null);
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleToggleVerify = async (id: number, currentVerified: boolean) => {
    setVerifyActionId(id);
    try {
      const nextState = !currentVerified;
      await verifyCompany(id, nextState);
      setCompanies((p) =>
        p.map((c) => (c.id === id ? { ...c, is_verified: nextState } : c))
      );
      if (selectedCompany?.id === id) {
        setSelectedCompany((prev) =>
          prev ? { ...prev, is_verified: nextState } : null
        );
      }
      setActionMsg(
        nextState
          ? "Đã cấp huy hiệu Doanh nghiệp Xác thực."
          : "Đã gỡ bỏ huy hiệu xác thực của doanh nghiệp."
      );
    } catch (e) {
      setActionMsg(getApiErrorMessage(e));
    } finally {
      setVerifyActionId(null);
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-md max-w-sm w-full">
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

  const pendingCount = companies.filter((c) => !c.is_active).length;
  const verifiedCount = companies.filter((c) => c.is_verified).length;
  const activeCount = companies.filter((c) => c.is_active).length;

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
        title="Quản lý Doanh nghiệp & KYC | Admin Console"
        description="Phê duyệt hồ sơ pháp lý, thẩm định doanh nghiệp và kiểm soát tài khoản nhà tuyển dụng"
      />

      <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
        {/* ── Page Header (Enterprise Standard) ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-[#00995C] uppercase tracking-wider">
                Doanh nghiệp & Thẩm định KYC
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">
                {companies.length} đơn vị trong danh bạ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quản lý Nhà tuyển dụng Hệ thống
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Phê duyệt hồ sơ thành lập, xác thực mã số thuế và kiểm soát quyền đăng tuyển của doanh nghiệp
            </p>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00B86B]" />
              <span className="text-slate-500">Đang hoạt động:</span>
              <span className="font-mono font-bold text-slate-900">{activeCount}</span>
            </div>

            {pendingCount > 0 && (
              <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-amber-800 font-semibold">Chờ duyệt KYC:</span>
                <span className="font-mono font-bold text-amber-800">{pendingCount}</span>
              </div>
            )}

            <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
              <BadgeCheck className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-blue-800 font-semibold">Đã xác thực:</span>
              <span className="font-mono font-bold text-blue-800">{verifiedCount}</span>
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

        {/* Flash Message Banner */}
        {actionMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-4 text-xs font-semibold flex items-center gap-2.5 ${
              actionMsg.includes("phê duyệt") || actionMsg.includes("cấp huy hiệu")
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#00B86B] flex-shrink-0" />
            <span>{actionMsg}</span>
          </motion.div>
        )}

        {/* ── Filter & Search Toolbar ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                aria-label="Tìm kiếm công ty"
                placeholder="Tìm theo tên doanh nghiệp, người đại diện, MST hoặc email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setKeyword(searchInput.trim());
                }}
                className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs h-10 focus:bg-white focus:ring-[#00B86B]/30 focus:border-[#00B86B]"
              />
            </div>

            <select
              aria-label="Lọc trạng thái công ty"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-xs px-3.5 text-slate-700 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#00B86B]/30 focus:border-[#00B86B]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa / Chờ duyệt</option>
            </select>

            <button
              onClick={() => setKeyword(searchInput.trim())}
              className="px-5 h-10 bg-[#00B86B] hover:bg-[#00995C] text-white text-xs font-bold rounded-xl transition-all shadow-xs shadow-[#00B86B]/20"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <Skeleton className="w-12 h-12 rounded-xl bg-slate-100" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48 bg-slate-100" />
                    <Skeleton className="h-3 w-64 bg-slate-100" />
                  </div>
                </div>
                <Skeleton className="h-9 w-28 bg-slate-100 rounded-xl" />
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
        {!loading && !error && companies.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-xs">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <EmptyState
              title="Không tìm thấy doanh nghiệp phù hợp"
              description="Không có tài khoản nhà tuyển dụng nào khớp với điều kiện lọc hiện tại."
              className="border-none bg-transparent"
            />
          </div>
        )}

        {/* ── Dense Data Table (Enterprise SaaS Grid) ── */}
        {!loading && !error && companies.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold">
                    <th className="py-3.5 px-4">Doanh nghiệp</th>
                    <th className="py-3.5 px-4">Đại diện & Liên hệ</th>
                    <th className="py-3.5 px-4">Mã số thuế & Quy mô</th>
                    <th className="py-3.5 px-4">Trạng thái & Tín nhiệm</th>
                    <th className="py-3.5 px-4">Ngày tạo</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {companies.map((c) => {
                    const isPending = !c.is_active;
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50/70 transition-colors group cursor-pointer ${
                          isPending ? "bg-amber-50/30" : ""
                        }`}
                        onClick={() => setSelectedCompany(c)}
                      >
                        {/* Company Name & Avatar */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xs font-black text-[#00995C] flex-shrink-0">
                              {getInitials(c.company_name ?? c.full_name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-[#00995C] transition-colors truncate max-w-[200px] sm:max-w-[260px]">
                                {c.company_name ?? c.full_name}
                              </div>
                              {c.website ? (
                                <a
                                  href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 mt-0.5"
                                >
                                  <Globe className="w-3 h-3 text-slate-400" />
                                  <span className="truncate max-w-[180px]">{c.website.replace(/^https?:\/\//, "")}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400">Chưa cập nhật website</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Person & Email */}
                        <td className="py-4 px-4">
                          <div className="text-slate-900 font-medium truncate">{c.full_name}</div>
                          <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[180px]">{c.email}</span>
                          </div>
                        </td>

                        {/* Tax Code & Size */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {c.tax_code ? (
                              <span className="font-mono text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                {c.tax_code}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Chưa có MST</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {c.company_size ? `Quy mô: ${c.company_size}` : "Chưa khai báo quy mô"}
                          </div>
                        </td>

                        {/* Status Badges (100% SVG Icons) */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                                c.is_active
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                  : "bg-amber-50 border-amber-200 text-amber-800"
                              }`}
                            >
                              {c.is_active ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  HOẠT ĐỘNG
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  CHỜ DUYỆT
                                </>
                              )}
                            </span>

                            {c.is_verified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-800">
                                <BadgeCheck className="w-3 h-3 text-blue-600" />
                                XÁC THỰC
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-slate-100 border border-slate-200 text-slate-600">
                                CHƯA XÁC THỰC
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{new Date(c.created_at).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Verify Button */}
                            <button
                              disabled={verifyActionId === c.id}
                              onClick={() => handleToggleVerify(c.id, Boolean(c.is_verified))}
                              className={`p-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 ${
                                c.is_verified
                                  ? "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                  : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              }`}
                              title={c.is_verified ? "Gỡ xác thực" : "Cấp xác thực"}
                            >
                              <BadgeCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* Approve Button */}
                            {!c.is_active && (
                              <button
                                disabled={actionId === c.id}
                                onClick={() => handleApprove(c.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Duyệt</span>
                              </button>
                            )}

                            {/* Lock/Reject Button */}
                            {c.is_active && (
                              <button
                                disabled={actionId === c.id}
                                onClick={() => handleReject(c.id, c.company_name ?? c.full_name)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-all disabled:opacity-50"
                                title="Tạm khóa tài khoản"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Slide-over Company Profile Drawer ── */}
        <AnimatePresence>
          {selectedCompany && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCompany(null)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="relative w-full max-w-lg bg-white border-l border-slate-200 h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between z-10"
              >
                <div className="space-y-6">
                  {/* Drawer Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-base font-black text-[#00995C]">
                        {getInitials(selectedCompany.company_name ?? selectedCompany.full_name)}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {selectedCompany.company_name ?? selectedCompany.full_name}
                        </h2>
                        <span className="text-xs font-mono text-slate-400">
                          ID: #{selectedCompany.id}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCompany(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-mono text-xs font-bold border ${
                        selectedCompany.is_active
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      {selectedCompany.is_active ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {selectedCompany.is_active ? "ĐANG HOẠT ĐỘNG" : "CHỜ DUYỆT KYC"}
                    </span>

                    {selectedCompany.is_verified && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md font-mono text-xs font-bold bg-blue-50 border border-blue-200 text-blue-800">
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                        ĐÃ XÁC THỰC
                      </span>
                    )}
                  </div>

                  {/* Key Details Grid */}
                  <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Người đại diện:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{selectedCompany.full_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Email tài khoản:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{selectedCompany.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Mã số thuế:</span>
                      <p className="font-mono text-slate-900 mt-0.5">{selectedCompany.tax_code || "Chưa khai báo"}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Website doanh nghiệp:</span>
                      <p className="text-slate-900 mt-0.5">
                        {selectedCompany.website ? (
                          <a
                            href={selectedCompany.website.startsWith("http") ? selectedCompany.website : `https://${selectedCompany.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#00995C] hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>{selectedCompany.website}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          "Chưa khai báo"
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Quy mô nhân sự:</span>
                      <p className="text-slate-900 mt-0.5">{selectedCompany.company_size || "Chưa khai báo"}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Ngày đăng ký tham gia:</span>
                      <p className="text-slate-900 mt-0.5 font-mono">
                        {new Date(selectedCompany.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Company Description */}
                  {selectedCompany.company_description && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-mono font-bold uppercase text-slate-500">
                        Giới thiệu Doanh nghiệp
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        {selectedCompany.company_description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="pt-6 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={verifyActionId === selectedCompany.id}
                      onClick={() => handleToggleVerify(selectedCompany.id, Boolean(selectedCompany.is_verified))}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <BadgeCheck className="w-4 h-4 text-blue-600" />
                      <span>{selectedCompany.is_verified ? "Gỡ huy hiệu xác thực" : "Cấp huy hiệu xác thực"}</span>
                    </button>

                    {!selectedCompany.is_active ? (
                      <button
                        disabled={actionId === selectedCompany.id}
                        onClick={() => handleApprove(selectedCompany.id)}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-200 bg-[#00B86B] hover:bg-[#00995C] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Phê duyệt tài khoản</span>
                      </button>
                    ) : (
                      <button
                        disabled={actionId === selectedCompany.id}
                        onClick={() => handleReject(selectedCompany.id, selectedCompany.company_name ?? selectedCompany.full_name)}
                        className="py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Khóa tài khoản</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

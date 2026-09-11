import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminJobs,
  setAdminJobStatus,
  getAdminStats,
  type AdminJobItem,
} from "@/lib/api/admin";
import { getApiErrorMessage, tokenStorage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { Button, Input, Skeleton, EmptyState } from "@/components/ui";
import {
  Shield,
  Briefcase,
  Search,
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { AdminPagination } from "./components/AdminPagination";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { motion } from "framer-motion";

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  remote: "Từ xa (Remote)",
  internship: "Thực tập sinh",
  freelance: "Freelance",
};

export function AdminJobs() {
  const user = useUser();
  const [data, setData] = useState<{ items: AdminJobItem[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [totalActiveJobs, setTotalActiveJobs] = useState<number | null>(null);

  const fetch = useCallback(() => {
    let c = false;
    setLoading(true);
    setError(null);
    getAdminJobs({
      keyword: keyword || undefined,
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
          setError("Không thể tải danh sách tin tuyển dụng.");
          setLoading(false);
        }
      });
    return () => {
      c = true;
    };
  }, [keyword, statusFilter, page]);

  useEffect(() => {
    if (user?.role === "admin") {
      getAdminStats()
        .then((s) => setTotalActiveJobs(s.total_active_jobs))
        .catch(() => {});
    }
  }, [user]);

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

  const handleStatus = async (job: AdminJobItem) => {
    const nextActive = !job.is_active;
    if (!confirm(`${nextActive ? "Mở lại" : "Đóng"} tin tuyển dụng "${job.title}"?`))
      return;
    setActionId(job.id);
    try {
      const updated = await setAdminJobStatus(job.id, nextActive);
      setData((p) => ({
        ...p,
        items: p.items.map((item) => (item.id === job.id ? updated : item)),
      }));
      setMsg(`${nextActive ? "Đã mở lại" : "Đã đóng"} tin "${job.title}".`);
      setTotalActiveJobs((prev) =>
        prev !== null ? (nextActive ? prev + 1 : Math.max(0, prev - 1)) : null
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

  const activeCount =
    totalActiveJobs ?? data.items.filter((j) => j.is_active).length;
  const inactiveCount = Math.max(0, data.total - activeCount);

  return (
    <>
      <SEOMeta
        title="Kiểm duyệt Tin tuyển dụng | Admin Console"
        description="Giám sát tin đăng, phòng chống gian lận/spam và quản lý trạng thái tuyển dụng"
      />

      <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
        {/* ── Page Header (Enterprise Standard) ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
                Giám sát Vị trí Tuyển dụng
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">
                {data.total} tin trong cơ sở dữ liệu
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kiểm duyệt Tin Tuyển dụng Hệ thống
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Phê duyệt, đóng/mở và kiểm tra chất lượng mô tả công việc (JD) đăng tuyển từ các doanh nghiệp
            </p>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Tổng tin:</span>
              <span className="font-mono font-bold text-slate-900">{data.total}</span>
            </div>

            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00B86B]" />
              <span className="text-emerald-800 font-semibold">Đang mở:</span>
              <span className="font-mono font-bold text-[#00995C]">{activeCount}</span>
            </div>

            <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-600">Đã đóng:</span>
              <span className="font-mono font-bold text-slate-700">{inactiveCount}</span>
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

        {/* ── Filter Toolbar ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                aria-label="Tìm kiếm tin tuyển dụng"
                placeholder="Tìm theo tiêu đề công việc, công ty hoặc email NTD..."
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
              aria-label="Lọc trạng thái"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-xs px-3.5 text-slate-700 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#00B86B]/30 focus:border-[#00B86B]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang mở tuyển</option>
              <option value="inactive">Đã đóng tuyển</option>
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
                <div className="space-y-2">
                  <Skeleton className="h-4 w-60 bg-slate-100" />
                  <Skeleton className="h-3 w-40 bg-slate-100" />
                </div>
                <Skeleton className="h-9 w-24 bg-slate-100 rounded-xl" />
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
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <EmptyState
              title="Không tìm thấy tin tuyển dụng"
              description="Không có vị trí việc làm nào khớp với từ khóa hoặc bộ lọc của bạn."
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
                      <th className="py-3.5 px-4">Vị trí Tuyển dụng</th>
                      <th className="py-3.5 px-4">Doanh nghiệp</th>
                      <th className="py-3.5 px-4">Địa điểm & Cấp bậc</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4">Ngày đăng</th>
                      <th className="py-3.5 px-4 text-right">Điều hành</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {data.items.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Job Title & Type */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                              <Briefcase className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate max-w-[220px] sm:max-w-[280px]">
                                  {j.title}
                                </span>
                                <a
                                  href={`/jobs/${j.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Xem trang tin công khai"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                                  {JOB_TYPE_LABEL[j.job_type] ?? j.job_type}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ID: #{j.id}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-900 font-semibold truncate max-w-[180px]">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{j.company_name ?? "Chưa đặt tên công ty"}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                            {j.employer_email}
                          </div>
                        </td>

                        {/* Location & Experience */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{j.location || "Toàn quốc / Chưa rõ"}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Kinh nghiệm: {j.experience_level || "Không yêu cầu"}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                              j.is_active
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-slate-100 border-slate-200 text-slate-600"
                            }`}
                          >
                            {j.is_active ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ĐANG MỞ
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-slate-400" />
                                ĐÃ ĐÓNG
                              </>
                            )}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(j.created_at).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 text-right">
                          <button
                            disabled={actionId === j.id}
                            onClick={() => void handleStatus(j)}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all disabled:opacity-50 ${
                              j.is_active
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {actionId === j.id
                              ? "⋯"
                              : j.is_active
                              ? "Đóng tin"
                              : "Mở lại"}
                          </button>
                        </td>
                      </tr>
                    ))}
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
                unitName="tin tuyển dụng"
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

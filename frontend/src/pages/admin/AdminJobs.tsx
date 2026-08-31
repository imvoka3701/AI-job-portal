import { useCallback, useEffect, useState } from "react";
import { getAdminJobs, setAdminJobStatus, type AdminJobItem } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Input, Skeleton } from "@/components/ui";
import {
  Shield, Briefcase, Search, ChevronLeft, ChevronRight,
  Building2, MapPin, Clock, ExternalLink,
} from "lucide-react";
import { AdminTabNavigation } from "./components/AdminTabNavigation";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { motion } from "framer-motion";

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  remote: "Remote",
  internship: "Thực tập",
  freelance: "Freelance",
};

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
      setData((p) => ({ ...p, items: p.items.map((item) => item.id === job.id ? updated : item) }));
      setMsg(`${nextActive ? "Đã mở lại" : "Đã đóng"} tin "${job.title}".`);
    } catch (e) { setMsg(getApiErrorMessage(e)); }
    finally { setActionId(null); }
    setTimeout(() => setMsg(null), 3000);
  };

  if (!user) return <GuestPage>Vui lòng đăng nhập để truy cập.</GuestPage>;
  if (user.role !== "admin") return <GuestPage>Không có quyền truy cập.</GuestPage>;

  const activeCount = data.items.filter(j => j.is_active).length;

  return (
    <>
      <SEOMeta title="Quản lý Tin tuyển dụng — Admin" description="Xem và quản lý toàn bộ tin tuyển dụng" />
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Hero Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 bg-amber-500/20 border border-amber-400/30 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Quản lý Tin tuyển dụng</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Tin tuyển dụng hệ thống</h1>
                <p className="text-slate-400 text-sm mt-1.5">Giám sát, mở/đóng và phê duyệt toàn bộ tin đăng tuyển</p>
              </div>
              <div className="flex gap-5 flex-shrink-0">
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-white tabular-nums">{data.total}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Tổng tin</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-[#00B86B] tabular-nums">{activeCount}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Đang mở</p>
                </div>
              </div>
            </div>
          </div>

          <AdminTabNavigation />

          {/* Flash message */}
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#ECFDF5] border border-emerald-200 p-3.5 text-sm text-[#00995C] font-medium">
              {msg}
            </motion.div>
          )}

          {/* Filter bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap gap-2.5">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  aria-label="Tìm kiếm tin tuyển dụng"
                  placeholder="Tiêu đề, công ty hoặc email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); setKeyword(searchInput.trim()); } }}
                  className="pl-9"
                />
              </div>
              <select
                aria-label="Lọc trạng thái"
                className="h-10 rounded-xl border border-slate-200 bg-white text-sm px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]"
                value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang mở</option>
                <option value="inactive">Đã đóng</option>
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
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2"><Skeleton className="h-4 w-56" /><Skeleton className="h-3 w-36" /></div>
                    <Skeleton className="h-8 w-20 rounded-xl" />
                  </div>
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
          {!loading && !error && data.items.length === 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl py-16 text-center">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Không tìm thấy tin tuyển dụng nào.</p>
            </div>
          )}

          {/* Job list */}
          {!loading && !error && data.items.length > 0 && (
            <>
              <div className="space-y-2">
                {data.items.map((j, idx) => (
                  <motion.div
                    key={j.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs">{j.title}</h3>
                            <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${
                              j.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"
                            }`}>{j.is_active ? "● Đang mở" : "Đã đóng"}</span>
                            <span className="text-[10px] font-medium bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5">
                              {JOB_TYPE_LABEL[j.job_type] ?? j.job_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Building2 className="w-3 h-3" />{j.company_name ?? j.employer_email}
                            </span>
                            {j.location && <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3 h-3" />{j.location}</span>}
                            {j.created_at && <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{new Date(j.created_at).toLocaleDateString("vi-VN")}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={`/jobs/${j.id}`} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          disabled={actionId === j.id}
                          onClick={() => void handleStatus(j)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all disabled:opacity-50 ${
                            j.is_active
                              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border-emerald-200 bg-[#ECFDF5] text-[#00B86B] hover:bg-emerald-100"
                          }`}
                        >{actionId === j.id ? "⋯" : j.is_active ? "Đóng tin" : "Mở lại"}</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5">
                <span className="text-xs text-slate-500 font-medium">
                  <span className="font-bold text-slate-900">{data.total}</span> tin — Trang{" "}
                  <span className="font-bold text-slate-900">{page}</span> / {Math.ceil(data.total / 20) || 1}
                </span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                    <ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                    <ChevronRight className="w-4 h-4" /></button>
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


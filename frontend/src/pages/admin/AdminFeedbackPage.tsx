import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareHeart,
  Search,
  RefreshCw,
  Star,
  CheckCircle2,
  Clock,
  X,
  User,
  Building2,
  Globe,
  Sparkles,
  Bug,
  Lightbulb,
  ShieldAlert,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import {
  getAdminFeedbacks,
  getAdminFeedbackStats,
  updateAdminFeedback,
  type UserFeedback,
  type FeedbackStatsResponse,
  type FeedbackStatus,
  type FeedbackPriority,
  type FeedbackType,
} from "@/lib/api/feedback";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { EmptyState, Skeleton } from "@/components/ui";

const feedbackTypeConfig: Record<
  FeedbackType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  bug_report: { label: "Báo lỗi hệ thống", icon: Bug, color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
  feature_request: { label: "Đề xuất tính năng", icon: Lightbulb, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  ai_experience: { label: "Trải nghiệm AI", icon: Sparkles, color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  job_report: { label: "Khiếu nại tin đăng", icon: ShieldAlert, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  general: { label: "Góp ý chung", icon: MessageSquareHeart, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

const statusConfig: Record<
  FeedbackStatus,
  { label: string; bg: string; color: string; dot: string }
> = {
  new: { label: "Mới tiếp nhận", bg: "bg-amber-50 border-amber-200", color: "text-amber-800", dot: "bg-amber-500 animate-pulse" },
  in_progress: { label: "Đang xử lý", bg: "bg-blue-50 border-blue-200", color: "text-blue-800", dot: "bg-blue-500" },
  resolved: { label: "Đã giải quyết", bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-800", dot: "bg-[#00B86B]" },
  rejected: { label: "Đã từ chối/Đóng", bg: "bg-slate-100 border-slate-200", color: "text-slate-600", dot: "bg-slate-400" },
};

const priorityConfig: Record<
  FeedbackPriority,
  { label: string; bg: string; color: string }
> = {
  low: { label: "Thấp", bg: "bg-slate-50 border-slate-200", color: "text-slate-600" },
  medium: { label: "Trung bình", bg: "bg-blue-50 border-blue-200", color: "text-blue-700" },
  high: { label: "Cao", bg: "bg-amber-50 border-amber-200", color: "text-amber-700" },
  urgent: { label: "Khẩn cấp", bg: "bg-rose-50 border-rose-200", color: "text-rose-700" },
};

export function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Drawer detail state
  const [selectedItem, setSelectedItem] = useState<UserFeedback | null>(null);
  const [editStatus, setEditStatus] = useState<FeedbackStatus>("new");
  const [editPriority, setEditPriority] = useState<FeedbackPriority>("medium");
  const [editNotes, setEditNotes] = useState("");
  const [editResponse, setEditResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const s = await getAdminFeedbackStats();
      setStats(s);
    } catch (e) {
      console.error("Failed to load feedback stats:", e);
    }
  };

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminFeedbacks({
        user_role: selectedRole === "all" ? undefined : selectedRole,
        feedback_type: selectedType === "all" ? undefined : selectedType,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        priority: selectedPriority === "all" ? undefined : selectedPriority,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        page,
        page_size: 15,
      });
      setFeedbacks(res.items);
      setTotalPages(res.total_pages);
      setTotalCount(res.total);
    } catch (e) {
      console.error("Failed to fetch feedbacks:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, selectedType, selectedStatus, selectedPriority, searchQuery, page]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleOpenDrawer = (item: UserFeedback) => {
    setSelectedItem(item);
    setEditStatus(item.status);
    setEditPriority(item.priority);
    setEditNotes(item.admin_notes || "");
    setEditResponse(item.admin_response || "");
    setActionMsg(null);
  };

  const handleSaveResolution = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      const updated = await updateAdminFeedback(selectedItem.id, {
        status: editStatus,
        priority: editPriority,
        admin_notes: editNotes,
        admin_response: editResponse,
      });
      setSelectedItem(updated);
      setFeedbacks((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      fetchStats();
      setActionMsg("Đã cập nhật trạng thái phản hồi thành công!");
      setTimeout(() => setActionMsg(null), 3500);
    } catch (e) {
      console.error("Failed to update feedback:", e);
      setActionMsg("Có lỗi xảy ra khi lưu phản hồi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="Quản lý Phản hồi Người dùng | Admin Console"
        description="Lắng nghe, xử lý phản hồi, báo lỗi và khiếu nại từ Ứng viên, Doanh nghiệp và Khách vãng lai"
      />

      <div className="space-y-6 max-w-[1600px] mx-auto font-sans antialiased text-slate-900">
        {/* ── Page Header (Enterprise SaaS Standard) ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-[#00995C] uppercase tracking-wider">
                Trung tâm Chăm sóc & Lắng nghe Khách hàng
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">
                {totalCount} phản hồi tiếp nhận
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quản lý Phản hồi & Ý kiến Người dùng
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Theo dõi và giải quyết phản hồi từ Ứng viên, Nhà tuyển dụng và Khách truy cập toàn sàn
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                fetchStats();
                fetchFeedbacks();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#00B86B]" : ""}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* ── Telemetry Matrix (4 Cards) ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Tổng phản hồi</p>
                <p className="mt-2 text-3xl font-black text-slate-900 tabular-nums">
                  {stats?.total_feedbacks ?? 0}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-600">Từ tất cả các tệp người dùng</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Chờ tiếp nhận & xử lý</p>
                <p className="mt-2 text-3xl font-black text-amber-700 tabular-nums">
                  {stats?.pending_feedbacks ?? 0}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-600">Yêu cầu cần phản hồi sớm</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Đã xử lý & giải quyết</p>
                <p className="mt-2 text-3xl font-black text-[#00995C] tabular-nums">
                  {stats?.resolved_feedbacks ?? 0}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-600">Hài lòng & đã đóng việc</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00995C] shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Điểm hài lòng CSAT</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-3xl font-black text-slate-900 tabular-nums">
                    {stats?.avg_csat_rating ? stats.avg_csat_rating.toFixed(1) : "—"}
                  </p>
                  <span className="text-sm font-bold text-slate-600">/ 5.0</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i <= Math.round(stats?.avg_csat_rating || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="text-[11px] font-medium text-slate-600 ml-1">Đánh giá chung</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Multi-Persona Tabs Strip ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-xs flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "Tất cả phản hồi", icon: MessageSquareHeart, count: stats?.total_feedbacks },
            { id: "candidate", label: "Ứng viên tìm việc", icon: User, count: stats?.by_role?.candidate ?? 0 },
            { id: "employer", label: "Nhà tuyển dụng", icon: Building2, count: stats?.by_role?.employer ?? 0 },
            { id: "guest", label: "Khách vãng lai", icon: Globe, count: stats?.by_role?.guest ?? 0 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedRole === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedRole(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#00B86B] text-white shadow-xs shadow-[#00B86B]/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, nội dung, người gửi hoặc email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setSearchQuery(searchInput);
                  }
                }}
                className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30 focus:border-[#00B86B]"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="bug_report">Báo lỗi hệ thống</option>
              <option value="feature_request">Đề xuất tính năng</option>
              <option value="ai_experience">Trải nghiệm AI</option>
              <option value="job_report">Khiếu nại tin đăng</option>
              <option value="general">Góp ý chung</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="new">Mới tiếp nhận</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="rejected">Đã từ chối/Đóng</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">Mọi độ ưu tiên</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>

            <button
              onClick={() => {
                setPage(1);
                setSearchQuery(searchInput);
              }}
              className="px-5 h-10 bg-[#00B86B] hover:bg-[#00995C] text-white text-xs font-bold rounded-xl shadow-xs transition-all shadow-[#00B86B]/20"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* ── Dense Data Table ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48 bg-slate-100" />
                    <Skeleton className="h-3 w-80 bg-slate-100" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="py-16 text-center">
              <EmptyState
                title="Không có phản hồi nào"
                description="Không tìm thấy phản hồi nào phù hợp với bộ lọc hiện tại."
                className="border-none bg-transparent"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Người gửi & Tệp</th>
                    <th className="px-5 py-3.5">Phân loại & Đánh giá</th>
                    <th className="px-5 py-3.5">Tiêu đề & Nội dung</th>
                    <th className="px-5 py-3.5">Mức ưu tiên</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Thời gian</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {feedbacks.map((fb) => {
                    const typeCfg = feedbackTypeConfig[fb.feedback_type] || feedbackTypeConfig.general;
                    const TypeIcon = typeCfg.icon;
                    const stCfg = statusConfig[fb.status] || statusConfig.new;
                    const prCfg = priorityConfig[fb.priority] || priorityConfig.medium;

                    const roleBadge =
                      fb.user_role === "candidate"
                        ? { label: "Ứng viên", bg: "bg-blue-50 text-blue-800 border-blue-200" }
                        : fb.user_role === "employer"
                        ? { label: "Doanh nghiệp", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" }
                        : { label: "Khách", bg: "bg-slate-100 text-slate-700 border-slate-200" };

                    return (
                      <tr
                        key={fb.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDrawer(fb)}
                      >
                        {/* Người gửi */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 flex-shrink-0">
                              {fb.sender_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-[150px]">
                                {fb.sender_name}
                              </p>
                              <p className="text-slate-500 truncate max-w-[150px]">{fb.sender_email}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.bg}`}>
                                {roleBadge.label}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Phân loại & Rating */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${typeCfg.bg} ${typeCfg.color}`}
                            >
                              <TypeIcon className="w-3.5 h-3.5" />
                              <span>{typeCfg.label}</span>
                            </span>
                            {fb.rating && (
                              <div className="flex items-center gap-0.5 text-amber-500">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${s <= fb.rating! ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Tiêu đề & Nội dung */}
                        <td className="px-5 py-4 max-w-sm">
                          <p className="font-bold text-slate-900 line-clamp-1">{fb.title}</p>
                          <p className="text-slate-500 line-clamp-2 mt-0.5">{fb.content}</p>
                          {fb.admin_response && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#00995C]">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Đã có phản hồi từ Admin</span>
                            </div>
                          )}
                        </td>

                        {/* Mức ưu tiên */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-bold ${prCfg.bg} ${prCfg.color}`}
                          >
                            {prCfg.label}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${stCfg.bg} ${stCfg.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dot}`} />
                            <span>{stCfg.label}</span>
                          </span>
                        </td>

                        {/* Thời gian */}
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(fb.created_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>

                        {/* Thao tác */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(fb);
                            }}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors shadow-xs"
                          >
                            Xử lý
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Trang {page} / {totalPages} (Tổng {totalCount} phản hồi)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Slide-over Resolution Drawer ── */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              />

              <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="w-screen max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between"
                >
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-[#00995C] uppercase">
                          Chi Tiết Phản Hồi #{selectedItem.id}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900">{selectedItem.title}</h2>
                    </div>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {actionMsg && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#00B86B]" />
                        <span>{actionMsg}</span>
                      </div>
                    )}

                    {/* Sender profile card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-slate-700">Thông tin người gửi:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Họ tên:</span>{" "}
                          <span className="font-bold text-slate-900">{selectedItem.sender_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Vai trò:</span>{" "}
                          <span className="font-bold text-slate-900 uppercase">{selectedItem.user_role}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Email:</span>{" "}
                          <span className="font-bold text-slate-900">{selectedItem.sender_email}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Thời gian gửi:</span>{" "}
                          <span className="font-mono text-slate-700">
                            {new Date(selectedItem.created_at).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Full content */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700">Nội dung phản hồi:</p>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-900 whitespace-pre-wrap">
                        {selectedItem.content}
                      </div>
                    </div>

                    {/* Target entity info */}
                    {selectedItem.target_id && (
                      <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <span className="text-amber-800 font-bold">Đối tượng liên quan:</span>{" "}
                          <span className="font-mono text-slate-800">
                            {selectedItem.target_type} #{selectedItem.target_id}
                          </span>
                        </div>
                        {selectedItem.target_type === "job" && (
                          <a
                            href={`/jobs/${selectedItem.target_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#00995C] hover:underline"
                          >
                            Xem tin tuyển dụng ↗
                          </a>
                        )}
                      </div>
                    )}

                    {/* Resolution Form */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#00995C]" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase">
                          Cập nhật Xử lý & Phản hồi
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Trạng thái xử lý
                          </label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as FeedbackStatus)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                          >
                            <option value="new">Mới tiếp nhận</option>
                            <option value="in_progress">Đang xử lý</option>
                            <option value="resolved">Đã giải quyết</option>
                            <option value="rejected">Từ chối / Đóng</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Mức độ ưu tiên
                          </label>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as FeedbackPriority)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                          >
                            <option value="low">Thấp</option>
                            <option value="medium">Trung bình</option>
                            <option value="high">Cao</option>
                            <option value="urgent">Khẩn cấp</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Ghi chú nội bộ Admin (Private Note)
                        </label>
                        <textarea
                          rows={2}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Ghi chú kỹ thuật hoặc phân công nhân sự giải quyết..."
                          className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Phản hồi giải pháp gửi người dùng (Official Resolution)
                        </label>
                        <textarea
                          rows={3}
                          value={editResponse}
                          onChange={(e) => setEditResponse(e.target.value)}
                          placeholder="Nhập nội dung giải đáp, cảm ơn hoặc thông báo đã sửa lỗi..."
                          className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveResolution}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#00B86B] hover:bg-[#00995C] shadow-xs shadow-[#00B86B]/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{saving ? "Đang lưu..." : "Lưu cập nhật"}</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

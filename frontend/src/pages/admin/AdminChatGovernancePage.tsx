/**
 * Admin Chat Governance Dashboard (Zero-Knowledge Privacy).
 *
 * Operational Command Center for monitoring direct B2B conversations,
 * triage safety violation reports, and intervention controls (Lock/Unlock/Dismiss).
 *
 * Privacy Invariant:
 * Under NO circumstances is chat message content displayed or requested.
 * Only operational metadata, throughput, flags, and participant telemetry.
 */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Info,
  Lock,
  MessagesSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlock,
  User,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPagination } from "./components/AdminPagination";
import {
  type AdminChatStats,
  type AdminConversationItem,
  dismissAdminConversationReport,
  getAdminChatStats,
  listAdminConversations,
  lockAdminConversation,
} from "@/lib/api/chat";

type FilterTab = "all" | "reported" | "locked" | "normal";

const PRESET_LOCK_REASONS = [
  "Nghi vấn lừa đảo / Yêu cầu đặt cọc phí tuyển dụng",
  "Hành vi quấy rối / Sử dụng ngôn từ xúc phạm nghiêm trọng",
  "Gửi liên kết độc hại / Lừa đảo chiếm đoạt thông tin (Phishing)",
  "Gạ gẫm chuyển dịch công việc ngoài phạm vi nền tảng",
  "Khác (Nhập lý do cụ thể bên dưới)",
];

export default function AdminChatGovernancePage() {
  // Stats state
  const [stats, setStats] = useState<AdminChatStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Conversations state
  const [conversations, setConversations] = useState<AdminConversationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination state
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [selectedConv, setSelectedConv] = useState<AdminConversationItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Lock Dialog state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [targetLockConv, setTargetLockConv] = useState<AdminConversationItem | null>(null);
  const [lockPresetReason, setLockPresetReason] = useState(PRESET_LOCK_REASONS[0]);
  const [customLockNote, setCustomLockNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Dismiss Report Dialog state
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [targetDismissConv, setTargetDismissConv] = useState<AdminConversationItem | null>(null);

  // Copied indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch telemetry stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await getAdminChatStats();
      setStats(data);
    } catch {
      toast.error("Không thể tải chỉ số giám sát chat.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let is_reported: boolean | undefined = undefined;
      let is_locked: boolean | undefined = undefined;

      if (activeTab === "reported") {
        is_reported = true;
      } else if (activeTab === "locked") {
        is_locked = true;
      } else if (activeTab === "normal") {
        is_reported = false;
        is_locked = false;
      }

      const res = await listAdminConversations({
        is_reported,
        is_locked,
        search: searchQuery.trim() || undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      });

      setConversations(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách hội thoại";
      setError(msg);
      toast.error("Không thể tải danh sách kênh chat.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page, pageSize]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle Lock / Unlock
  const handleToggleLockSubmit = async () => {
    if (!targetLockConv) return;
    try {
      setActionLoading(true);
      const willLock = !targetLockConv.is_locked;
      const finalReason = willLock
        ? lockPresetReason === "Khác (Nhập lý do cụ thể bên dưới)"
          ? customLockNote.trim() || "Admin can thiệp bảo mật"
          : `${lockPresetReason}${customLockNote ? ` - ${customLockNote}` : ""}`
        : "Admin mở khóa sau thẩm định an toàn";

      await lockAdminConversation(targetLockConv.id, willLock, finalReason);
      toast.success(
        willLock
          ? `Đã khóa kênh chat #CONV-${targetLockConv.id} thành công`
          : `Đã mở khóa kênh chat #CONV-${targetLockConv.id}`
      );
      setIsLockModalOpen(false);
      setTargetLockConv(null);
      setCustomLockNote("");
      // Refresh list & stats
      fetchConversations();
      fetchStats();
    } catch {
      toast.error("Không thể thay đổi trạng thái khóa phòng chat.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Dismiss Report
  const handleDismissReportSubmit = async () => {
    if (!targetDismissConv) return;
    try {
      setActionLoading(true);
      await dismissAdminConversationReport(targetDismissConv.id);
      toast.success(`Đã hủy cờ vi phạm kênh #CONV-${targetDismissConv.id}`);
      setIsDismissModalOpen(false);
      setTargetDismissConv(null);
      // Refresh
      fetchConversations();
      fetchStats();
    } catch {
      toast.error("Lỗi khi hủy cờ báo cáo vi phạm.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return "Chưa có tin nhắn";
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans antialiased text-slate-900">
      {/* Page Title & Operational Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#00995C] shadow-xs">
              <MessagesSquare className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Giám Sát Hội Thoại Trực Tiếp (B2B Chat Governance)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Điều hành an toàn luồng giao tiếp Doanh nghiệp &mdash; Ứng viên theo chuẩn Zero-Knowledge Privacy.
              </p>
            </div>
          </div>
        </div>

          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchConversations();
            }}
            disabled={loading || statsLoading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || statsLoading ? "animate-spin text-emerald-600" : ""}`} />
            Làm mới dữ liệu
          </button>
        </div>

        {/* Zero-Knowledge Privacy Guarantee Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                Cam Kết Bảo Mật Quyền Riêng Tư Tuyệt Đối (Zero-Knowledge Privacy)
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 tracking-wider">
                  Enterprise Standard
                </span>
              </h2>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Mọi nội dung tin nhắn và tệp đính kèm được bảo mật hoàn toàn giữa Ứng viên & Nhà tuyển dụng.
                Hệ thống <strong>không lưu trữ và không cho phép Admin đọc nội dung tin nhắn</strong>.
                Bảng điều khiển này chỉ giám sát các trường dữ liệu thông số kỹ thuật (ID kênh, tần suất trao đổi, cờ báo cáo vi phạm, và trạng thái khóa an toàn).
              </p>
            </div>
          </div>
        </div>

        {/* Operational KPI Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng kênh Chat</span>
              <MessagesSquare className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {statsLoading ? "..." : stats?.total_conversations?.toLocaleString() ?? "0"}
              </span>
              <span className="block text-[11px] text-slate-400 font-medium mt-0.5">Kênh hội thoại B2B</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng tin nhắn</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {statsLoading ? "..." : stats?.total_messages?.toLocaleString() ?? "0"}
              </span>
              <span className="block text-[11px] text-slate-400 font-medium mt-0.5">Tin đã trao đổi</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hoạt động hôm nay</span>
              <Zap className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {statsLoading ? "..." : stats?.active_conversations_today?.toLocaleString() ?? "0"}
              </span>
              <span className="block text-[11px] text-slate-400 font-medium mt-0.5">Kênh có tin mới trong ngày</span>
            </div>
          </div>

          {/* Card 4 - Urgent Flagged */}
          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-rose-50/40">
            <div className="flex items-center justify-between text-rose-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Cần xử lý vi phạm</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600">
                  {statsLoading ? "..." : stats?.reported_conversations?.toLocaleString() ?? "0"}
                </span>
                {(stats?.reported_conversations ?? 0) > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                    Cấp thiết
                  </span>
                )}
              </div>
              <span className="block text-[11px] text-rose-600/80 font-medium mt-0.5">Khiếu nại chưa đóng</span>
            </div>
          </div>

          {/* Card 5 - Locked */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Đã khóa can thiệp</span>
              <Lock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-amber-600">
                {statsLoading ? "..." : stats?.locked_conversations?.toLocaleString() ?? "0"}
              </span>
              <span className="block text-[11px] text-slate-400 font-medium mt-0.5">Kênh bị tạm dừng</span>
            </div>
          </div>
        </div>

        {/* Operational Control Toolbar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: "all", label: "Tất cả kênh" },
                {
                  id: "reported",
                  label: "Cần xử lý vi phạm",
                  badge: stats?.reported_conversations,
                  badgeColor: "bg-rose-500 text-white",
                },
                {
                  id: "locked",
                  label: "Đang bị khóa",
                  badge: stats?.locked_conversations,
                  badgeColor: "bg-amber-500 text-white",
                },
                { id: "normal", label: "Bình thường" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as FilterTab);
                    setPage(1);
                  }}
                  className={`
                    px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer
                    ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    }
                  `}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm Mã kênh, Ứng viên, NTD, Job..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9.5 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/60 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dense Governance Data Grid */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Kênh & Ref ID</th>
                  <th className="py-3 px-4">Ứng viên</th>
                  <th className="py-3 px-4">Doanh nghiệp / NTD</th>
                  <th className="py-3 px-4">Vị trí ứng tuyển</th>
                  <th className="py-3 px-4 text-center">Lưu lượng tin</th>
                  <th className="py-3 px-4">Lần chat cuối</th>
                  <th className="py-3 px-4">Trạng thái an toàn</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {/* Loading Skeleton */}
                {loading && (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-4">
                          <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-200 rounded-full"></div>
                            <div className="space-y-1">
                              <div className="h-3 w-28 bg-slate-200 rounded-md"></div>
                              <div className="h-2.5 w-36 bg-slate-100 rounded-md"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-3 w-32 bg-slate-200 rounded-md"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-3 w-24 bg-slate-200 rounded-md"></div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="h-3 w-8 bg-slate-200 rounded-md mx-auto"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-3 w-24 bg-slate-200 rounded-md"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-7 w-16 bg-slate-200 rounded-lg ml-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Error State */}
                {!loading && error && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-rose-600">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                      <p className="font-bold text-sm">Không thể tải danh sách kênh hội thoại</p>
                      <p className="text-xs text-slate-500 mt-1">{error}</p>
                      <button
                        type="button"
                        onClick={fetchConversations}
                        className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                      >
                        Thử lại
                      </button>
                    </td>
                  </tr>
                )}

                {/* Empty State */}
                {!loading && !error && conversations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Không có hội thoại vi phạm nào</h3>
                        <p className="text-xs text-slate-500">
                          {activeTab === "reported"
                            ? "Hiện không có bất kỳ báo cáo khiếu nại vi phạm nào đang chờ xử lý."
                            : activeTab === "locked"
                            ? "Hiện không có phòng chat nào đang bị khóa can thiệp."
                            : searchQuery
                            ? `Không tìm thấy kết quả phù hợp với từ khóa "${searchQuery}".`
                            : "Chưa có dữ liệu kênh hội thoại nào được ghi nhận."}
                        </p>
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                          >
                            Xóa bộ lọc tìm kiếm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Ideal Data Rows */}
                {!loading &&
                  !error &&
                  conversations.map((c) => {
                    const isReported = c.is_reported;
                    const isLocked = c.is_locked;

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isReported ? "bg-rose-50/20" : isLocked ? "bg-amber-50/20" : ""
                        }`}
                      >
                        {/* Channel ID */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs">#CONV-{c.id}</span>
                            <button
                              type="button"
                              title="Sao chép ID kênh"
                              onClick={() => copyToClipboard(String(c.id), `id-${c.id}`)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              {copiedKey === `id-${c.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            App #{c.application_id} &bull; Job #{c.job_id}
                          </span>
                        </td>

                        {/* Candidate */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden border border-slate-300">
                              {c.candidate_name ? c.candidate_name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-[140px]">
                                {c.candidate_name || "Ứng viên ẩn danh"}
                              </p>
                              {c.candidate_email && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">
                                  {c.candidate_email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Company / Recruiter */}
                        <td className="py-3 px-4">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[150px] flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{c.company_name || "Doanh nghiệp"}</span>
                            </p>
                            {c.employer_name && (
                              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                NTD: {c.employer_name}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Job Title */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 truncate max-w-[160px] text-xs" title={c.job_title || ""}>
                            {c.job_title || "Vị trí tuyển dụng"}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">Job ID: #{c.job_id}</span>
                        </td>

                        {/* Message Count */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                            {c.message_count} tin
                          </span>
                        </td>

                        {/* Last Message At */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {formatDate(c.last_message_at)}
                        </td>

                        {/* Safety Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {isReported ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                                <span>Bị báo cáo vi phạm</span>
                              </div>
                            ) : isLocked ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Lock className="w-3 h-3 text-amber-700" />
                                <span>Đã khóa can thiệp</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Bình thường</span>
                              </div>
                            )}

                            {/* Report Reason Snippet */}
                            {isReported && c.report_reason && (
                              <p
                                className="text-[10px] text-rose-700 font-medium italic truncate max-w-[150px]"
                                title={c.report_reason}
                              >
                                &ldquo;{c.report_reason}&rdquo;
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* View Detail Drawer */}
                            <button
                              type="button"
                              title="Xem chi tiết kỹ thuật"
                              onClick={() => {
                                setSelectedConv(c);
                                setIsDetailDrawerOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Dismiss Report Button (if reported) */}
                            {isReported && (
                              <button
                                type="button"
                                title="Hủy bỏ cờ vi phạm sau thẩm định"
                                onClick={() => {
                                  setTargetDismissConv(c);
                                  setIsDismissModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Gỡ cờ</span>
                              </button>
                            )}

                            {/* Lock / Unlock Toggle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTargetLockConv(c);
                                setIsLockModalOpen(true);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                isLocked
                                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                                  : "bg-slate-900 hover:bg-slate-800 text-white"
                              }`}
                            >
                              {isLocked ? (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Mở khóa</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Khóa kênh</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-100">
            <AdminPagination
              page={page}
              pageSize={pageSize}
              total={total}
              unitName="kênh hội thoại"
              onPageChange={(newPage) => setPage(newPage)}
              disabled={loading}
            />
          </div>
        </div>

      {/* ── Modal: Intervention Lock / Unlock Confirmation ─────────────────── */}
      <AnimatePresence>
        {isLockModalOpen && targetLockConv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !actionLoading && setIsLockModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 z-10 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      targetLockConv.is_locked ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {targetLockConv.is_locked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {targetLockConv.is_locked ? "Xác nhận mở khóa phòng chat" : "Xác nhận can thiệp khóa phòng chat"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Kênh #CONV-{targetLockConv.id} &bull; Ứng viên: {targetLockConv.candidate_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setIsLockModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600">
                {!targetLockConv.is_locked ? (
                  <>
                    <p className="leading-relaxed">
                      Khi khóa kênh, cả Ứng viên và Nhà tuyển dụng sẽ <strong>không thể gửi thêm tin nhắn</strong>.
                      Hành động can thiệp này sẽ được ghi vào <strong>Admin Audit Log</strong> bất biến.
                    </p>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">Lý do khóa kênh (Phân loại vi phạm):</label>
                      <select
                        value={lockPresetReason}
                        onChange={(e) => setLockPresetReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:border-slate-500 focus:outline-hidden"
                      >
                        {PRESET_LOCK_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">Ghi chú bổ sung (Tùy chọn):</label>
                      <textarea
                        rows={3}
                        value={customLockNote}
                        onChange={(e) => setCustomLockNote(e.target.value)}
                        placeholder="Nhập chi tiết biên bản vi phạm hoặc dẫn chứng phục vụ kiểm toán..."
                        className="w-full p-3 rounded-xl border border-slate-300 font-medium text-xs focus:border-slate-500 focus:outline-hidden"
                      />
                    </div>
                  </>
                ) : (
                  <p className="leading-relaxed">
                    Bạn có chắc chắn muốn mở lại quyền trò chuyện cho kênh #CONV-{targetLockConv.id}?
                    Sau khi mở khóa, hai bên có thể tiếp tục trao đổi công việc bình thường.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setIsLockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleToggleLockSubmit}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                    targetLockConv.is_locked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  } disabled:opacity-50`}
                >
                  {actionLoading
                    ? "Đang lưu..."
                    : targetLockConv.is_locked
                    ? "Xác nhận mở khóa"
                    : "Khóa phòng chat ngay"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Dismiss Violation Report ───────────────────────────────── */}
      <AnimatePresence>
        {isDismissModalOpen && targetDismissConv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !actionLoading && setIsDismissModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 z-10 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Gỡ cờ báo cáo vi phạm</h3>
                    <p className="text-xs text-slate-500 font-mono">Kênh #CONV-{targetDismissConv.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setIsDismissModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  Bạn xác nhận rằng kênh hội thoại này <strong>không vi phạm tiêu chuẩn an toàn cộng đồng</strong> và
                  muốn gỡ bỏ cờ cảnh báo màu đỏ?
                </p>
                {targetDismissConv.report_reason && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px]">Nội dung khiếu nại trước đó:</span>
                    <p className="italic text-slate-600">&ldquo;{targetDismissConv.report_reason}&rdquo;</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setIsDismissModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDismissReportSubmit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Đang xử lý..." : "Xác nhận gỡ cờ"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Slide-over Drawer: Technical Governance Metadata Inspection ───── */}
      <AnimatePresence>
        {isDetailDrawerOpen && selectedConv && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Hồ sơ kỹ thuật kênh
                    </span>
                    <h2 className="text-lg font-black text-slate-900 font-mono">#CONV-{selectedConv.id}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDetailDrawerOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
                  {/* Privacy reminder inside drawer */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      Hồ sơ này chỉ cung cấp các chỉ số Metadata và định danh đối tác. Nội dung tin nhắn không bao giờ hiển thị.
                    </p>
                  </div>

                  {/* Channel Metadata Grid */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Thông số kênh</h4>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Mã kênh:</span>
                        <span className="font-bold text-slate-900">#{selectedConv.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Application ID:</span>
                        <span className="font-bold text-slate-900">#{selectedConv.application_id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Job ID:</span>
                        <span className="font-bold text-slate-900">#{selectedConv.job_id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Tổng tin nhắn:</span>
                        <span className="font-bold text-slate-900">{selectedConv.message_count} tin</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Thời điểm tạo:</span>
                        <span className="text-[11px] text-slate-700">{formatDate(selectedConv.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Tương tác cuối:</span>
                        <span className="text-[11px] text-slate-700">{formatDate(selectedConv.last_message_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Participants Section */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Bên tham gia hội thoại</h4>

                    {/* Candidate */}
                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600">Ứng viên (Candidate)</span>
                        <span className="text-[10px] font-mono text-slate-400">ID: #{selectedConv.candidate_id}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{selectedConv.candidate_name || "Chưa cập nhật"}</p>
                      {selectedConv.candidate_email && (
                        <p className="text-slate-500 font-mono text-[11px]">{selectedConv.candidate_email}</p>
                      )}
                    </div>

                    {/* Employer */}
                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-cyan-600">Doanh nghiệp (Employer)</span>
                        <span className="text-[10px] font-mono text-slate-400">Company ID: #{selectedConv.company_id}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{selectedConv.company_name || "Chưa cập nhật"}</p>
                      {selectedConv.employer_name && (
                        <p className="text-slate-500 text-[11px]">Người phụ trách: {selectedConv.employer_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Trust & Safety Status Section */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Tình trạng kiểm duyệt</h4>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Cờ báo cáo vi phạm:</span>
                        {selectedConv.is_reported ? (
                          <span className="font-bold text-rose-600">Có báo cáo</span>
                        ) : (
                          <span className="font-bold text-emerald-600">Không có</span>
                        )}
                      </div>
                      {selectedConv.is_reported && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                          <p className="font-bold text-[11px]">Nội dung khiếu nại:</p>
                          <p className="italic">{selectedConv.report_reason || "Không ghi rõ"}</p>
                          {selectedConv.reported_by_name && (
                            <p className="text-[10px] text-rose-700 pt-1 border-t border-rose-200/60">
                              Người gửi báo cáo: {selectedConv.reported_by_name} ({formatDate(selectedConv.reported_at)})
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="font-medium text-slate-600">Trạng thái khóa:</span>
                        {selectedConv.is_locked ? (
                          <span className="font-bold text-amber-600">Đang bị khóa</span>
                        ) : (
                          <span className="font-bold text-emerald-600">Đang hoạt động</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      setTargetLockConv(selectedConv);
                      setIsLockModalOpen(true);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                      selectedConv.is_locked ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    {selectedConv.is_locked ? "Mở khóa kênh này" : "Khóa kênh này"}
                  </button>
                  {selectedConv.is_reported && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailDrawerOpen(false);
                        setTargetDismissConv(selectedConv);
                        setIsDismissModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs"
                    >
                      Gỡ cờ
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

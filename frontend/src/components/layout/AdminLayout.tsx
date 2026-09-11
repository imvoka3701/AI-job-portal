import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  ShieldAlert,
  CalendarCheck,
  History,
  BrainCircuit,
  TerminalSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  LogOut,
  Sparkles,
  ExternalLink,
  MessageSquareHeart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useAuthStore } from "@/stores/authStore";
import { getFileUrl } from "@/lib/utils";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { getAdminFeedbackStats } from "@/lib/api/feedback";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "VẬN HÀNH CỐT LÕI",
    items: [
      { label: "Tổng quan điều hành", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Doanh nghiệp & KYC", href: "/admin/companies", icon: Building2 },
      { label: "Tin tuyển dụng", href: "/admin/jobs", icon: Briefcase },
      { label: "Người dùng hệ thống", href: "/admin/users", icon: Users },
    ],
  },
  {
    title: "GIÁM SÁT & TUÂN THỦ",
    items: [
      { label: "Phản hồi Người dùng", href: "/admin/feedback", icon: MessageSquareHeart },
      { label: "Giám sát Chat (Zero-Knowledge)", href: "/admin/chat", icon: ShieldAlert },
      { label: "Phiên Phỏng vấn AI", href: "/admin/interviews", icon: CalendarCheck },
      { label: "Nhật ký Kiểm toán", href: "/admin/audit-logs", icon: History },
    ],
  },
  {
    title: "HẠ TẦNG & AI ENGINE",
    items: [
      { label: "AI System Prompts", href: "/admin/ai/prompts", icon: BrainCircuit },
      { label: "AI Logs & Chi phí Token", href: "/admin/ai/logs", icon: TerminalSquare },
    ],
  },
];

const routeTitleMap: Record<string, { title: string; subtitle: string }> = {
  "/admin/dashboard": {
    title: "Trung tâm Điều hành Hệ thống",
    subtitle: "Giám sát thời gian thực, lưu lượng người dùng, cảnh báo và sức khỏe hệ thống",
  },
  "/admin/companies": {
    title: "Quản lý Doanh nghiệp & KYC",
    subtitle: "Phê duyệt hồ sơ pháp lý, thẩm định doanh nghiệp và kiểm soát trạng thái hoạt động",
  },
  "/admin/jobs": {
    title: "Kiểm duyệt Tin tuyển dụng",
    subtitle: "Giám sát tin đăng, phòng chống gian lận/spam và quản lý trạng thái tuyển dụng",
  },
  "/admin/users": {
    title: "Quản trị Tài khoản Người dùng",
    subtitle: "Tra cứu, phân quyền vai trò và quản lý trạng thái kích hoạt tài khoản",
  },
  "/admin/feedback": {
    title: "Quản lý Phản hồi & Ý kiến Người dùng",
    subtitle: "Tiếp nhận, phân loại và giải quyết ý kiến đóng góp, báo lỗi từ các tệp người dùng",
  },
  "/admin/chat": {
    title: "Giám sát Hội thoại Trực tiếp (Zero-Knowledge)",
    subtitle: "Phát hiện vi phạm, bảo vệ an toàn liên lạc với nguyên tắc bảo mật quyền riêng tư",
  },
  "/admin/interviews": {
    title: "Giám sát Phỏng vấn AI & Scorecard",
    subtitle: "Theo dõi các phiên phỏng vấn thử nghiệm, ma trận điểm số và phân tích phản hồi AI",
  },
  "/admin/audit-logs": {
    title: "Nhật ký Kiểm toán Hệ thống (Audit Logs)",
    subtitle: "Lưu vết toàn bộ thao tác quản trị, thay đổi trạng thái và dấu vết bảo mật",
  },
  "/admin/ai/prompts": {
    title: "Quản lý AI Prompts & Kịch bản Nghiệp vụ",
    subtitle: "Hiệu chỉnh Prompt Templates, biến môi trường và hướng dẫn cho AI Copilot",
  },
  "/admin/ai/logs": {
    title: "AI Call Logs & Phân tích Chi phí Token",
    subtitle: "Kiểm soát độ trễ, lưu lượng token DeepSeek và chi phí vận hành AI",
  },
};

export function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const [pendingFeedbacks, setPendingFeedbacks] = useState<number>(0);

  const user = useUser();
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const navigate = useNavigate();

  // Poll / refresh pending feedback count on route change
  useEffect(() => {
    if (user?.role === "admin") {
      getAdminFeedbackStats()
        .then((res) => {
          setPendingFeedbacks(res.pending_feedbacks ?? 0);
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch (error) {
        console.warn("Không thể lưu trạng thái sidebar:", error);
      }
      return next;
    });
  };

  // Shortcut Ctrl + K for quick navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setQuickSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setQuickSearchOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userAvatarSrc = getFileUrl(user?.avatar_url);

  // Dynamic nav sections with live badges
  const navSectionsWithBadges = navSections.map((sec) => ({
    ...sec,
    items: sec.items.map((item) => {
      if (item.href === "/admin/feedback" && pendingFeedbacks > 0) {
        return {
          ...item,
          badge: pendingFeedbacks > 99 ? "99+" : String(pendingFeedbacks),
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        };
      }
      return item;
    }),
  }));

  // Filter items for quick search
  const allNavItems = navSectionsWithBadges.flatMap((s) => s.items);
  const filteredQuickNav = quickSearchQuery.trim()
    ? allNavItems.filter((item) =>
        item.label.toLowerCase().includes(quickSearchQuery.toLowerCase()) ||
        item.href.toLowerCase().includes(quickSearchQuery.toLowerCase())
      )
    : allNavItems;

  const currentMeta = routeTitleMap[location.pathname] || {
    title: "Khu vực Quản trị Hệ thống",
    subtitle: "Bảng điều khiển vận hành trung tâm AI Job Portal",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#00B86B] selection:text-white antialiased">
      <SEOMeta
        title={`${currentMeta.title} | Admin Command Center`}
        description={currentMeta.subtitle}
      />

      {/* ── Quick Command Modal (Ctrl + K) ── */}
      <AnimatePresence>
        {quickSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickSearchOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Nhập tên phân hệ cần nhảy tới (Dashboard, Công ty, Chat...)..."
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-md">
                  ESC
                </kbd>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase px-3 py-1.5 tracking-wider">
                  Phân hệ quản trị nhanh
                </div>
                {filteredQuickNav.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    Không tìm thấy phân hệ nào khớp với từ khóa.
                  </div>
                ) : (
                  filteredQuickNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          navigate(item.href);
                          setQuickSearchOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-[#00995C] font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${isActive ? "bg-[#00B86B] text-white" : "bg-slate-100 text-slate-500"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border tabular-nums ${item.badgeColor || "bg-amber-100 text-amber-800 border-amber-200"}`}>
                              {item.badge}
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-400">{item.href}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Dùng phím mũi tên hoặc click chuột để điều hướng</span>
                <span className="font-mono text-[11px]">AI Job Portal Console v2.5</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex min-h-screen relative">
        {/* ── Mobile Sidebar Overlay ── */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar (Enterprise Drawer) ── */}
        <aside
          className={`
            fixed top-0 bottom-0 left-0 z-40 lg:sticky lg:top-0 lg:h-screen
            bg-white border-r border-slate-200/90 shadow-xs flex flex-col justify-between
            transition-all duration-200 ease-in-out
            ${isCollapsed ? "w-[72px]" : "w-64"}
            ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Header Brand */}
          <div>
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
              <Link to="/admin/dashboard" className="flex items-center gap-3 min-w-0 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00995C] via-[#00B86B] to-[#34D399] flex items-center justify-center shadow-md shadow-[#00B86B]/20 flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black tracking-tight text-slate-900 truncate">
                      AI JOB PORTAL
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#00995C] uppercase">
                      COMMAND CENTER
                    </span>
                  </div>
                )}
              </Link>

              {/* Close Mobile */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 lg:hidden"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Command Trigger in Sidebar */}
            {!isCollapsed && (
              <div className="px-3 pt-3">
                <button
                  onClick={() => setQuickSearchOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    <span>Tìm nhanh phân hệ...</span>
                  </div>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-md">
                    ⌘K
                  </kbd>
                </button>
              </div>
            )}

            {/* Navigation Sections */}
            <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-190px)]" aria-label="Điều hướng chính">
              {navSectionsWithBadges.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={`
                          group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative
                          ${
                            isActive
                              ? "bg-emerald-50 text-[#00995C] border border-emerald-200/80 shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                          }
                          ${isCollapsed ? "justify-center px-0" : ""}
                        `}
                      >
                        <div
                          className={`
                            p-1.5 rounded-lg transition-colors flex-shrink-0
                            ${isActive ? "bg-[#00B86B] text-white shadow-xs shadow-[#00B86B]/30" : "text-slate-500 group-hover:text-slate-700 group-hover:bg-slate-100"}
                          `}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {!isCollapsed && (
                          <>
                            <span className="truncate flex-1">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border tabular-nums ${
                                  item.badgeColor || "bg-amber-100 text-amber-800 border-amber-200"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Active indicator dot when collapsed */}
                        {isCollapsed && (
                          <>
                            {isActive && (
                              <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-[#00B86B]" />
                            )}
                            {item.badge && !isActive && (
                              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          {/* Footer: User profile & Collapse toggle */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/60">
            {!isCollapsed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 px-2 py-1">
                  {userAvatarSrc ? (
                    <img
                      src={userAvatarSrc}
                      alt={user?.full_name || "Admin"}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xs font-bold text-[#00995C]">
                      {user?.full_name?.charAt(0) || "A"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || "Quản trị viên"}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B]" />
                      <span className="text-[10px] font-mono text-slate-500 truncate">Super Admin</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                  <span className="font-mono">v2.5 Enterprise</span>
                  <button
                    onClick={toggleCollapsed}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Thu gọn</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleCollapsed}
                  title="Mở rộng sidebar"
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Work Area ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
          {/* ── Sticky Topbar ── */}
          <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-xs">
            {/* Left: Mobile trigger & Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
                aria-label="Mở menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                <Link to="/admin/dashboard" className="hover:text-slate-900 transition-colors hidden sm:inline">
                  Admin Console
                </Link>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <span className="font-bold text-slate-900 truncate">
                  {currentMeta.title}
                </span>
              </div>
            </div>

            {/* Right: Telemetry Pulse, Quick Actions & Public Link */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* System Heartbeat Indicators */}
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono">
                <div className="flex items-center gap-1.5" title="PostgreSQL Database Online">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-700 font-semibold">DB</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5" title="pgvector Cosine Search Active">
                  <span className="w-2 h-2 rounded-full bg-[#00B86B]" />
                  <span className="text-slate-700 font-semibold">pgvector</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5" title="AI Copilot Gateway Ready">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-slate-700 font-semibold">AI Mesh</span>
                </div>
              </div>

              {/* View Public Portal */}
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors"
                title="Mở cổng tuyển dụng công cộng"
              >
                <span className="hidden sm:inline">Xem Sàn việc làm</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </header>

          {/* ── Main Canvas ── */}
          <main className="flex-1 w-full p-4 sm:p-6 lg:p-8" id="admin-main-canvas">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

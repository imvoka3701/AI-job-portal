import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  Bell,
  Search,
  Menu,
  LogOut,
  Settings,
  UserCog,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { useAuthStore, useUser } from "@/stores/authStore";
import { getInitials, getFileUrl, cn } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { EmployerCompanyProvider, useEmployerCompany } from "@/contexts/EmployerCompanyContext";

const NAV_ITEMS = [
  { label: "Tổng quan", href: "/employer/dashboard", icon: LayoutDashboard, permission: "analytics:view" },
  { label: "Quản lý tin đăng", href: "/employer/jobs", icon: Briefcase, permission: "job:view" },
  { label: "Ứng viên (Pipeline)", href: "/employer/candidates", icon: Users, permission: "application:view" },
  { label: "Tìm kiếm nhân tài AI", href: "/employer/talent-search", icon: Sparkles, permission: "application:view", badge: "AI RAG" },
  { label: "Lịch phỏng vấn", href: "/employer/interviews", icon: Calendar, permission: "application:view" },
  { label: "Nhu cầu tuyển dụng", href: "/employer/recruitment-requests", icon: ClipboardList, permission: "recruitment_request:view" },
  { label: "Đội ngũ & phân quyền", href: "/employer/team", icon: UserCog, permission: "team:view" },
  { label: "Cài đặt doanh nghiệp", href: "/employer/settings", icon: Settings },
];

function EmployerLayoutContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("employer_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const user = useUser();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { data: companyContext, hasPermission } = useEmployerCompany();

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("employer_sidebar_collapsed", String(next));
      } catch (error) {
        console.warn("Không thể lưu trạng thái sidebar vào localStorage:", error);
      }
      return next;
    });
  };

  // Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>("input[placeholder*='Tìm kiếm ứng viên']");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userAvatarSrc = getFileUrl(user?.avatar_url);

  return (
    <div className="min-h-screen bg-slate-50/60 flex font-sans">
      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isSidebarOpen ? 0 : 0 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0",
          isCollapsed ? "lg:w-20 w-64" : "lg:w-64 w-64",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className={cn("h-16 flex items-center border-b border-gray-100 px-6", isCollapsed && "lg:px-0 lg:justify-center")}>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-bold text-sm">JP</span>
            </div>
            <span className={cn("font-bold text-gray-900 tracking-tight text-lg transition-all", isCollapsed && "lg:hidden")}>
              Employer Hub
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className={cn("text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2", isCollapsed && "lg:hidden")}>
            Quản lý tuyển dụng
          </div>
          {NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isCollapsed && "lg:justify-center lg:px-0",
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className={cn("truncate", isCollapsed && "lg:hidden")}>{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xs shrink-0",
                        isCollapsed && "lg:hidden"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User / Bottom actions */}
        <div className="p-3 border-t border-gray-100">
          <div className={cn("flex items-center gap-3 mb-4 px-2", isCollapsed && "lg:justify-center lg:px-0")}>
            <div
              className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-primary/20"
              title={user?.email}
            >
              {userAvatarSrc ? (
                <img src={userAvatarSrc} alt={user?.company_name || "Company"} className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.company_name || user?.full_name || "?")
              )}
            </div>
            <div className={cn("flex-1 min-w-0", isCollapsed && "lg:hidden")}>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {companyContext?.company.name || user?.company_name || user?.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              {companyContext && (
                <Badge variant={companyContext.membership.is_owner ? "primary" : "default"} size="sm" className="mt-1">
                  {companyContext.membership.is_owner
                    ? "Owner · Nhân sự"
                    : companyContext.membership.member_role === "hr"
                      ? "Nhân sự"
                      : "Trưởng bộ phận"}
                </Badge>
              )}
            </div>
          </div>
          <div className={cn("flex items-center gap-2", isCollapsed && "lg:flex-col")}>
            <Link to="/employer/settings" className={cn("flex-1", isCollapsed && "lg:w-full")}>
              <Button
                variant="ghost"
                size="sm"
                className={cn("w-full justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100", isCollapsed && "lg:px-0")}
                title="Cài đặt doanh nghiệp"
              >
                <Settings className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
                <span className={cn(isCollapsed && "lg:hidden")}>Cài đặt</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-2 text-gray-400 hover:text-red-600 hover:bg-red-50", isCollapsed && "lg:w-full lg:justify-center")}
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng (Tối đa không gian làm việc)"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            
            {/* Interactive Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/employer/candidates?search=${encodeURIComponent(searchQuery.trim())}`);
                } else {
                  navigate(`/employer/candidates`);
                }
              }}
              className="relative hidden sm:flex items-center"
            >
              <Search className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm ứng viên, kỹ năng..."
                className="w-72 pl-9 pr-14 py-1.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
              <kbd className="absolute right-2.5 text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 font-sans font-medium text-gray-400 shadow-sm pointer-events-none">
                Ctrl K
              </kbd>
            </form>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission("job:manage") && (
              <Link to="/employer/jobs/new" className="hidden sm:block">
                <Button variant="outline" size="sm">Đăng tin mới</Button>
              </Link>
            )}
            <Link to="/employer/settings">
              <button className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors" title="Cài đặt">
                <Settings className="w-5 h-5" />
              </button>
            </Link>
            <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors" title="Thông báo">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full bg-slate-50/40">
          <div className="w-full max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function EmployerLayout() {
  return (
    <EmployerCompanyProvider>
      <EmployerLayoutContent />
    </EmployerCompanyProvider>
  );
}

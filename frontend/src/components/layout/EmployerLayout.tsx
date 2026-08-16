import { useState } from "react";
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
  { label: "Lịch phỏng vấn", href: "/employer/interviews", icon: Calendar, permission: "application:view" },
  { label: "Nhu cầu tuyển dụng", href: "/employer/recruitment-requests", icon: ClipboardList, permission: "recruitment_request:view" },
  { label: "Đội ngũ & phân quyền", href: "/employer/team", icon: UserCog, permission: "team:view" },
];

function EmployerLayoutContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = useUser();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { data: companyContext, hasPermission } = useEmployerCompany();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userAvatarSrc = getFileUrl(user?.avatar_url);

  return (
    <div className="min-h-screen bg-page-bg flex font-sans">
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
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">JP</span>
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">
              Employer Hub
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
            Quản lý tuyển dụng
          </div>
          {NAV_ITEMS.filter((item) => hasPermission(item.permission)).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
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
                      "w-5 h-5",
                      isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User / Bottom actions */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-primary/20">
              {userAvatarSrc ? (
                <img src={userAvatarSrc} alt={user?.company_name || "Company"} className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.company_name || user?.full_name || "?")
              )}
            </div>
            <div className="flex-1 min-w-0">
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="flex-1 justify-center text-gray-600">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </Button>
            <Button variant="ghost" size="sm" className="px-2 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={handleLogout} title="Đăng xuất">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Command Palette trigger (Fake for now) */}
            <div className="hidden sm:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-400 w-64 cursor-text hover:bg-white transition-colors">
              <Search className="w-4 h-4 mr-2 text-gray-400" />
              <span>Tìm kiếm ứng viên...</span>
              <kbd className="ml-auto hidden sm:inline-block text-[10px] bg-white border border-gray-200 rounded px-1.5 font-sans font-medium text-gray-500 shadow-sm">
                Ctrl K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission("job:manage") && (
              <Link to="/employer/jobs/new" className="hidden sm:block">
                <Button variant="outline" size="sm">Đăng tin mới</Button>
              </Link>
            )}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
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

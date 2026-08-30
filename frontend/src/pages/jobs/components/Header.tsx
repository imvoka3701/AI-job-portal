import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Compass,
  Briefcase,
  ChevronDown,
  Menu,
  X,
  Plus,
  Shield,
  History,
  Building2,
  Users
} from "lucide-react";
import { Button, NotificationBell } from "@/components/ui";
import { useUser, useAuthStore } from "@/stores/authStore";
import { getInitials, getFileUrl } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isB2B?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Việc làm", href: "/jobs" },
  { label: "Tạo CV", href: "/cv" },
  { label: "AI Matching", href: "/ai/matching", icon: Sparkles, badge: "AI" },
  { label: "Lộ trình Kỹ năng", href: "/ai/roadmap", icon: Compass, badge: "2026" },
  { label: "Công cụ", href: "/tools" },
  { label: "Nhà tuyển dụng", href: "/employer", isB2B: true },
];

export function Header() {
  const location = useLocation();
  const user = useUser();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userAvatarSrc = getFileUrl(user?.avatar_url);

  // Get user dashboard link based on role
  const dashboardLink =
    user?.role === "employer"
      ? "/employer/dashboard"
      : user?.role === "admin"
      ? "/admin/dashboard"
      : "/dashboard";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 h-[68px] flex items-center shadow-2xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
        
        {/* ── LEFT: Logo & Main Navigation ────────────────────────────── */}
        <div className="flex items-center gap-6 xl:gap-8 min-w-0">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group transition-transform hover:scale-105">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00B86B] to-emerald-700 flex items-center justify-center shadow-xs">
              <span className="text-white font-black text-sm select-none">JP</span>
            </div>
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
              AI Job Portal
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.href);
              const IconComp = item.icon;

              if (item.isB2B) {
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`
                      whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ml-1
                      ${
                        isActive
                          ? "bg-[#00B86B] text-white shadow-xs"
                          : "bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80"
                      }
                    `}
                  >
                    <Building2 className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-emerald-600"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`
                    whitespace-nowrap relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all
                    ${
                      isActive
                        ? "text-emerald-700 bg-emerald-50/90 font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }
                  `}
                >
                  {IconComp && (
                    <IconComp
                      className={`w-3.5 h-3.5 ${
                        isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"
                      }`}
                    />
                  )}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`
                        text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider
                        ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* ── RIGHT: User Actions & Auth ──────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          <NotificationBell />

          {user ? (
            <div className="flex items-center gap-2.5">
              
              {/* Quick CV / Post Job button for Desktop */}
              {user.role === "candidate" && (
                <Link to="/cv/new" className="hidden xl:inline-flex">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8.5 px-3 rounded-xl border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tạo CV</span>
                  </Button>
                </Link>
              )}

              {user.role === "employer" && (
                <Link to="/employer/jobs/new" className="hidden xl:inline-flex">
                  <Button
                    size="sm"
                    className="h-8.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Đăng tin</span>
                  </Button>
                </Link>
              )}

              {/* ── Interactive Profile Dropdown Popover ──────────────── */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-xs ring-1 ring-emerald-200">
                    {userAvatarSrc ? (
                      <img src={userAvatarSrc} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user.full_name)
                    )}
                  </div>
                  
                  <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[120px] truncate">
                    {user.full_name.split(" ")[0]}
                  </span>
                  
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Floating Menu Popover */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100"
                    >
                      {/* User Bio Header */}
                      <div className="p-4 bg-slate-50/80">
                        <p className="text-xs font-black text-slate-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                          {user.role === "candidate"
                            ? "Ứng viên"
                            : user.role === "employer"
                            ? "Nhà tuyển dụng"
                            : "Quản trị viên"}
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="p-1.5 space-y-0.5 text-xs font-semibold text-slate-700">
                        <Link
                          to={dashboardLink}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Bàn làm việc (Dashboard)</span>
                        </Link>

                        {user.role === "candidate" && (
                          <>
                            <Link
                              to="/cv"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                            >
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span>Hồ sơ CV của tôi</span>
                            </Link>

                            <Link
                              to="/ai/roadmap"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                            >
                              <Compass className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold text-emerald-800">Lộ trình Kỹ năng AI</span>
                            </Link>

                            <Link
                              to="/tools/assessments/history"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                            >
                              <History className="w-4 h-4 text-slate-400" />
                              <span>Lịch sử trắc nghiệm MBTI/MI</span>
                            </Link>
                          </>
                        )}

                        {user.role === "employer" && (
                          <>
                            <Link
                              to="/employer/jobs"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                            >
                              <Briefcase className="w-4 h-4 text-slate-400" />
                              <span>Quản lý tin tuyển dụng</span>
                            </Link>

                            <Link
                              to="/employer/team"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                            >
                              <Users className="w-4 h-4 text-slate-400" />
                              <span>Đội ngũ tuyển dụng</span>
                            </Link>
                          </>
                        )}

                        {user.role === "admin" && (
                          <Link
                            to="/admin/dashboard"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-slate-400" />
                            <span>Quản trị hệ thống</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout Action */}
                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          ) : (
            /* Guest Buttons */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors px-3 py-2"
              >
                Đăng nhập
              </Link>
              <Link to="/register">
                <Button className="bg-[#00B86B] hover:bg-[#00995C] text-white rounded-xl font-bold px-4 sm:px-5 h-9 sm:h-10 text-xs sm:text-sm border-0 shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* ── Mobile Slide-down Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-[68px] left-0 right-0 bg-white border-b border-slate-200 shadow-xl overflow-hidden z-40"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.href);
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`
                      flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors
                      ${
                        isActive
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      {IconComp && <IconComp className="w-4 h-4 text-emerald-600" />}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

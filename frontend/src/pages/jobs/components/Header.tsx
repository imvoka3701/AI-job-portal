import { FileText, MessageSquare, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, NotificationBell } from "@/components/ui";
import { useUser, useAuthStore } from "@/stores/authStore";
import { getInitials, getFileUrl } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Việc làm", href: "/jobs" },
  { label: "Tạo CV", href: "/cv" },
  { label: "Công cụ", href: "/tools" },
  { label: "AI Matching ✦", href: "/ai/matching" },
  { label: "Nhà tuyển dụng", href: "/employer" },
];

export function Header() {
  const location = useLocation();
  const user = useUser();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userAvatarSrc = getFileUrl(user?.avatar_url);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 h-[72px] flex items-center shadow-2xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
        
        {/* LEFT: Logo & Nav */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group transition-transform hover:scale-105">
            <div className="w-10 h-10 rounded-xl bg-[#00B86B] hover:bg-[#00995C] flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-base select-none">JP</span>
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">
              AI Job Portal
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1.5 h-full">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`
                    relative px-4 py-2 rounded-xl flex items-center text-sm font-semibold transition-all duration-200
                    ${isActive ? "text-[#00B86B] bg-[#ECFDF5]" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell />
          
          <button
            type="button"
            aria-label="Tin nhắn"
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <div className="h-6 w-[1px] bg-slate-200 mx-1" />

          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "candidate" && <Link to="/cv"><Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold"><FileText className="h-4 w-4 text-[#00B86B]" />CV Builder</Button></Link>}
              <Link to={user.role === "employer" ? "/employer/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/dashboard"}>
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold">
                  <LayoutDashboard className="w-4 h-4 text-[#00B86B]" />
                  Dashboard
                </Button>
              </Link>
              
              <Link
                to={user.role === "employer" ? "/employer/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                title={`Hồ sơ cá nhân: ${user.full_name}`}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ECFDF5] text-[#00995C] font-bold text-sm overflow-hidden border-2 border-white shadow-xs ring-1 ring-emerald-200 cursor-pointer hover:ring-[#00B86B] transition-all shrink-0"
              >
                {userAvatarSrc ? (
                  <img src={userAvatarSrc} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.full_name)
                )}
              </Link>
              
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Đăng xuất"
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-[#00B86B] transition-colors px-3">
                Đăng nhập
              </Link>
              <Link to="/register">
                <Button className="bg-[#00B86B] hover:bg-[#00995C] text-white rounded-xl font-semibold px-5 h-10 border-0 shadow-xs transition-transform hover:-translate-y-0.5">
                  Đăng ký
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

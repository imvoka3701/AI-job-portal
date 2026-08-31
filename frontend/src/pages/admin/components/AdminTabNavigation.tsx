import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Brain,
  Building2,
  Briefcase,
  Calendar,
  ClipboardList,
  ScrollText,
  Users,
} from "lucide-react";

const tabs = [
  { path: "/admin/dashboard", label: "Tổng quan", icon: BarChart3 },
  { path: "/admin/companies", label: "Công ty", icon: Building2 },
  { path: "/admin/jobs", label: "Tin tuyển dụng", icon: Briefcase },
  { path: "/admin/users", label: "Người dùng", icon: Users },
  { path: "/admin/interviews", label: "Phỏng vấn", icon: Calendar },
  { path: "/admin/audit-logs", label: "Nhật ký", icon: ClipboardList },
  { path: "/admin/ai/prompts", label: "AI Prompt", icon: Brain },
  { path: "/admin/ai/logs", label: "AI Logs & Chi phí", icon: ScrollText },
];

export function AdminTabNavigation() {
  const location = useLocation();

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-xs overflow-x-auto">
      <nav className="flex min-w-max items-center gap-1" aria-label="Điều hướng quản trị">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={isActive ? "page" : undefined}
              className={`
                flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap
                ${
                  isActive
                    ? "bg-[#00B86B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }
              `}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

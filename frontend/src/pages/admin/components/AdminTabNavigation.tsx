import { Link, useLocation } from "react-router-dom";
import { Card } from "@/components/ui";
import { BarChart3, Building2, Briefcase, Calendar, ClipboardList, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/admin/dashboard", label: "Tổng quan", icon: BarChart3 },
  { path: "/admin/companies", label: "Công ty", icon: Building2 },
  { path: "/admin/jobs", label: "Tin tuyển dụng", icon: Briefcase },
  { path: "/admin/users", label: "Người dùng", icon: Users },
  { path: "/admin/interviews", label: "Phỏng vấn", icon: Calendar },
  { path: "/admin/audit-logs", label: "Nhật ký", icon: ClipboardList },
];

export function AdminTabNavigation() {
  const location = useLocation();

  return (
    <Card className="overflow-x-auto p-1">
      <nav className="flex min-w-max gap-1" aria-label="Điều hướng quản trị">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-36 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50",
              )}
            >
                <Icon className="w-4 h-4" />
                {tab.label}
            </Link>
          );
        })}
      </nav>
    </Card>
  );
}

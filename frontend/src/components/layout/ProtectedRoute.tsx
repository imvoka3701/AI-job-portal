import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import type { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = useUser();
  const location = useLocation();
  const token = tokenStorage.get();

  useEffect(() => {
    if (token && !user) {
      useAuthStore.getState().fetchMe().catch(() => {});
    }
  }, [token, user]);

  // If there's a token but user hasn't loaded yet, let App.tsx's useEffect fetch it.
  // Wait instead of redirecting.
  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <div className="w-8 h-8 border-4 border-[#00B86B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user && !token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard if role is not allowed
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "employer") return <Navigate to="/employer/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

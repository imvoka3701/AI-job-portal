import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Spinner } from "@/components/ui";

/**
 * Google OAuth callback page.
 *
 * Backend redirects here after successful Google login with:
 *   ?token=<JWT>&redirect=/dashboard|/employer/dashboard
 *
 * This page is visible for < 1 second while we store the token and redirect.
 */
export function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const redirect = searchParams.get("redirect") || "/dashboard";

    if (!token) {
      setError("Đăng nhập Google thất bại — không nhận được token.");
      return;
    }

    // Store token and fetch user profile
    tokenStorage.set(token);
    useAuthStore
      .getState()
      .fetchMe()
      .then(() => {
        navigate(redirect, { replace: true });
      })
      .catch(() => {
        tokenStorage.remove();
        setError("Không thể tải thông tin tài khoản. Vui lòng thử lại.");
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Đăng nhập thất bại</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" color="blue" label="Đang xử lý đăng nhập Google..." />
        <p className="text-sm text-gray-500 font-medium">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
}

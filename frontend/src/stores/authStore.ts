import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, tokenStorage, getApiErrorMessage } from "@/lib/axios";
import type { User, RegisterPayload } from "@/types/user";
import type { TokenResponse, LoginPayload } from "@/types/api";

// ─── State shape ──────────────────────────────────────────────────────────────
interface AuthState {
  /** Currently authenticated user, null if not logged in */
  user: User | null;
  /** Raw JWT access token */
  token: string | null;
  /** Loading state for async actions */
  isLoading: boolean;
  /** Last error message from auth operations */
  error: string | null;
  /** Success message (e.g. employer pending approval after register) */
  successMessage: string | null;

  // ─── Computed ───────────────────────────────────────────────────────────────
  isAuthenticated: boolean;

  // ─── Actions ────────────────────────────────────────────────────────────────
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      successMessage: null,

      // Derived — recalculated whenever token changes
      get isAuthenticated() {
        return get().token !== null;
      },

      // ── Login ────────────────────────────────────────────────────────────────
      login: async (payload: LoginPayload) => {
        set({ isLoading: true, error: null, successMessage: null });
        try {
          const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
          tokenStorage.set(data.access_token);
          set({ token: data.access_token, isLoading: false });
          // Fetch full profile after login
          await get().fetchMe();
        } catch (err) {
          set({ isLoading: false, error: getApiErrorMessage(err), token: null, user: null });
          throw err;
        }
      },

      // ── Register ─────────────────────────────────────────────────────────────
      register: async (payload: RegisterPayload) => {
        set({ isLoading: true, error: null, successMessage: null });
        try {
          await apiClient.post<User>("/auth/register", payload);
          set({ isLoading: false });
          // Employer accounts: skip auto-login — need admin approval first
          if (payload.role === "employer") {
            set({
              isLoading: false,
              error: null,
              successMessage: "Đăng ký thành công! Tài khoản của bạn đang chờ Admin duyệt. Bạn sẽ nhận được thông báo khi tài khoản được phê duyệt.",
            });
            return;
          }
          // Candidate: auto-login after register
          await get().login({ email: payload.email, password: payload.password });
        } catch (err) {
          set({ isLoading: false, error: getApiErrorMessage(err) });
          throw err;
        }
      },

      // ── Logout ───────────────────────────────────────────────────────────────
      logout: () => {
        tokenStorage.remove();
        set({ user: null, token: null, error: null });
      },

      // ── Fetch current user profile ───────────────────────────────────────────
      fetchMe: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.get<User>("/users/me");
          set({ user: data, isLoading: false });
        } catch (err) {
          // If profile fetch fails (e.g. token expired), clear auth state
          tokenStorage.remove();
          set({ user: null, token: null, isLoading: false, error: getApiErrorMessage(err) });
          throw err;
        }
      },

      // ── Clear error ──────────────────────────────────────────────────────────
      clearError: () => set({ error: null, successMessage: null }),
    }),
    {
      name: "auth-storage",
      // Only persist token — user profile is always re-fetched fresh
      partialize: (state) => ({ token: state.token }),
      // Rehydrate token into localStorage on app load
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          tokenStorage.set(state.token);
          // Auto-fetch profile on rehydrate if token exists
          useAuthStore.getState().fetchMe().catch(() => {});
        }
      },
    }
  )
);

// ─── Selector hooks (avoids unnecessary re-renders) ──────────────────────────
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.token !== null);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useAuthSuccess = () => useAuthStore((s) => s.successMessage);

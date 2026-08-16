import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

/** Token storage key — kept in one place to avoid typos */
const TOKEN_KEY = "access_token";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ─── Request interceptor: attach JWT if present ───────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response interceptor: unwrap data, handle 401 ───────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ detail: string }>) => {
    if (error.response?.status === 401) {
      // Clear stale token and redirect to login
      localStorage.removeItem(TOKEN_KEY);
      // Avoid redirect loop if already on /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY),
};

// ─── Typed API error extractor ────────────────────────────────────────────────
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error as AxiosError<{ detail: string | { msg: string }[] | { code?: string; message?: string; retryable?: boolean } }>).response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
    if (detail && typeof detail === "object" && "message" in detail && typeof detail.message === "string") return detail.message;
    if (error.code === "ECONNABORTED") return "Dịch vụ AI phản hồi quá thời gian. Vui lòng thử lại.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

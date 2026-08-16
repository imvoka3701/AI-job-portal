import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCompanyContext } from "@/lib/api/company";
import { useAuthStore } from "@/stores/authStore";
import type { CompanyContext } from "@/types/company";

interface EmployerCompanyContextValue {
  data: CompanyContext | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  refresh: () => Promise<void>;
}

const EmployerCompanyContext = createContext<EmployerCompanyContextValue | null>(null);

export function EmployerCompanyProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const userRole = user?.role;
  const [data, setData] = useState<CompanyContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(Boolean(token));
      return;
    }
    if (userRole !== "employer") {
      setData(null);
      setError("Tài khoản hiện tại không thuộc doanh nghiệp.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await getCompanyContext());
    } catch {
      setError("Không thể tải thông tin doanh nghiệp và quyền truy cập.");
    } finally {
      setLoading(false);
    }
  }, [token, userId, userRole]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<EmployerCompanyContextValue>(
    () => ({
      data,
      loading,
      error,
      hasPermission: (permission) => data?.permissions.includes(permission) ?? false,
      refresh,
    }),
    [data, error, loading, refresh],
  );

  return (
    <EmployerCompanyContext.Provider value={value}>
      {children}
    </EmployerCompanyContext.Provider>
  );
}

export function useEmployerCompany(): EmployerCompanyContextValue {
  const value = useContext(EmployerCompanyContext);
  if (!value) {
    throw new Error("useEmployerCompany must be used inside EmployerCompanyProvider");
  }
  return value;
}

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployerCompanyProvider, useEmployerCompany } from "@/contexts/EmployerCompanyContext";
import * as companyApi from "@/lib/api/company";

vi.mock("@/lib/api/company", () => ({
  getCompanyContext: vi.fn(),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({
    token: "employer-token",
    user: { id: 3, role: "employer" },
  }),
}));

const contextResponse = {
  company: { id: 1, name: "Acme", description: null, logo_url: null, is_active: true },
  membership: {
    id: 10,
    company_id: 1,
    user_id: 3,
    full_name: "HR Owner",
    email: "owner@acme.test",
    avatar_url: null,
    member_role: "hr" as const,
    department_id: null,
    department_name: null,
    status: "active" as const,
    is_owner: true,
    joined_at: "2026-08-14T00:00:00Z",
    updated_at: "2026-08-14T00:00:00Z",
  },
  permissions: ["job:view", "job:manage", "team:manage"],
  departments: [],
};

function Consumer() {
  const { data, loading, error, hasPermission, refresh } = useEmployerCompany();
  if (loading) return <p>Loading context</p>;
  if (error) return <button onClick={() => void refresh()}>{error}</button>;
  return (
    <div>
      <p>{data?.company.name}</p>
      <p>{hasPermission("team:manage") ? "Can manage team" : "Cannot manage team"}</p>
      <p>{hasPermission("candidate:recommend") ? "Can recommend" : "Cannot recommend"}</p>
    </div>
  );
}

describe("EmployerCompanyContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hydrates company context and exposes exact permissions", async () => {
    vi.mocked(companyApi.getCompanyContext).mockResolvedValue(contextResponse);
    render(<EmployerCompanyProvider><Consumer /></EmployerCompanyProvider>);

    expect(screen.getByText("Loading context")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Acme")).toBeInTheDocument());
    expect(screen.getByText("Can manage team")).toBeInTheDocument();
    expect(screen.getByText("Cannot recommend")).toBeInTheDocument();
  });

  it("keeps a retryable error state when context loading fails", async () => {
    vi.mocked(companyApi.getCompanyContext)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(contextResponse);
    render(<EmployerCompanyProvider><Consumer /></EmployerCompanyProvider>);

    const retry = await screen.findByRole("button", {
      name: "Không thể tải thông tin doanh nghiệp và quyền truy cập.",
    });
    await userEvent.click(retry);
    await waitFor(() => expect(screen.getByText("Acme")).toBeInTheDocument());
    expect(companyApi.getCompanyContext).toHaveBeenCalledTimes(2);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { EmployerLayout } from "@/components/layout/EmployerLayout";
import * as companyApi from "@/lib/api/company";

vi.mock("@/lib/api/company", () => ({
  getCompanyContext: vi.fn(),
}));

const authState = {
  token: "employer-token",
  user: {
    id: 7,
    role: "employer",
    full_name: "Employer User",
    email: "employer@example.com",
    company_name: "Acme",
    avatar_url: null,
  },
  logout: vi.fn(),
};

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
  useUser: () => authState.user,
}));

const ownerContext = {
  company: { id: 1, name: "Acme", description: null, logo_url: null, is_active: true },
  membership: {
    id: 10,
    company_id: 1,
    user_id: 7,
    full_name: "Employer User",
    email: "employer@example.com",
    avatar_url: null,
    member_role: "hr" as const,
    department_id: null,
    department_name: null,
    status: "active" as const,
    is_owner: true,
    joined_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
  },
  permissions: [
    "analytics:view",
    "job:view",
    "job:manage",
    "application:view",
    "team:view",
    "team:manage",
    "recruitment_request:view",
    "recruitment_request:review",
  ],
  departments: [],
};

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/employer/dashboard"]}>
      <Routes>
        <Route path="/employer" element={<EmployerLayout />}>
          <Route path="dashboard" element={<p>Dashboard content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("EmployerLayout permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows owner actions when the server grants management permissions", async () => {
    vi.mocked(companyApi.getCompanyContext).mockResolvedValue(ownerContext);
    renderLayout();

    await waitFor(() => expect(screen.getByText("Owner · Nhân sự")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Đội ngũ & phân quyền/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nhu cầu tuyển dụng/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng tin mới" })).toBeInTheDocument();
  });

  it("hides HR-only actions from a department head", async () => {
    vi.mocked(companyApi.getCompanyContext).mockResolvedValue({
      ...ownerContext,
      membership: {
        ...ownerContext.membership,
        member_role: "department_head",
        department_id: 2,
        department_name: "Engineering",
        is_owner: false,
      },
      permissions: [
        "analytics:view",
        "job:view",
        "application:view",
        "candidate:recommend",
        "team:view",
        "recruitment_request:view",
        "recruitment_request:create",
      ],
    });
    renderLayout();

    await waitFor(() => expect(screen.getByText("Trưởng bộ phận")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Đội ngũ & phân quyền/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nhu cầu tuyển dụng/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đăng tin mới" })).not.toBeInTheDocument();
  });
});

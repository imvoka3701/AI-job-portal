import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EmployerRoleOverview } from "./EmployerRoleOverview";
import type { CompanyContext } from "@/types/company";
import type { EmployerStats } from "@/lib/api/employer";

const stats: EmployerStats = {
  total_jobs: 3,
  total_applications: 12,
  avg_ai_match: 74,
  applications_over_time: [],
  active_jobs: [],
  funnel: [],
  time_to_hire_avg_days: null,
};

const ownerContext: CompanyContext = {
  company: { id: 1, name: "Acme", description: null, logo_url: null, is_active: true },
  membership: {
    id: 1,
    company_id: 1,
    user_id: 1,
    full_name: "Owner HR",
    email: "owner@acme.test",
    avatar_url: null,
    member_role: "hr",
    department_id: null,
    department_name: null,
    status: "active",
    is_owner: true,
    joined_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
  },
  permissions: ["job:manage", "team:manage"],
  departments: [],
};

describe("EmployerRoleOverview", () => {
  it("shows company operations to an owner", () => {
    render(<MemoryRouter><EmployerRoleOverview context={ownerContext} stats={stats} /></MemoryRouter>);
    expect(screen.getByText("Trung tâm vận hành tuyển dụng")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng tin mới/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Quản lý đội ngũ/ })).toBeInTheDocument();
  });

  it("focuses a department head on evaluation and hides create-job actions", () => {
    const headContext: CompanyContext = {
      ...ownerContext,
      membership: {
        ...ownerContext.membership,
        member_role: "department_head",
        department_id: 2,
        department_name: "Engineering",
        is_owner: false,
      },
      permissions: ["application:view", "candidate:recommend"],
    };
    render(<MemoryRouter><EmployerRoleOverview context={headContext} stats={stats} /></MemoryRouter>);
    expect(screen.getByText("Không gian đánh giá chuyên môn")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Đăng tin mới/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ứng viên cần đánh giá/ })).toBeInTheDocument();
  });
});

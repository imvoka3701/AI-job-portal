import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { EmployerTeamPage } from "@/pages/employer/EmployerTeamPage";
import * as companyApi from "@/lib/api/company";
import type { Job } from "@/types/job";

vi.mock("@/lib/api/company", () => ({
  createDepartment: vi.fn(),
  createInvitation: vi.fn(),
  getInvitations: vi.fn(),
  getCompanyJobs: vi.fn(),
  getCompanyActivity: vi.fn(),
  getJobAssignmentsBatch: vi.fn(),
  getTeamMembers: vi.fn(),
  resendInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  transferTeamOwnership: vi.fn(),
  updateDepartment: vi.fn(),
  updateJobAssignmentsBatch: vi.fn(),
  updateTeamMember: vi.fn(),
}));

const refresh = vi.fn();
const context = {
  company: { id: 1, name: "Acme", description: null, logo_url: null, is_active: true },
  membership: {
    id: 10,
    company_id: 1,
    user_id: 7,
    full_name: "Owner HR",
    email: "owner@acme.test",
    avatar_url: null,
    member_role: "hr" as const,
    department_id: null,
    department_name: null,
    status: "active" as const,
    is_owner: true,
    joined_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
  },
  permissions: ["team:view", "team:manage"],
  departments: [
    { id: 1, company_id: 1, name: "Engineering", description: null, is_active: true },
    { id: 2, company_id: 1, name: "Finance", description: null, is_active: true },
  ],
};

const members = [
  context.membership,
  {
    ...context.membership,
    id: 11,
    user_id: 8,
    full_name: "Engineering Head",
    email: "head@acme.test",
    member_role: "department_head" as const,
    department_id: 1,
    department_name: "Engineering",
    is_owner: false,
  },
  {
    ...context.membership,
    id: 12,
    user_id: 9,
    full_name: "Suspended HR",
    email: "suspended@acme.test",
    department_id: 2,
    department_name: "Finance",
    status: "suspended" as const,
    is_owner: false,
  },
];

const jobs: Job[] = [
  {
    id: 101,
    title: "Backend Engineer",
    description: "Build backend services",
    requirements: "Python",
    benefits: null,
    job_type: "full_time",
    experience_level: "senior",
    salary_min: null,
    salary_max: null,
    location: "Ha Noi",
    is_active: true,
    employer_id: 7,
    company_id: 1,
    department_id: 1,
    employer: null,
    category_id: null,
    created_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
  },
  {
    id: 102,
    title: "Finance Manager",
    description: "Lead finance operations",
    requirements: "Finance",
    benefits: null,
    job_type: "full_time",
    experience_level: "lead",
    salary_min: null,
    salary_max: null,
    location: "Ho Chi Minh City",
    is_active: true,
    employer_id: 7,
    company_id: 1,
    department_id: 2,
    employer: null,
    category_id: null,
    created_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
  },
];

vi.mock("@/contexts/EmployerCompanyContext", () => ({
  useEmployerCompany: () => ({
    data: context,
    loading: false,
    error: null,
    hasPermission: (permission: string) => context.permissions.includes(permission),
    refresh,
  }),
}));

describe("EmployerTeamPage", () => {
  const renderTeamPage = (initialEntry = "/employer/team") => render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <EmployerTeamPage />
    </MemoryRouter>,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(companyApi.getTeamMembers).mockResolvedValue(members);
    vi.mocked(companyApi.getInvitations).mockResolvedValue([]);
    vi.mocked(companyApi.getCompanyActivity).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    });
    vi.mocked(companyApi.updateTeamMember).mockImplementation(async (membershipId, payload) => ({
      ...(members.find((member) => member.id === membershipId) ?? members[0]),
      ...payload,
      updated_at: "2026-08-15T01:00:00Z",
    }));
  });

  it("filters members by role, status, department, and keyword", async () => {
    const user = userEvent.setup();
    renderTeamPage();
    await screen.findByText("Engineering Head");

    await user.selectOptions(screen.getByLabelText("Lọc theo vai trò"), "department_head");
    expect(screen.getByText(/Engineering Head/)).toBeInTheDocument();
    expect(screen.queryByText("Owner HR")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa lọc" }));
    await user.selectOptions(screen.getByLabelText("Lọc theo trạng thái"), "suspended");
    expect(screen.getByText("Suspended HR")).toBeInTheDocument();
    expect(screen.queryByText("Engineering Head")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa lọc" }));
    await user.selectOptions(screen.getByLabelText("Lọc theo phòng ban"), "1");
    expect(screen.getByText("Engineering Head")).toBeInTheDocument();
    expect(screen.queryByText("Suspended HR")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa lọc" }));
    await user.type(screen.getByLabelText("Tìm thành viên"), "suspended@acme.test");
    expect(screen.getByText("Suspended HR")).toBeInTheDocument();
    expect(screen.queryByText("Engineering Head")).not.toBeInTheDocument();
  });

  it("keeps an actionable retry path when loading the team fails", async () => {
    vi.mocked(companyApi.getTeamMembers)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(members);
    renderTeamPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không thể tải dữ liệu đội ngũ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    await waitFor(() => expect(screen.getByText("Engineering Head")).toBeInTheDocument());
    expect(companyApi.getTeamMembers).toHaveBeenCalledTimes(2);
  });

  it("preserves other assignees when an owner updates a head job scope", async () => {
    vi.mocked(companyApi.getCompanyJobs).mockResolvedValue(jobs);
    vi.mocked(companyApi.getJobAssignmentsBatch).mockResolvedValue({
      assignments: [
        { job_id: 101, membership_ids: [11] },
        { job_id: 102, membership_ids: [99] },
      ],
    });
    vi.mocked(companyApi.updateJobAssignmentsBatch).mockResolvedValue({
      assignments: [{ job_id: 102, membership_ids: [99, 11] }],
    });
    const user = userEvent.setup();
    renderTeamPage();

    await user.click(await screen.findByRole("button", {
      name: "Phân công job cho Engineering Head",
    }));
    const engineering = await screen.findByText("Backend Engineer");
    const finance = screen.getByRole("checkbox", { name: /Finance Manager/ });
    expect(engineering.closest("label")).toHaveTextContent("Theo phòng ban");
    expect(finance).not.toBeChecked();

    await user.click(finance);
    await user.click(screen.getByRole("button", { name: "Lưu 1 thay đổi" }));
    await waitFor(() => {
      expect(companyApi.updateJobAssignmentsBatch).toHaveBeenCalledWith([
        { job_id: 102, membership_ids: [99, 11] },
      ]);
    });
    expect(companyApi.updateJobAssignmentsBatch).toHaveBeenCalledTimes(1);
    expect(companyApi.getJobAssignmentsBatch).toHaveBeenCalledTimes(1);
  });

  it("explains permissions and requires confirmation before changing a role", async () => {
    const user = userEvent.setup();
    renderTeamPage();
    await screen.findByText("Engineering Head");

    await user.click(screen.getByRole("tab", { name: /Ma trận quyền/ }));
    expect(await screen.findByText("Ma trận quyền nghiệp vụ")).toBeInTheDocument();
    expect(screen.getByText("Vai trò của bạn: Owner")).toBeInTheDocument();
    expect(screen.getByText("AI chỉ hỗ trợ phân tích và soạn nội dung. Quyết định tuyển dụng cuối luôn thuộc về Owner hoặc Nhân sự.")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Thành viên/ }));
    await user.selectOptions(await screen.findByLabelText("Vai trò của Engineering Head"), "hr");
    expect(screen.getByRole("dialog", { name: "Xác nhận thay đổi vai trò" })).toBeInTheDocument();
    expect(companyApi.updateTeamMember).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Đổi vai trò" }));
    await waitFor(() => expect(companyApi.updateTeamMember).toHaveBeenCalledWith(11, {
      member_role: "hr",
      department_id: null,
    }));
    expect(await screen.findByText("Đã cập nhật thành viên")).toBeInTheDocument();
  });

  it("restores URL filters and exposes the immutable activity timeline", async () => {
    vi.mocked(companyApi.getCompanyActivity).mockResolvedValue({
      items: [{
        id: 41,
        actor_user_id: 7,
        actor_email: "owner@acme.test",
        action: "membership.updated",
        target_type: "membership",
        target_id: "11",
        target_label: "Engineering Head",
        details_json: { member_role: "hr" },
        created_at: "2026-08-15T01:00:00Z",
      }],
      total: 1,
      page: 1,
      page_size: 10,
    });
    const user = userEvent.setup();
    renderTeamPage("/employer/team?role=department_head&q=engineering");

    expect(await screen.findByLabelText("Lọc theo vai trò")).toHaveValue("department_head");
    expect(screen.getByLabelText("Tìm thành viên")).toHaveValue("engineering");

    await user.click(screen.getByRole("tab", { name: /Nhật ký/ }));
    expect(await screen.findByText("Nhật ký hoạt động")).toBeInTheDocument();
    expect(await screen.findByText("Đã thay đổi thành viên")).toBeInTheDocument();
    expect(screen.getByText(/Engineering Head/)).toBeInTheDocument();
    expect(companyApi.getCompanyActivity).toHaveBeenCalledWith({
      page: 1,
      page_size: 10,
      action: undefined,
      target_type: undefined,
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RecruitmentRequestsPage } from "@/pages/employer/RecruitmentRequestsPage";
import * as requestApi from "@/lib/api/recruitmentRequests";
import type { CompanyContext, RecruitmentRequest } from "@/types/company";


vi.mock("@/lib/api/recruitmentRequests", () => ({
  cancelRecruitmentRequest: vi.fn(),
  createRecruitmentRequest: vi.fn(),
  getRecruitmentRequests: vi.fn(),
  reviewRecruitmentRequest: vi.fn(),
  submitRecruitmentRequest: vi.fn(),
  updateRecruitmentRequest: vi.fn(),
}));

const context: CompanyContext = {
  company: { id: 1, name: "Acme", description: null, logo_url: null, is_active: true },
  membership: {
    id: 12,
    company_id: 1,
    user_id: 8,
    full_name: "Engineering Head",
    email: "head@acme.test",
    avatar_url: null,
    member_role: "department_head" as const,
    department_id: 2,
    department_name: "Engineering",
    status: "active" as const,
    is_owner: false,
    joined_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
  },
  permissions: ["recruitment_request:view", "recruitment_request:create"],
  departments: [{ id: 2, company_id: 1, name: "Engineering", description: null, is_active: true }],
};

vi.mock("@/contexts/EmployerCompanyContext", () => ({
  useEmployerCompany: () => ({
    data: context,
    loading: false,
    error: null,
    hasPermission: (permission: string) => context.permissions.includes(permission),
    refresh: vi.fn(),
  }),
}));

const submittedRequest: RecruitmentRequest = {
  id: 41,
  company_id: 1,
  department_id: 2,
  department_name: "Engineering",
  requested_by_id: 8,
  requester_name: "Engineering Head",
  requester_email: "head@acme.test",
  title: "Senior Backend Engineer",
  headcount: 2,
  job_type: "full_time",
  priority: "high",
  reason: "Mở rộng đội ngũ cho nền tảng mới.",
  responsibilities: "Thiết kế và vận hành các dịch vụ backend quan trọng.",
  requirements: "Kinh nghiệm Python, FastAPI, PostgreSQL và hệ thống phân tán.",
  target_start_date: "2026-10-01",
  status: "submitted",
  review_note: null,
  reviewed_by_id: null,
  reviewer_name: null,
  submitted_at: "2026-08-15T01:00:00Z",
  reviewed_at: null,
  cancelled_at: null,
  converted_job_id: null,
  converted_at: null,
  created_at: "2026-08-15T00:00:00Z",
  updated_at: "2026-08-15T01:00:00Z",
};

const renderPage = () => render(<MemoryRouter><RecruitmentRequestsPage /></MemoryRouter>);

describe("RecruitmentRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    context.membership.member_role = "department_head";
    context.membership.department_id = 2;
    context.membership.department_name = "Engineering";
    context.membership.is_owner = false;
    context.permissions.splice(0, context.permissions.length, "recruitment_request:view", "recruitment_request:create");
    vi.mocked(requestApi.getRecruitmentRequests).mockResolvedValue({ items: [], total: 0, page: 1, page_size: 12 });
    vi.mocked(requestApi.createRecruitmentRequest).mockResolvedValue({ ...submittedRequest, status: "submitted" });
  });

  it("lets a department head submit a complete hiring request", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Chưa có nhu cầu tuyển dụng");
    await user.click(screen.getAllByRole("button", { name: "Tạo yêu cầu" })[0]);

    fireEvent.change(screen.getByLabelText("Vị trí cần tuyển"), { target: { value: "Senior Backend Engineer" } });
    fireEvent.change(screen.getByLabelText("Số lượng"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Lý do tuyển dụng"), { target: { value: "Mở rộng đội ngũ cho nền tảng tuyển dụng mới." } });
    fireEvent.change(screen.getByLabelText("Trách nhiệm chính"), { target: { value: "Thiết kế và vận hành các dịch vụ backend quan trọng." } });
    fireEvent.change(screen.getByLabelText("Yêu cầu chuyên môn"), { target: { value: "Kinh nghiệm Python, FastAPI, PostgreSQL và hệ thống phân tán." } });
    await user.click(screen.getByRole("button", { name: "Gửi HR duyệt" }));

    await waitFor(() => expect(requestApi.createRecruitmentRequest).toHaveBeenCalledWith(expect.objectContaining({
      title: "Senior Backend Engineer",
      headcount: 2,
      submit: true,
    })));
  });

  it("requires a rejection note and lets HR approve or reject submitted requests", async () => {
    context.membership.member_role = "hr";
    context.membership.department_id = null;
    context.membership.department_name = null;
    context.membership.is_owner = true;
    context.permissions.splice(0, context.permissions.length, "recruitment_request:view", "recruitment_request:review");
    vi.mocked(requestApi.getRecruitmentRequests).mockResolvedValue({ items: [submittedRequest], total: 1, page: 1, page_size: 12 });
    vi.mocked(requestApi.reviewRecruitmentRequest).mockResolvedValue({ ...submittedRequest, status: "rejected", review_note: "Bổ sung ngân sách" });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Duyệt" }));
    await user.click(screen.getByRole("radio", { name: /Yêu cầu chỉnh sửa/ }));
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu chỉnh sửa" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng ghi rõ lý do từ chối");

    fireEvent.change(screen.getByLabelText(/Ghi chú phản hồi/), { target: { value: "Bổ sung ngân sách" } });
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu chỉnh sửa" }));
    await waitFor(() => expect(requestApi.reviewRecruitmentRequest).toHaveBeenCalledWith(41, "rejected", "Bổ sung ngân sách"));
  });

  it("shows a retry action when the request list fails", async () => {
    vi.mocked(requestApi.getRecruitmentRequests)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, page_size: 12 });
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("Không tải được nhu cầu tuyển dụng")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Chưa có nhu cầu tuyển dụng")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CandidateDashboard } from "../CandidateDashboard";

const mockCandidate = {
  id: 101,
  role: "candidate",
  full_name: "Nguyễn Văn Ứng Viên",
  email: "candidate@example.com",
  avatar_url: null,
};

vi.mock("@/stores/authStore", () => ({
  useUser: () => mockCandidate,
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ fetchMe: vi.fn(), logout: vi.fn() }),
}));

vi.mock("@/lib/api/applications", () => ({
  getMyApplications: vi.fn().mockResolvedValue([]),
  withdrawApplication: vi.fn(),
}));

vi.mock("@/lib/api/resumes", () => ({
  getMyResumes: vi.fn().mockResolvedValue([]),
  uploadResume: vi.fn(),
  deleteResume: vi.fn(),
  evaluateResume: vi.fn(),
}));

vi.mock("@/lib/api/cvDocuments", () => ({
  getCvDocuments: vi.fn().mockResolvedValue([]),
  deleteCvDocument: vi.fn(),
}));

vi.mock("@/lib/api/rounds", () => ({
  getRounds: vi.fn().mockResolvedValue([]),
  getCalendarLinks: vi.fn(),
  downloadIcsFile: vi.fn(),
}));

vi.mock("@/lib/api/feedback", () => ({
  submitFeedback: vi.fn().mockResolvedValue({ id: 1, status: "new" }),
}));

describe("CandidateDashboard Incident Feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Báo Sự Cố & Góp Ý' quick action button in Hero bar", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <CandidateDashboard />
      </MemoryRouter>
    );

    const feedbackBtn = await waitFor(() =>
      screen.getByRole("button", { name: /Báo Sự Cố & Góp Ý/i })
    );
    expect(feedbackBtn).toBeInTheDocument();
  });

  it("opens UserFeedbackModal with bug_report type when incident button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <CandidateDashboard />
      </MemoryRouter>
    );

    const feedbackBtn = await waitFor(() =>
      screen.getByRole("button", { name: /Báo Sự Cố & Góp Ý/i })
    );
    feedbackBtn.click();

    await waitFor(() => {
      expect(screen.getByText("Đóng Góp Ý Kiến & Báo Lỗi")).toBeInTheDocument();
      expect(screen.getByText("Báo lỗi kỹ thuật")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("[Sự cố] Báo lỗi tại Bàn làm việc Ứng viên")
      ).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployerCandidatesPage } from "../EmployerCandidatesPage";
import { MemoryRouter } from "react-router-dom";
import * as EmployerCompanyContext from "@/contexts/EmployerCompanyContext";
import * as AuthStore from "@/stores/authStore";

// Mock the API calls directly to have absolute control over the data
vi.mock("@/lib/api/company", () => ({
  getCompanyJobs: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "Backend Developer",
      requirements: "Python, FastAPI",
      job_type: "FULL_TIME",
      location: "Hanoi",
    }
  ])
}));

vi.mock("@/lib/api/ai", () => ({
  getEmployerApplications: vi.fn().mockResolvedValue([
    {
      id: 1,
      job_id: 1,
      resume_id: 101,
      candidate: { full_name: "Mock Candidate", email: "mock@example.com" },
      ai_matching_score: 95,
      status: "applied",
      cv_document: {},
      created_at: new Date().toISOString(),
    }
  ]),
  evaluateCV: vi.fn().mockResolvedValue({
    overall_score: 3.0,
    skill_analysis: { "Python": 1.0 },
    summary: "Bad generic CV",
    suggestions: []
  }),
  summarizeCV: vi.fn().mockResolvedValue({
    summary: "Ứng viên có 5 năm kinh nghiệm React và FastAPI.",
    fit_points: [
      "Thành thạo TypeScript và Python backend",
      "Kinh nghiệm thiết kế hệ thống phân tán",
    ],
    questions: [
      "Bạn đã tối ưu hóa hiệu năng pgvector như thế nào?",
      "Trình bày cách xử lý concurrency trong FastAPI.",
    ],
  }),
}));

vi.mock("@/lib/api/employer", () => ({
  getEmployerStats: vi.fn().mockResolvedValue({ total_applications: 10 }),
}));

// Mock Contexts
vi.spyOn(AuthStore, "useUser").mockReturnValue({
  id: 1,
  email: "emp@example.com",
  role: "employer",
  company_name: "Test Corp"
} as any);

vi.spyOn(EmployerCompanyContext, "useEmployerCompany").mockReturnValue({
  data: {
    company: { id: 1, name: "Test Corp" },
    membership: { id: 1, is_owner: true, role: "owner" }
  },
  isLoading: false,
  error: null,
  hasPermission: () => true
} as any);


describe("EmployerCandidatesPage - AI Modal Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies badge verdict is based on matching score, NOT on evaluate overall_score", async () => {
    const user = userEvent.setup();
    
    // Render the page within Router because it contains Links
    render(
      <MemoryRouter>
        <EmployerCandidatesPage />
      </MemoryRouter>
    );

    // The list loads "Mock Candidate". Click it to select the application and reveal the action buttons.
    const candidateRow = await screen.findByText("Mock Candidate");
    await user.click(candidateRow);

    // Now the detail view is open, click the evaluate button
    const evaluateButton = await screen.findByRole("button", { name: /đánh giá cv/i });
    
    // Click the evaluate button to open the modal
    await user.click(evaluateButton);

    // Wait for the modal to open and API evaluateCV to resolve
    await waitFor(() => {
      expect(screen.getByText("Độ phù hợp với vị trí (JD Matching)")).toBeInTheDocument();
    });

    // 1. Verify JD Matching Score correctly displays the 95%
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("% MATCH")).toBeInTheDocument();
    
    // 2. Verify the Badge uses the 95 score (returns "✓ Rất phù hợp")
    expect(screen.getByText("✓ Rất phù hợp")).toBeInTheDocument();

    // 3. Verify the CV Quality correctly displays the 3.0/10 score from LLM
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/ 10 ĐIỂM")).toBeInTheDocument();
    
    // 4. Crucially: ensure the fallback bad text from a low evaluate score ("✕ Ít phù hợp") 
    // is NOT used to label the matching verdict
    expect(screen.queryByText("✕ Ít phù hợp")).not.toBeInTheDocument();
  });

  it("verifies badge verdict shows '✕ Ít phù hợp' when matching score is low, even if evaluate score is high", async () => {
    // Override the mocks for this specific test to simulate the original bug scenario
    const { getEmployerApplications, evaluateCV } = await import("@/lib/api/ai");
    
    (getEmployerApplications as any).mockResolvedValue([
      {
        id: 2,
        job_id: 1,
        resume_id: 102,
        candidate: { full_name: "Mismatch Candidate", email: "mismatch@example.com" },
        ai_matching_score: 15, // 15% matching (Ít phù hợp)
        status: "applied",
        cv_document: {},
        created_at: new Date().toISOString(),
      }
    ]);
    
    (evaluateCV as any).mockResolvedValue({
      overall_score: 8.2, // 8.2/10 evaluate (rất cao)
      skill_analysis: { "Python": 1.0 },
      summary: "Good CV structure but wrong field",
      suggestions: []
    });

    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <EmployerCandidatesPage />
      </MemoryRouter>
    );

    const candidateRow = await screen.findByText("Mismatch Candidate");
    await user.click(candidateRow);

    const evaluateButton = await screen.findByRole("button", { name: /đánh giá cv/i });
    await user.click(evaluateButton);

    await waitFor(() => {
      expect(screen.getByText("Độ phù hợp với vị trí (JD Matching)")).toBeInTheDocument();
    });

    // 1. Verify it shows 15% matching and 8.2 evaluate score
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("8.2")).toBeInTheDocument();
    
    // 2. Verify the badge correctly displays "✕ Ít phù hợp" based on the 15% score
    expect(screen.getByText("✕ Ít phù hợp")).toBeInTheDocument();

    // 3. Ensure it absolutely does NOT show "✓ Rất phù hợp" despite the 8.2 overall_score
    expect(screen.queryByText("✓ Rất phù hợp")).not.toBeInTheDocument();
  });

  it("renders summary, fit_points, and suggested questions in CV Summarize modal", async () => {
    const { getEmployerApplications } = await import("@/lib/api/ai");
    (getEmployerApplications as any).mockResolvedValue([
      {
        id: 1,
        job_id: 1,
        resume_id: 101,
        candidate: { full_name: "Summarize Candidate", email: "candidate@example.com" },
        ai_matching_score: 90,
        status: "applied",
        cv_document: {},
        created_at: new Date().toISOString(),
      }
    ]);

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <EmployerCandidatesPage />
      </MemoryRouter>
    );

    const candidateRow = await screen.findByText("Summarize Candidate");
    await user.click(candidateRow);

    const summarizeButton = await screen.findByRole("button", { name: /^tóm tắt$/i });
    await user.click(summarizeButton);

    await waitFor(() => {
      expect(screen.getByText("Tóm tắt năng lực & kinh nghiệm cốt lõi")).toBeInTheDocument();
    });

    // 1. Verify core summary is rendered
    expect(screen.getByText(/Ứng viên có 5 năm kinh nghiệm React và FastAPI/i)).toBeInTheDocument();

    // 2. Verify fit_points are rendered
    expect(screen.getByText("Điểm phù hợp nổi bật với vị trí (2)")).toBeInTheDocument();
    expect(screen.getByText("Thành thạo TypeScript và Python backend")).toBeInTheDocument();
    expect(screen.getByText("Kinh nghiệm thiết kế hệ thống phân tán")).toBeInTheDocument();

    // 3. Verify suggested interview questions are rendered
    expect(screen.getByText("Câu hỏi phỏng vấn đề xuất (2)")).toBeInTheDocument();
    expect(screen.getByText("Bạn đã tối ưu hóa hiệu năng pgvector như thế nào?")).toBeInTheDocument();
    expect(screen.getByText("Trình bày cách xử lý concurrency trong FastAPI.")).toBeInTheDocument();
  });
});

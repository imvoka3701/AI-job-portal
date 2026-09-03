import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EmployerKanbanBoard } from "../EmployerKanbanBoard";
import type { EmployerApplication } from "@/types/application";

const mockApplications: EmployerApplication[] = [
  {
    id: 1,
    status: "pending",
    ai_matching_score: 85,
    ai_feedback: null,
    hiring_recommendation: null,
    recommendation_note: null,
    recommendation_by_id: null,
    recommended_at: null,
    decision_by_id: null,
    decided_at: null,
    decision_reason: null,
    candidate: {
      id: 201,
      full_name: "Alice Nguyen",
      email: "alice@example.com",
      phone: null,
      avatar_url: null,
    },
    job_id: 101,
    resume_id: 301,
    resume: {
      file_url: "/resumes/alice.pdf",
    },
    cv_document_id: null,
    cv_document: null,
    cover_letter: null,
    applied_at: "2026-03-01T10:00:00Z",
  },
  {
    id: 2,
    status: "interview",
    ai_matching_score: 92,
    ai_feedback: null,
    hiring_recommendation: null,
    recommendation_note: null,
    recommendation_by_id: null,
    recommended_at: null,
    decision_by_id: null,
    decided_at: null,
    decision_reason: null,
    candidate: {
      id: 202,
      full_name: "Bob Tran",
      email: "bob@example.com",
      phone: null,
      avatar_url: null,
    },
    job_id: 101,
    resume_id: 302,
    resume: {
      file_url: null,
    },
    cv_document_id: null,
    cv_document: null,
    cover_letter: null,
    applied_at: "2026-03-02T10:00:00Z",
  },
];

describe("EmployerKanbanBoard", () => {
  it("renders 6 Kanban columns correctly", () => {
    render(
      <EmployerKanbanBoard
        applications={mockApplications}
        roundsMap={{}}
        selectedApplicationId={null}
        onSelectApplication={vi.fn()}
        onStatusChange={vi.fn()}
        onPreviewResume={vi.fn()}
        onPreviewBuilder={vi.fn()}
        canManagePipeline={true}
      />
    );

    expect(screen.getByTestId("kanban-column-pending")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-reviewed")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-shortlisted")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-interview")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-accepted")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-rejected")).toBeInTheDocument();

    expect(screen.getByText("Alice Nguyen")).toBeInTheDocument();
    expect(screen.getByText("Bob Tran")).toBeInTheDocument();
    expect(screen.getByText("85% MATCH")).toBeInTheDocument();
    expect(screen.getByText("92% MATCH")).toBeInTheDocument();
  });

  it("calls onSelectApplication when card is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <EmployerKanbanBoard
        applications={mockApplications}
        roundsMap={{}}
        selectedApplicationId={null}
        onSelectApplication={handleSelect}
        onStatusChange={vi.fn()}
        onPreviewResume={vi.fn()}
        onPreviewBuilder={vi.fn()}
        canManagePipeline={true}
      />
    );

    const cards = screen.getAllByTestId("kanban-card");
    await user.click(cards[0]);

    expect(handleSelect).toHaveBeenCalledWith(1);
  });

  it("advances status when quick action button is clicked", async () => {
    const user = userEvent.setup();
    const handleStatusChange = vi.fn().mockResolvedValue(undefined);

    render(
      <EmployerKanbanBoard
        applications={mockApplications}
        roundsMap={{}}
        selectedApplicationId={null}
        onSelectApplication={vi.fn()}
        onStatusChange={handleStatusChange}
        onPreviewResume={vi.fn()}
        onPreviewBuilder={vi.fn()}
        canManagePipeline={true}
      />
    );

    const quickBtn = screen.getByTitle("Chuyển sang: Duyệt CV");
    expect(quickBtn).toBeInTheDocument();

    await user.click(quickBtn);
    expect(handleStatusChange).toHaveBeenCalledWith(1, "reviewed");
  });
});

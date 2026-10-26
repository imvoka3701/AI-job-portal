import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  TalentSearchCommandBar,
  TalentStreamFeed,
  TalentDossierInspector,
  type CandidateGroup,
} from "@/components/employer/talent-search";

const mockCandidate: CandidateGroup = {
  id: "resume_101",
  candidateName: "Nguyễn Văn An",
  candidateEmail: "an.nguyen@example.com",
  userId: 1,
  documentType: "resume",
  documentId: 101,
  documentTitle: "CV_NguyenVanAn_Senior_Frontend.pdf",
  appliedJobId: 10,
  appliedJobTitle: "Senior Frontend Engineer",
  applicationStatus: "shortlisted",
  applicationId: 50,
  appliedAt: "2026-10-20",
  maxHybridScore: 0.88,
  maxDenseScore: 0.85,
  maxSparseScore: 0.90,
  allSkills: ["React", "TypeScript", "Tailwind CSS", "Zustand"],
  chunks: [
    {
      chunk_id: 1001,
      document_type: "resume",
      document_id: 101,
      section_type: "experience",
      chunk_index: 0,
      content: "3+ năm kinh nghiệm phát triển React, Next.js và Tailwind CSS tại công ty SaaS quy mô lớn.",
      dense_score: 0.85,
      sparse_score: 0.90,
      hybrid_score: 0.88,
      metadata: {
        skills: ["React", "TypeScript", "Tailwind CSS"],
      },
    },
    {
      chunk_id: 1002,
      document_type: "resume",
      document_id: 101,
      section_type: "skills",
      chunk_index: 1,
      content: "Thành thạo TypeScript, State Management với Zustand và tối ưu hiệu năng web.",
      dense_score: 0.82,
      sparse_score: 0.86,
      hybrid_score: 0.84,
      metadata: {
        skills: ["TypeScript", "Zustand"],
      },
    },
  ],
};

describe("TalentSearch Workspace Board Components", () => {
  it("renders TalentSearchCommandBar with view mode switcher and triggers mode change", () => {
    const handleViewModeChange = vi.fn();
    const handleSubmit = vi.fn();
    const handlePreset = vi.fn();

    render(
      <TalentSearchCommandBar
        searchQuery="React Frontend"
        setSearchQuery={vi.fn()}
        isLoading={false}
        onSubmit={handleSubmit}
        onClear={vi.fn()}
        onSelectPreset={handlePreset}
        jobs={[{ id: 10, title: "Senior Frontend Engineer" } as any]}
        selectedJobId={null}
        onJobChange={vi.fn()}
        selectedSection={null}
        onSectionChange={vi.fn()}
        selectedDocType="all"
        onDocTypeChange={vi.fn()}
        minScore={0.55}
        onMinScoreChange={vi.fn()}
        viewMode="split"
        onViewModeChange={handleViewModeChange}
      />
    );

    expect(screen.getByPlaceholderText(/Nhập tiêu chí nhân tài/i)).toBeInTheDocument();
    expect(screen.getByText("Tìm kiếm AI")).toBeInTheDocument();

    const gridBtn = screen.getByTitle(/Dạng lưới thẻ/i);
    expect(gridBtn).toBeInTheDocument();
    fireEvent.click(gridBtn);
    expect(handleViewModeChange).toHaveBeenCalledWith("grid");

    const presetBtn = screen.getByText("Frontend React & TS");
    fireEvent.click(presetBtn);
    expect(handlePreset).toHaveBeenCalled();
  });

  it("renders TalentStreamFeed and selects candidate", () => {
    const handleSelectCandidate = vi.fn();

    render(
      <TalentStreamFeed
        candidates={[mockCandidate]}
        selectedCandidateId={mockCandidate.id}
        onSelectCandidate={handleSelectCandidate}
      />
    );

    expect(screen.getByText("Nguyễn Văn An")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.getByText("Rất phù hợp")).toBeInTheDocument();

    const candidateCard = screen.getByText("Nguyễn Văn An").closest("div[class*='cursor-pointer']");
    expect(candidateCard).toBeInTheDocument();
    if (candidateCard) {
      fireEvent.click(candidateCard);
      expect(handleSelectCandidate).toHaveBeenCalledWith(mockCandidate);
    }
  });

  it("renders TalentDossierInspector with scores, chunks and action buttons", () => {
    const handleOpenCopilot = vi.fn();
    const handleOpenPreview = vi.fn();
    const handleCopyContent = vi.fn();

    render(
      <MemoryRouter>
        <TalentDossierInspector
          candidate={mockCandidate}
          activeChunkIndex={0}
          onSelectChunk={vi.fn()}
          onCopyContent={handleCopyContent}
          copiedChunkId={null}
          onOpenDocPreview={handleOpenPreview}
          isPreviewLoading={false}
          onOpenCopilot={handleOpenCopilot}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("88% Phù hợp tổng thể")).toBeInTheDocument();
    expect(screen.getAllByText("Kinh nghiệm làm việc")[0]).toBeInTheDocument();
    expect(
      screen.getByText(/3\+ năm kinh nghiệm phát triển React, Next\.js và Tailwind CSS/i)
    ).toBeInTheDocument();

    const copilotBtn = screen.getByRole("button", { name: /AI Copilot/i });
    fireEvent.click(copilotBtn);
    expect(handleOpenCopilot).toHaveBeenCalledWith(mockCandidate);

    const copyBtn = screen.getByText(/Sao chép trích đoạn/i);
    fireEvent.click(copyBtn);
    expect(handleCopyContent).toHaveBeenCalledWith(mockCandidate.chunks[0].content, 1001);
  });
});

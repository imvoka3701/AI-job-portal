import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AIMatchBadge } from "../JobUIHelpers";

describe("AIMatchBadge", () => {
  it("renders score and opens popover on click", () => {
    render(<AIMatchBadge score={88} />);
    expect(screen.getByText("88% MATCH")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /Xem giải thích độ phù hợp AI Match/i });
    fireEvent.click(button);

    expect(screen.getByText(/Chi tiết AI Matching/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Phù hợp cao/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders dynamic breakdown bars when breakdown prop is provided", () => {
    const breakdown = {
      skills_score: 92,
      experience_score: 80,
      domain_score: 85,
    };

    render(
      <AIMatchBadge
        score={86}
        breakdown={breakdown}
        explanation="Ứng viên có kỹ năng React và TypeScript xuất sắc"
      />
    );

    const button = screen.getByRole("button", { name: /Xem giải thích độ phù hợp AI Match/i });
    fireEvent.click(button);

    expect(screen.getByText("Kỹ năng chuyên môn")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("Kinh nghiệm thực tế")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Độ hiểu ngành (Domain)")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("Ứng viên có kỹ năng React và TypeScript xuất sắc")).toBeInTheDocument();
  });
});

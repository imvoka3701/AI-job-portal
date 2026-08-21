import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AISuggestionPanel } from "./AISuggestionPanel";

describe("AISuggestionPanel", () => {
  it("shows an inline error and retries without losing the section", () => {
    const retry = vi.fn();
    render(
      <AISuggestionPanel
        error="Dịch vụ AI phản hồi quá thời gian."
        suggestion={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
        onRetry={retry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Dịch vụ AI phản hồi quá thời gian.");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("supports accept, regenerate, and dismiss actions", () => {
    const accept = vi.fn();
    const retry = vi.fn();
    const dismiss = vi.fn();
    render(
      <AISuggestionPanel
        error={null}
        suggestion={{ text: "Gợi ý nội dung", rationale: "Phù hợp vị trí mục tiêu" }}
        onAccept={accept}
        onDismiss={dismiss}
        onRetry={retry}
      />,
    );

    expect(screen.getByText("Gợi ý nội dung")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chèn vào CV" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo lại" }));
    fireEvent.click(screen.getByRole("button", { name: "Bỏ qua" }));
    expect(accept).toHaveBeenCalledOnce();
    expect(retry).toHaveBeenCalledOnce();
    expect(dismiss).toHaveBeenCalledOnce();
  });
});

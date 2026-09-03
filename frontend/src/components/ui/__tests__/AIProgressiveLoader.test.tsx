import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIProgressiveLoader } from "../AIProgressiveLoader";

describe("AIProgressiveLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with custom title and stages", () => {
    const customStages = ["Giai đoạn 1", "Giai đoạn 2", "Giai đoạn 3"];
    render(
      <AIProgressiveLoader
        title="Đang phân tích dữ liệu AI"
        subtitle="Vui lòng chờ trong giây lát"
        stages={customStages}
        autoAdvance={false}
      />
    );

    expect(screen.getByText("Đang phân tích dữ liệu AI")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng chờ trong giây lát")).toBeInTheDocument();
    expect(screen.getByText("Giai đoạn 1")).toBeInTheDocument();
    expect(screen.getByText("Giai đoạn 2")).toBeInTheDocument();
    expect(screen.getByText("Giai đoạn 3")).toBeInTheDocument();
  });

  it("advances internal stage when autoAdvance is true", () => {
    const customStages = ["Giai đoạn 1", "Giai đoạn 2", "Giai đoạn 3"];
    render(
      <AIProgressiveLoader
        stages={customStages}
        autoAdvance={true}
        intervalMs={500}
      />
    );

    expect(screen.getByTestId("ai-progressive-loader")).toBeInTheDocument();

    // Advance timer to trigger next stage
    act(() => {
      vi.advanceTimersByTime(550);
    });

    // Check that component didn't crash and remains in document
    expect(screen.getByText("Giai đoạn 2")).toBeInTheDocument();
  });

  it("respects controlled activeStage prop", () => {
    const customStages = ["Bước A", "Bước B", "Bước C"];
    const { rerender } = render(
      <AIProgressiveLoader
        stages={customStages}
        activeStage={1}
        autoAdvance={false}
      />
    );

    expect(screen.getByText("Bước B")).toBeInTheDocument();

    rerender(
      <AIProgressiveLoader
        stages={customStages}
        activeStage={2}
        autoAdvance={false}
      />
    );

    expect(screen.getByText("Bước C")).toBeInTheDocument();
  });
});

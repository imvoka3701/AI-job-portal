import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ErrorState } from "../ErrorState";

describe("ErrorState", () => {
  it("renders error state with title and message", () => {
    render(
      <ErrorState
        title="Lỗi tải dữ liệu"
        message="Máy chủ đang bảo trì."
      />
    );

    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Lỗi tải dữ liệu")).toBeInTheDocument();
    expect(screen.getByText("Máy chủ đang bảo trì.")).toBeInTheDocument();
  });

  it("calls onRetry callback when retry button is clicked", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(
      <ErrorState
        title="Lỗi mạng"
        message="Không thể kết nối internet."
        onRetry={handleRetry}
      />
    );

    const retryBtn = screen.getByRole("button", { name: /thử lại/i });
    expect(retryBtn).toBeInTheDocument();

    await user.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders default empty state with title and description", () => {
    render(
      <EmptyState
        title="Chưa có dữ liệu"
        description="Vui lòng tạo mục mới để bắt đầu."
      />
    );

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng tạo mục mới để bắt đầu.")).toBeInTheDocument();
  });

  it("renders custom icon and action button", () => {
    render(
      <EmptyState
        icon={<span data-testid="custom-icon">Icon</span>}
        title="Không tìm thấy việc làm"
        action={<button data-testid="cta-btn">Thêm mới</button>}
      />
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.getByTestId("cta-btn")).toBeInTheDocument();
  });
});

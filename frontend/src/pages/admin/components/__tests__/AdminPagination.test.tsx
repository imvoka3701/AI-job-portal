import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AdminPagination } from "../AdminPagination";

describe("AdminPagination", () => {
  it("renders null when total is 0", () => {
    const { container } = render(
      <AdminPagination
        page={1}
        pageSize={20}
        total={0}
        unitName="người dùng"
        onPageChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders accurate range and page calculations on page 1 of 2", () => {
    render(
      <AdminPagination
        page={1}
        pageSize={20}
        total={25}
        unitName="người dùng"
        onPageChange={vi.fn()}
      />
    );

    const pagination = screen.getByTestId("admin-pagination");
    expect(pagination).toBeInTheDocument();
    expect(pagination).toHaveTextContent("Hiển thị 1 - 20 trong tổng số 25 người dùng — Trang 1 / 2");

    // Prev should be disabled, Next should be enabled
    const prevBtn = screen.getByRole("button", { name: "Trang trước" });
    const nextBtn = screen.getByRole("button", { name: "Trang sau" });
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();
  });

  it("renders accurate range on last page", () => {
    render(
      <AdminPagination
        page={2}
        pageSize={20}
        total={25}
        unitName="người dùng"
        onPageChange={vi.fn()}
      />
    );

    const pagination = screen.getByTestId("admin-pagination");
    expect(pagination).toBeInTheDocument();
    expect(pagination).toHaveTextContent("Hiển thị 21 - 25 trong tổng số 25 người dùng — Trang 2 / 2");

    const prevBtn = screen.getByRole("button", { name: "Trang trước" });
    const nextBtn = screen.getByRole("button", { name: "Trang sau" });
    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeDisabled();
  });

  it("handles page navigation clicks", () => {
    const onPageChange = vi.fn();
    render(
      <AdminPagination
        page={2}
        pageSize={10}
        total={30}
        unitName="tin tuyển dụng"
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Trang trước" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("auto-clamps to page 1 if current page exceeds totalPages", () => {
    const onPageChange = vi.fn();
    render(
      <AdminPagination
        page={3}
        pageSize={20}
        total={15}
        unitName="người dùng"
        onPageChange={onPageChange}
      />
    );

    // 15 items with pageSize 20 -> totalPages = 1. Current page is 3 -> triggers clamp to 1
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

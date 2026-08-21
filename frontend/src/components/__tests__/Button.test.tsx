import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders with children text", () => {
    render(<Button>Đăng ký</Button>);
    expect(screen.getByRole("button", { name: "Đăng ký" })).toBeInTheDocument();
  });

  it("shows loading spinner when isLoading", () => {
    render(<Button isLoading>Đang xử lý</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Đang xử lý")).toBeInTheDocument();
  });

  it("renders primary variant as default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-primary");
  });

  it("renders destructive variant", () => {
    render(<Button variant="destructive">Xóa</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-red-600");
  });

  it("supports disabled state", () => {
    render(<Button disabled>Không bấm được</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("supports fullWidth", () => {
    render(<Button fullWidth>Rộng</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("w-full");
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders with children text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders success variant with green classes", () => {
    render(<Badge variant="success">Thành công</Badge>);
    const badge = screen.getByText("Thành công");
    expect(badge.className).toContain("bg-green-50");
  });

  it("renders danger variant with red classes", () => {
    render(<Badge variant="danger">Lỗi</Badge>);
    const badge = screen.getByText("Lỗi");
    expect(badge.className).toContain("bg-red-50");
  });

  it("renders primary variant with design tokens", () => {
    render(<Badge variant="primary">Chính</Badge>);
    const badge = screen.getByText("Chính");
    expect(badge.className).toContain("bg-primary-light");
  });

  it("renders dot indicator", () => {
    const { container } = render(<Badge dot>Online</Badge>);
    // dot creates a span with aria-hidden
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });

  it("supports size variants", () => {
    render(<Badge size="lg">Lớn</Badge>);
    const badge = screen.getByText("Lớn");
    expect(badge.className).toContain("text-sm");
  });
});

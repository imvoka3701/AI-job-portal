import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card><p>Nội dung card</p></Card>);
    expect(screen.getByText("Nội dung card")).toBeInTheDocument();
  });

  it("applies selected styles when selected", () => {
    render(<Card selected><p>Selected</p></Card>);
    const container = screen.getByText("Selected").parentElement!;
    expect(container.className).toContain("ring-2");
  });

  it("CardHeader renders with title and description", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Tiêu đề</CardTitle>
          <p>Mô tả</p>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText("Tiêu đề")).toBeInTheDocument();
    expect(screen.getByText("Mô tả")).toBeInTheDocument();
  });

  it("CardContent renders children", () => {
    render(
      <Card>
        <CardContent>
          <p>Body text</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FloatingFeedbackButton } from "../FloatingFeedbackButton";
import * as feedbackApi from "@/lib/api/feedback";

vi.mock("@/lib/api/feedback", () => ({
  submitFeedback: vi.fn(),
}));

vi.mock("@/stores/authStore", () => ({
  useUser: () => ({
    id: 1,
    full_name: "Test Candidate",
    email: "candidate@example.com",
    role: "candidate",
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("FloatingFeedbackButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders on normal non-admin routes", () => {
    render(
      <MemoryRouter initialEntries={["/jobs"]}>
        <FloatingFeedbackButton />
      </MemoryRouter>
    );

    const btn = screen.getByRole("button", { name: /Đóng góp ý kiến hoặc báo lỗi/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText("Góp ý & Báo lỗi")).toBeInTheDocument();
  });

  it("does not render on /admin routes", () => {
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <FloatingFeedbackButton />
      </MemoryRouter>
    );

    expect(screen.queryByText("Góp ý & Báo lỗi")).not.toBeInTheDocument();
  });

  it("opens feedback modal and displays auto-captured URL context", async () => {
    render(
      <MemoryRouter initialEntries={["/employer/talent-search"]}>
        <FloatingFeedbackButton />
      </MemoryRouter>
    );

    const btn = screen.getByRole("button", { name: /Đóng góp ý kiến hoặc báo lỗi/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText("Đóng Góp Ý Kiến & Báo Lỗi")).toBeInTheDocument();
      expect(screen.getByText("Ngữ cảnh tự động")).toBeInTheDocument();
      expect(screen.getByText("/employer/talent-search")).toBeInTheDocument();
    });
  });

  it("submits feedback with auto-enriched context", async () => {
    vi.mocked(feedbackApi.submitFeedback).mockResolvedValue({
      id: 99,
      user_id: 1,
      user_role: "candidate",
      sender_name: "Test Candidate",
      sender_email: "candidate@example.com",
      feedback_type: "general",
      title: "Giao diện rất mượt",
      content: "Tôi thấy trang tìm việc rất tiện lợi.",
      status: "new",
      priority: "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    render(
      <MemoryRouter initialEntries={["/jobs/123"]}>
        <FloatingFeedbackButton />
      </MemoryRouter>
    );

    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /Đóng góp ý kiến hoặc báo lỗi/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ví dụ: Gợi ý CV chưa chuẩn/i)).toBeInTheDocument();
    });

    // Fill Title and Content
    fireEvent.change(screen.getByPlaceholderText(/Ví dụ: Gợi ý CV chưa chuẩn/i), {
      target: { value: "Trang hiển thị việc làm rất tốt" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Mô tả cụ thể trải nghiệm hoặc lỗi/i), {
      target: { value: "Nội dung mô tả chi tiết từ ứng viên." },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Gửi phản hồi/i }));

    await waitFor(() => {
      expect(feedbackApi.submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          sender_name: "Test Candidate",
          sender_email: "candidate@example.com",
          title: "Trang hiển thị việc làm rất tốt",
          target_id: "/jobs/123",
          target_type: "page",
        })
      );
    });
  });
});

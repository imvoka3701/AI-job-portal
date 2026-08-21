import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailDraftModal } from "./EmailDraftModal";

const result = {
  subject: "Mời phỏng vấn vị trí Backend Engineer",
  body: "Chào bạn An,\n\nChúng tôi mời bạn tham gia buổi phỏng vấn vào ngày mai.\n\nTrân trọng.",
};

const baseProps = {
  candidateName: "Nguyễn Văn An",
  isOpen: true,
  result,
  loading: false,
  error: null,
  onRetry: vi.fn(),
  onClose: vi.fn(),
};

describe("EmailDraftModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("edits and copies the reviewed draft instead of the original AI text", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<EmailDraftModal {...baseProps} />);

    const subject = screen.getByLabelText("Tiêu đề email");
    const body = screen.getByLabelText("Nội dung email");
    await user.clear(subject);
    await user.type(subject, "Lịch phỏng vấn kỹ thuật");
    await user.clear(body);
    await user.type(body, "Chào bạn An, lịch phỏng vấn được cập nhật lúc 09:00.");

    expect(screen.getByText("Bạn đang dùng phiên bản đã chỉnh sửa.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Sao chép email" }));

    expect(writeText).toHaveBeenCalledWith(
      "Tiêu đề: Lịch phỏng vấn kỹ thuật\n\nChào bạn An, lịch phỏng vấn được cập nhật lúc 09:00.",
    );
    expect(screen.getByRole("button", { name: "Đã sao chép" })).toBeVisible();
  });

  it("restores the original AI draft after local edits", async () => {
    const user = userEvent.setup();
    render(<EmailDraftModal {...baseProps} />);

    const subject = screen.getByLabelText("Tiêu đề email");
    await user.clear(subject);
    await user.type(subject, "Tiêu đề đã sửa");
    await user.click(screen.getByRole("button", { name: "Khôi phục bản AI" }));

    expect(subject).toHaveValue(result.subject);
    expect(screen.getByLabelText("Nội dung email")).toHaveValue(result.body);
    expect(screen.getByText("Nội dung đang giữ nguyên bản AI.")).toBeVisible();
  });

  it("keeps the modal open and exposes retry when generation fails", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <EmailDraftModal
        {...baseProps}
        result={null}
        error="AI provider đang tạm thời không khả dụng."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("AI provider đang tạm thời không khả dụng.");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

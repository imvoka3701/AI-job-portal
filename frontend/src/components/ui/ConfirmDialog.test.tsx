import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("runs the confirmed action and closes after success", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Xác nhận thay đổi"
        description="Thay đổi có hiệu lực ngay."
        confirmLabel="Tiếp tục"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the dialog open and shows an error when the action fails", async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Tạm khóa thành viên"
        description="Quyền sẽ bị thu hồi."
        variant="destructive"
        onClose={onClose}
        onConfirm={() => Promise.reject(new Error("network"))}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Dữ liệu trước đó vẫn được giữ nguyên");
    expect(onClose).not.toHaveBeenCalled();
  });
});

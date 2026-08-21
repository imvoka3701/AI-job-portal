import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificationBell } from "@/components/ui/NotificationBell";

// Mock the API calls
vi.mock("@/lib/api/notifications", () => ({
  getMyNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

// Mock auth store
vi.mock("@/stores/authStore", () => ({
  useIsAuthenticated: () => true,
}));

import * as notifApi from "@/lib/api/notifications";

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notifApi.getUnreadCount).mockResolvedValue(0);
    vi.mocked(notifApi.getMyNotifications).mockResolvedValue([]);
  });

  it("renders bell icon", async () => {
    renderBell();
    await waitFor(() => {
      expect(screen.getByLabelText("Thông báo")).toBeInTheDocument();
    });
  });

  it("shows badge when unread count > 0", async () => {
    vi.mocked(notifApi.getUnreadCount).mockResolvedValue(5);
    renderBell();
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("shows empty state when no notifications", async () => {
    vi.mocked(notifApi.getUnreadCount).mockResolvedValue(0);
    vi.mocked(notifApi.getMyNotifications).mockResolvedValue([]);
    renderBell();
    const bell = screen.getByLabelText("Thông báo");
    await userEvent.click(bell);
    await waitFor(() => {
      expect(screen.getByText("Chưa có thông báo nào.")).toBeInTheDocument();
    });
  });

  it("shows notifications in dropdown", async () => {
    vi.mocked(notifApi.getUnreadCount).mockResolvedValue(2);
    vi.mocked(notifApi.getMyNotifications).mockResolvedValue([
      {
        id: 1,
        title: "Ứng viên mới",
        message: "Nguyen Van A đã ứng tuyển",
        type: "application_update",
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Cập nhật trạng thái",
        message: "Đơn ứng tuyển đã được xem",
        type: "application_update",
        is_read: true,
        created_at: new Date().toISOString(),
      },
    ]);
    renderBell();
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
    const bell = screen.getByLabelText("Thông báo");
    await userEvent.click(bell);
    await waitFor(() => {
      expect(screen.getByText("Ứng viên mới")).toBeInTheDocument();
      expect(screen.getByText("Cập nhật trạng thái")).toBeInTheDocument();
    });
  });
});

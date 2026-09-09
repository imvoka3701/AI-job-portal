import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificationBell } from "@/components/ui/NotificationBell";
import type { WebSocketNotificationPayload } from "@/hooks/useWebSocketNotifications";

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
  useAuthStore: (selector: (state: { token: string }) => unknown) => selector({ token: "fake-jwt-token" }),
}));

// Mock WebSocket Notifications hook
let capturedWsCallback: ((payload: WebSocketNotificationPayload) => void) | undefined;

vi.mock("@/hooks/useWebSocketNotifications", () => ({
  useWebSocketNotifications: (opts?: { onNotification?: (p: WebSocketNotificationPayload) => void }) => {
    capturedWsCallback = opts?.onNotification;
    return {
      isConnected: true,
      lastNotification: null,
    };
  },
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
    capturedWsCallback = undefined;
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
      expect(screen.getByText(/chưa có thông báo nào/i)).toBeInTheDocument();
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

  it("dynamically increases unread count and displays live notification on WebSocket event", async () => {
    vi.mocked(notifApi.getUnreadCount).mockResolvedValue(0);
    vi.mocked(notifApi.getMyNotifications).mockResolvedValue([]);
    renderBell();

    expect(capturedWsCallback).toBeDefined();

    // 1. Open dropdown first while empty
    const bell = screen.getByLabelText("Thông báo");
    await userEvent.click(bell);
    await waitFor(() => {
      expect(screen.getByText(/chưa có thông báo nào/i)).toBeInTheDocument();
    });

    // 2. Trigger live WebSocket push
    act(() => {
      capturedWsCallback?.({
        id: 99,
        title: "Lịch phỏng vấn mới",
        message: "HR vừa xếp lịch phỏng vấn Vòng Kỹ Thuật",
        notif_type: "interview_scheduled",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    });

    // 3. Badge should immediately show '1'
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    // 4. Notification should immediately be visible in open dropdown
    await waitFor(() => {
      expect(screen.getByText("Lịch phỏng vấn mới")).toBeInTheDocument();
      expect(screen.getByText("HR vừa xếp lịch phỏng vấn Vòng Kỹ Thuật")).toBeInTheDocument();
    });
  });
});

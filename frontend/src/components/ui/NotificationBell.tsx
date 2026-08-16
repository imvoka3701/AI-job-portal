import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/lib/api/notifications";
import { useIsAuthenticated } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

export function NotificationBell() {
  const isAuthenticated = useIsAuthenticated();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Fetch unread count ───────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(() => {
    if (!isAuthenticated) return;
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [isAuthenticated]);

  // ── Fetch notifications when dropdown opens ──────────────────────────────
  const openDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen && isAuthenticated) {
      setLoading(true);
      getMyNotifications(0, 10)
        .then((data) => {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.is_read).length);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, isAuthenticated]);

  // ── Poll unread count ────────────────────────────────────────────────────
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notification-bell]")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isOpen]);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" data-notification-bell>
      {/* Bell button */}
      <button
        type="button"
        onClick={openDropdown}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full transition-colors relative",
          "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
          isOpen && "bg-gray-100 text-gray-700",
        )}
        aria-label="Thông báo"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
            {notifications.some((n) => !n.is_read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary-hover font-medium"
              >
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" color="green" label="Đang tải thông báo..." />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">Chưa có thông báo nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer",
                    !n.is_read && "bg-primary-soft",
                  )}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread dot */}
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer link */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <Link
                to="/dashboard"
                className="text-xs text-primary hover:text-primary-hover font-medium"
                onClick={() => setIsOpen(false)}
              >
                Xem tất cả
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CalendarCheck,
  Briefcase,
  CheckCircle2,
  Sparkles,
  CheckCheck,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/lib/api/notifications";
import { useIsAuthenticated } from "@/stores/authStore";
import {
  useWebSocketNotifications,
  type WebSocketNotificationPayload,
} from "@/hooks/useWebSocketNotifications";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

export function NotificationBell() {
  const isAuthenticated = useIsAuthenticated();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);

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
      getMyNotifications(0, 15)
        .then((data) => {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.is_read).length);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, isAuthenticated]);

  // ── Real-time WebSocket Notifications handler ─────────────────────────────
  const handleLiveNotification = useCallback((liveNotif: WebSocketNotificationPayload) => {
    // 1. Increment unread count
    setUnreadCount((prev) => prev + 1);

    // 2. Trigger bell shake animation
    setHasNewAlert(true);
    setTimeout(() => setHasNewAlert(false), 2000);

    // 3. Prepend to local notifications list
    const newItem: NotificationItem = {
      id: liveNotif.id,
      title: liveNotif.title,
      message: liveNotif.message,
      type: liveNotif.notif_type,
      is_read: false,
      created_at: liveNotif.created_at || new Date().toISOString(),
    };
    setNotifications((prev) => [newItem, ...prev.filter((n) => n.id !== liveNotif.id).slice(0, 14)]);

    // 4. Fire Sonner real-time Toast notification
    toast(liveNotif.title, {
      description: liveNotif.message,
      duration: 5000,
      icon: getNotificationIcon(liveNotif.notif_type, "w-4 h-4 text-emerald-600"),
    });
  }, []);

  const { isConnected } = useWebSocketNotifications({
    onNotification: handleLiveNotification,
  });

  // ── Initial & periodic sync for offline catch-up ─────────────────────────
  useEffect(() => {
    fetchUnreadCount();
    // Periodic fallback every 60s
    const interval = setInterval(fetchUnreadCount, 60_000);
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
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
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
          "w-10 h-10 flex items-center justify-center rounded-full transition-all relative group",
          "text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
          isOpen && "bg-gray-100 text-gray-700",
        )}
        aria-label="Thông báo"
      >
        <motion.div
          animate={hasNewAlert ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Bell className="w-5 h-5 transition-transform group-hover:scale-105" />
        </motion.div>

        {/* Live connected pulse dot */}
        {isConnected && (
          <span
            className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
            title="Đã kết nối trực tiếp thời gian thực"
          />
        )}

        {/* Unread badge with Framer Motion pop-in */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none shadow-sm"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Polling
                  </span>
                )}
              </div>
              {notifications.some((n) => !n.is_read) && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[65vh] overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Spinner size="md" color="green" label="Đang tải thông báo..." />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Chưa có thông báo nào</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Các cập nhật lịch phỏng vấn và trạng thái hồ sơ sẽ xuất hiện tại đây
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer group",
                      !n.is_read && "bg-emerald-50/40 border-l-2 border-emerald-500",
                    )}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Context icon */}
                      <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-white border border-gray-200/80 shadow-xs group-hover:border-emerald-200 transition-colors">
                        {getNotificationIcon(n.type, "w-4 h-4 text-emerald-600")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(n.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer link */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 text-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium py-1 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Xem bảng điều khiển
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getNotificationIcon(type: string, className = "w-4 h-4") {
  switch (type) {
    case "interview_scheduled":
    case "interview_updated":
    case "interview_cancelled":
      return <CalendarCheck className={className} />;
    case "status_update":
      return <CheckCircle2 className={className} />;
    case "new_application":
      return <Briefcase className={className} />;
    case "ai_match":
      return <Sparkles className={className} />;
    default:
      return <Bell className={className} />;
  }
}

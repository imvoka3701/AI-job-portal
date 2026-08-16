/**
 * Notifications API service.
 */
import { apiClient } from "@/lib/axios";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Get my notifications (newest first).
 * GET /notifications
 */
export async function getMyNotifications(
  skip = 0,
  limit = 20,
): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<NotificationItem[]>("/notifications", {
    params: { skip, limit },
  });
  return data;
}

/**
 * Get unread notification count.
 * GET /notifications/unread-count
 */
export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>(
    "/notifications/unread-count",
  );
  return data.count;
}

/**
 * Mark a notification as read.
 * PATCH /notifications/{id}/read
 */
export async function markNotificationRead(
  id: number,
): Promise<NotificationItem> {
  const { data } = await apiClient.patch<NotificationItem>(
    `/notifications/${id}/read`,
  );
  return data;
}

/**
 * Mark all notifications as read.
 * PATCH /notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}

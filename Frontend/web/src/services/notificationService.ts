import { apiClient } from "../lib/api";
import { NotificationItem } from "../context/SocketContext";

interface GetNotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    unreadCount: number;
  };
}

export async function getNotificationsApi(): Promise<NotificationItem[]> {
  try {
    const res = await apiClient.get<GetNotificationsResponse>("/notifications");
    return res.data?.notifications || [];
  } catch (error) {
    console.warn("Failed to fetch notifications from API:", error);
    return [];
  }
}

export async function markNotificationReadApi(id: string): Promise<void> {
  try {
    await apiClient.patch(`/notifications/${id}/read`);
  } catch (error) {
    console.warn(`Failed to mark notification ${id} as read:`, error);
  }
}

export async function markAllNotificationsReadApi(): Promise<void> {
  try {
    await apiClient.post("/notifications/read-all");
  } catch (error) {
    console.warn("Failed to mark all notifications as read:", error);
  }
}

export async function clearAllNotificationsApi(): Promise<void> {
  try {
    await apiClient.delete("/notifications");
  } catch (error) {
    console.warn("Failed to clear notifications:", error);
  }
}

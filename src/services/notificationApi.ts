import { apiClient } from "@/lib/apiClient";
import type { Notification } from "@/types";

export async function listNotifications(): Promise<Notification[]> {
  const res = await apiClient.get<Notification[]>("/notifications");
  return res.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

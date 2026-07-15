/**
 * Notifications API service (section 16 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { AppNotification, NotificationType, PaginatedData } from "@/types/domain";

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface BroadcastBody {
  userIds?: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export const notificationsService = {
  list: (query?: NotificationListQuery) =>
    http.get<PaginatedData<AppNotification>>(ENDPOINTS.notifications.list, query),

  unreadCount: () =>
    http.get<{ count: number }>(ENDPOINTS.notifications.unreadCount),

  readAll: () => http.patch<void>(ENDPOINTS.notifications.readAll),

  read: (id: string) => http.patch<void>(ENDPOINTS.notifications.read(id)),

  delete: (id: string) => http.delete<void>(ENDPOINTS.notifications.byId(id)),

  broadcast: (body: BroadcastBody) =>
    http.post<{ sentCount: number }>(ENDPOINTS.notifications.broadcast, body),
};

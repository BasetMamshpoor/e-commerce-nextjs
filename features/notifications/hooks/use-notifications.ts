"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { notificationsService } from "@/services";
import type { NotificationListQuery } from "@/types/domain";
import { ApiError } from "@/types/api";
import type {
  AppNotification,
  PaginatedData,
} from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

/** User notifications (paginated). */
export function useNotifications(query?: NotificationListQuery) {
  return useQuery<PaginatedData<AppNotification>>({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "list", query ?? {}],
    queryFn: () =>
      notificationsService.list({ limit: APP_CONFIG.defaultPageSize, ...query }),
    staleTime: 30 * 1000,
  });
}

/** Unread count (for header badge). Polls every 60s. */
export function useUnreadNotificationsCount() {
  return useQuery<{ count: number }>({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread-count"],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

/** Mark a single notification as read. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsService.read(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueriesData<PaginatedData<AppNotification>>({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      });
      queryClient.setQueriesData<PaginatedData<AppNotification>>(
        { queryKey: NOTIFICATIONS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((n) =>
              n.id === id ? { ...n, isRead: true } : n,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        for (const [key, data] of ctx.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread-count"] });
    },
  });
}

/** Mark all notifications as read. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.readAll(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueriesData<PaginatedData<AppNotification>>({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      });
      queryClient.setQueriesData<PaginatedData<AppNotification>>(
        { queryKey: NOTIFICATIONS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((n) => ({ ...n, isRead: true })),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _void, ctx) => {
      if (ctx?.previous) {
        for (const [key, data] of ctx.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread-count"] });
    },
    onSuccess: () => {
      toast.success("همه نوتیفیکیشن‌ها خوانده شدند");
    },
  });
}

/** Delete a notification. */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueriesData<PaginatedData<AppNotification>>({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      });
      queryClient.setQueriesData<PaginatedData<AppNotification>>(
        { queryKey: NOTIFICATIONS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((n) => n.id !== id),
            meta: {
              ...old.meta,
              total: Math.max(0, old.meta.total - 1),
            },
          };
        },
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        for (const [key, data] of ctx.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("حذف ناموفق بود");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread-count"] });
    },
  });
}

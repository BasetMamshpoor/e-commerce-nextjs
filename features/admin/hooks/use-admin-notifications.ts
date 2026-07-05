"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminNotificationsService } from "@/services";
import { ApiError } from "@/types/api";

export const ADMIN_NOTIFICATIONS_QUERY_KEY = ["admin", "notifications"] as const;

export function useAdminNotifications(params?: { page?: number; limit?: number; isRead?: boolean }) {
  return useQuery({
    queryKey: [...ADMIN_NOTIFICATIONS_QUERY_KEY, params ?? {}],
    queryFn: () => adminNotificationsService.list(params),
  });
}

export function useAdminUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: [...ADMIN_NOTIFICATIONS_QUERY_KEY, "unread-count"],
    queryFn: () => adminNotificationsService.unreadCount(),
    refetchInterval: 60 * 1000,
  });
}

export function useReadAdminNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminNotificationsService.read(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_QUERY_KEY });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "خطا در علامت‌گذاری اعلان");
    },
  });
}

export function useReadAllAdminNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminNotificationsService.readAll(),
    onSuccess: () => {
      toast.success("همه اعلان‌ها خوانده شدند");
      queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_QUERY_KEY });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "خطا در علامت‌گذاری همه اعلان‌ها");
    },
  });
}

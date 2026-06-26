"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "@/services";
import { useAuth } from "@/providers/auth-context";
import { clearTokens } from "@/lib/api-client";

/**
 * Logout from current device (revokes only the current session).
 * Then clears local tokens + user state and redirects to home.
 */
export function useLogout() {
  const { clearLocalSession } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearLocalSession();
      queryClient.clear();
      toast.success("از حساب خود خارج شدید");
      router.replace("/");
      router.refresh();
    },
    onError: () => {
      // Even if logout API fails (e.g. token already expired), clear local state.
      clearTokens();
      clearLocalSession();
      queryClient.clear();
      router.replace("/");
      router.refresh();
    },
  });
}

/**
 * Logout from ALL devices (revokes every other session for this user).
 * The current session stays active.
 */
export function useLogoutAll() {
  const { clearLocalSession } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: () => {
      // Backend revoked all OTHER sessions; we still have this one.
      toast.success("از تمام دستگاه‌های دیگر خارج شدید");
      queryClient.invalidateQueries();
    },
    onError: () => {
      // On error, fully log out to be safe.
      clearTokens();
      clearLocalSession();
      queryClient.clear();
      toast.error("خطا در خروج از سایر دستگاه‌ها؛ از این دستگاه خارج شدید");
      router.replace("/");
      router.refresh();
    },
  });
}

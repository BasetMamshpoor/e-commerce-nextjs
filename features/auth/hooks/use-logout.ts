"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

/**
 * Logout via NextAuth — clears the JWT session.
 * Optionally calls backend /auth/logout to invalidate the server session.
 *
 * Returns a mutation-like interface for backwards compatibility:
 *   const logout = useLogout();
 *   logout.mutate();
 *   logout.isPending;
 */
export function useLogout() {
  return useLogoutBase(false);
}

/** Logout from ALL devices — calls /auth/logout-all. */
export function useLogoutAll() {
  return useLogoutBase(true);
}

function useLogoutBase(logoutAll: boolean) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const mutate = React.useCallback(
    async (options?: { redirectTo?: string }) => {
      const redirectTo = options?.redirectTo ?? "/login";
      setIsPending(true);

      try {
        const { http } = await import("@/lib/api-client");
        const { ENDPOINTS } = await import("@/api/endpoints");
        if (logoutAll) {
          await http.post(ENDPOINTS.auth.logoutAll).catch(() => {});
        } else {
          await http.post(ENDPOINTS.auth.logout).catch(() => {});
        }
      } catch {
        // Ignore — client-side signOut is the source of truth.
      }

      await signOut({ redirect: false });
      toast.success("خروج موفقیت‌آمیز بود");
      router.push(redirectTo);
      router.refresh();
      setIsPending(false);
    },
    [router, logoutAll],
  );

  return { mutate, isPending };
}

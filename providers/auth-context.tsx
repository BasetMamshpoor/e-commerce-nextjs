"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import type { User } from "@/types/domain";

/**
 * Compatibility wrapper around NextAuth's useSession.
 * Provides the same interface as the old auth-context so existing
 * components (AuthGuard, Header, AdminSidebar, etc.) work unchanged.
 */
export function useAuth() {
  const { data: session, status, update } = useSession();

  const user = (session?.user as unknown as User | undefined) ?? null;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    /** NextAuth signIn — triggers the credentials provider. */
    signIn,
    /** NextAuth signOut — clears the JWT session. */
    signOut,
    /** Force session refresh (re-runs jwt callback → may refresh access token). */
    refreshSession: update,
    /** No-op — kept for backwards compatibility. User is managed by NextAuth. */
    setUser: (_user: User | null) => {
      // NextAuth manages the user state. Call update() to refresh.
      update();
    },
    /** No-op — NextAuth manages session clearing via signOut(). */
    clearLocalSession: () => {
      signOut({ redirect: false });
    },
  };
}

"use client";

import * as React from "react";

import {
  clearTokens,
  getCachedUser,
  getAccessToken,
  hydrateSession,
  persistSession,
  setTokens,
  subscribeTokens,
} from "@/lib/api-client";
import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { AuthSession, User } from "@/types/domain";

/* ──────────────────────────────────────────────────────────────────────────
   Context shape
   ────────────────────────────────────────────────────────────────────────── */

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;          // True during initial hydration / fetch-me
  isAuthenticated: boolean;
  /** Update local user state (e.g. after profile edits). */
  setUser: (user: User | null) => void;
  /** Persist tokens+user from a login/register/verify-otp response. */
  applySession: (session: AuthSession) => void;
  /** Clear local session (does NOT call /auth/logout — caller does that). */
  clearLocalSession: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/* ──────────────────────────────────────────────────────────────────────────
   Provider
   ────────────────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<User | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Initial hydration: read tokens from localStorage; if we have an AT, fetch /me.
  React.useEffect(() => {
    const tokens = hydrateSession();
    if (!tokens.accessToken) {
      setIsLoading(false);
      return;
    }
    // Try to fetch /users/me to verify session is still valid.
    http
      .get<User>(ENDPOINTS.usersMe.get)
      .then((u) => setUserState(u))
      .catch(() => {
        // 401 already handled by interceptor (tokens cleared); just sync state.
        setUserState(null);
      })
      .finally(() => setIsLoading(false));

    // Listen for forced session-expiry events dispatched by the axios layer.
    const onExpired = () => setUserState(null);
    window.addEventListener("auth:session-expired", onExpired);
    return () => window.removeEventListener("auth:session-expired", onExpired);
  }, []);

  // Keep user state in sync if tokens are externally cleared (e.g. by interceptor).
  React.useEffect(() => {
    return subscribeTokens((t) => {
      if (!t.accessToken) setUserState(null);
    });
  }, []);

  const setUser = React.useCallback((u: User | null) => {
    setUserState(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem("sf_user", JSON.stringify(u));
      else localStorage.removeItem("sf_user");
    }
  }, []);

  const applySession = React.useCallback((session: AuthSession) => {
    persistSession(session);
    setUserState(session.user);
  }, []);

  const clearLocalSession = React.useCallback(() => {
    clearTokens();
    setUserState(null);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !!getAccessToken(),
      setUser,
      applySession,
      clearLocalSession,
    }),
    [user, isLoading, setUser, applySession, clearLocalSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ──────────────────────────────────────────────────────────────────────────
   Hook
   ────────────────────────────────────────────────────────────────────────── */

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

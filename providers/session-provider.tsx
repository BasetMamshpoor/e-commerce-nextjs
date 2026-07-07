"use client";

import * as React from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";

import { setAccessToken } from "@/lib/api-client";

/** Extended session type — includes accessToken and error from our jwt callback. */
type ExtendedSession = {
  user?: unknown;
  accessToken?: string;
  error?: string;
};

/**
 * Syncs the NextAuth session's access token to the axios client.
 * Also listens for 401 events and forces a session refresh.
 *
 * This is the core of the auto-refresh mechanism:
 *   1. NextAuth's jwt callback (in auth.ts) checks token expiry on every
 *      session access and refreshes via /auth/refresh-token automatically.
 *   2. This component syncs the fresh accessToken to the axios interceptor
 *      so all API calls use the latest token.
 *   3. On 401 from any API call, we dispatch "auth:token-expired" → this
 *      component calls update() → triggers jwt callback → refresh → new token.
 *   4. If refresh fails (refreshToken expired/revoked), jwt callback sets
 *      error="RefreshAccessTokenError" → this component signs out the user.
 */
function AxiosAuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const extSession = session as ExtendedSession | null;

  // Sync access token to axios whenever session changes.
  React.useEffect(() => {
    setAccessToken(extSession?.accessToken ?? null);
  }, [extSession?.accessToken]);

  // Handle 401 events — ask NextAuth to refresh the session.
  React.useEffect(() => {
    const onTokenExpired = async () => {
      // update() triggers the jwt callback which checks expiry and refreshes.
      await update();
    };
    window.addEventListener("auth:token-expired", onTokenExpired);
    return () => window.removeEventListener("auth:token-expired", onTokenExpired);
  }, [update]);

  // If session has a refresh error, sign out the user.
  React.useEffect(() => {
    if (extSession?.error === "RefreshAccessTokenError") {
      signOut({ redirect: true, callbackUrl: "/login?error=session-expired" });
    }
  }, [extSession?.error]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AxiosAuthSync>{children}</AxiosAuthSync>
    </SessionProvider>
  );
}

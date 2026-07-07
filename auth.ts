import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { APP_CONFIG } from "@/constants/app";

/* ──────────────────────────────────────────────────────────────────────────
   Token refresh helper — calls backend /auth/refresh-token
   ────────────────────────────────────────────────────────────────────────── */

async function refreshAccessToken(
  refreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null> {
  try {
    const res = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success || !json.data?.accessToken) return null;

    return {
      accessToken: json.data.accessToken,
      refreshToken: json.data.refreshToken,
      // Access tokens expire in 15 minutes (backend default).
      // We refresh 1 minute early to avoid edge-case failures.
      expiresAt: Date.now() + 14 * 60 * 1000,
    };
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   NextAuth configuration
   ────────────────────────────────────────────────────────────────────────── */

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      id: "credentials",
      name: "ورود با رمز عبور",
      credentials: {
        identifier: { label: "ایمیل یا موبایل", type: "text" },
        password: { label: "رمز عبور", type: "password" },
        deviceName: { label: "Device", type: "text" },
      },
      async authorize(creds) {
        const identifier = creds?.identifier as string;
        const password = creds?.password as string;
        const deviceName = (creds?.deviceName as string) || "Browser";

        if (!identifier || !password) return null;

        try {
          const res = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password, deviceName }),
          });

          const json = await res.json();
          if (!json.success || !json.data) return null;

          const { user, accessToken, refreshToken, sessionId } = json.data;
          return {
            id: String(user.id),
            fullName: user.fullName,
            email: user.email ?? undefined,
            phone: user.phone ?? undefined,
            role: user.role,
            avatarUrl: user.avatarUrl ?? undefined,
            accessToken,
            refreshToken,
            sessionId,
          } as const;
        } catch {
          return null;
        }
      },
    }),

    Credentials({
      id: "otp",
      name: "ورود با کد یکبار مصرف",
      credentials: {
        identifier: { label: "ایمیل یا موبایل", type: "text" },
        code: { label: "کد تایید", type: "text" },
        deviceName: { label: "Device", type: "text" },
        mode: { label: "mode", type: "text" },
      },
      async authorize(creds) {
        const identifier = creds?.identifier as string;
        const code = creds?.code as string;
        const deviceName = (creds?.deviceName as string) || "Browser";
        const mode = (creds?.mode as string) || "login";

        if (!identifier || !code) return null;

        const endpoint =
          mode === "register"
            ? "/auth/register/verify-otp"
            : "/auth/login/otp/verify";

        try {
          const res = await fetch(`${APP_CONFIG.apiBaseUrl}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, code, deviceName }),
          });

          const json = await res.json();
          if (!json.success || !json.data) return null;

          const { user, accessToken, refreshToken, sessionId } = json.data;
          return {
            id: String(user.id),
            fullName: user.fullName,
            email: user.email ?? undefined,
            phone: user.phone ?? undefined,
            role: user.role,
            avatarUrl: user.avatarUrl ?? undefined,
            accessToken,
            refreshToken,
            sessionId,
          } as const;
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    /** JWT callback — runs on every session access. Handles auto-refresh. */
    async jwt({ token, user }) {
      // Initial sign-in: store tokens from user object.
      if (user) {
        const u = user as unknown as {
          accessToken?: string;
          refreshToken?: string;
          sessionId?: string;
          fullName?: string;
          email?: string;
          phone?: string;
          role?: string;
          avatarUrl?: string;
          id?: string;
        };
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.sessionId = u.sessionId;
        token.user = {
          id: Number(u.id),
          fullName: u.fullName ?? "",
          email: u.email ?? null,
          phone: u.phone ?? null,
          role: u.role as never,
          avatarUrl: u.avatarUrl ?? null,
          isBlocked: false,
          emailVerifiedAt: null,
          phoneVerifiedAt: null,
          createdAt: new Date().toISOString(),
        };
        token.expiresAt = Date.now() + 14 * 60 * 1000;
        token.error = undefined;
        return token;
      }

      // Token is still valid — return as-is.
      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() < expiresAt) {
        return token;
      }

      // Token expired — try to refresh.
      const refreshToken = token.refreshToken as string | undefined;
      if (!refreshToken) {
        token.error = "RefreshAccessTokenError";
        return token;
      }

      const refreshed = await refreshAccessToken(refreshToken);
      if (!refreshed) {
        token.error = "RefreshAccessTokenError";
        return token;
      }

      token.accessToken = refreshed.accessToken;
      token.refreshToken = refreshed.refreshToken;
      token.expiresAt = refreshed.expiresAt;
      token.error = undefined;
      return token;
    },

    /** Session callback — expose token data to client. */
    async session({ session, token }) {
      // Attach user and accessToken to session.
      if (token.user) {
        session.user = token.user as typeof session.user;
      }
      (session as { accessToken?: string }).accessToken = token.accessToken as string | undefined;
      (session as { error?: string }).error = token.error as string | undefined;
      return session;
    },

    /** Authorized callback — control which pages require auth. */
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin")) return isLoggedIn;
      if (pathname.startsWith("/account")) return isLoggedIn;
      if (pathname.startsWith("/checkout")) return isLoggedIn;

      if (["/login", "/register", "/forgot-password", "/verify-otp"].includes(pathname)) {
        return !isLoggedIn;
      }

      return true;
    },
  },
});

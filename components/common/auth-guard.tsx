"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/providers/auth-context";

/**
 * Guard: only authenticated users can access the children.
 *
 * Behavior:
 *   - While session is being hydrated → show full-screen loader
 *   - If not authenticated → redirect to /login?redirect=<current>
 *   - If `requireRole` set and user lacks role → redirect to /403 (or home)
 *
 * Usage:
 *   <AuthGuard><AccountPage /></AuthGuard>
 *   <AuthGuard requireRole="ADMIN"><AdminOnly /></AuthGuard>
 */
export function AuthGuard({
  children,
  requireRole,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  /** Required role. Array = any-of. */
  requireRole?: string | string[];
  /** Override the redirect destination when unauthenticated. */
  redirectTo?: string;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set("redirect", currentPath);
      router.replace(url.pathname + url.search);
      return;
    }
    if (requireRole && user) {
      const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
      if (!roles.includes(user.role)) {
        router.replace("/?forbidden=1");
      }
    }
  }, [isAuthenticated, isLoading, user, requireRole, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="mr-2 text-sm text-muted-foreground">در حال بارگذاری...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="mr-2 text-sm text-muted-foreground">در حال انتقال به ورود...</span>
      </div>
    );
  }

  // Role check (render-time fallback in case effect hasn't fired yet).
  if (requireRole && user) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!roles.includes(user.role)) {
      return (
        <div className="container-site flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-2xl font-bold text-foreground">دسترسی غیرمجاز</h1>
          <p className="text-sm text-muted-foreground">
            شما اجازه‌ی دسترسی به این صفحه را ندارید.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

/**
 * Inverse of AuthGuard: only GUEST users can access the children.
 * Authenticated users are redirected to /account (or ?redirect= param).
 *
 * Use this on /login, /register, /forgot-password, /verify-otp.
 */
export function GuestOnly({
  children,
  redirectTo = "/account",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      // Read redirect param directly from URL (avoids useSearchParams Suspense requirement).
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      router.replace(redirect ?? redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

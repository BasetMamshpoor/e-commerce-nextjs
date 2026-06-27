"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { authService } from "@/services";
import { useAuth } from "@/providers/auth-context";
import { ApiError } from "@/types/api";
import type { LoginValues } from "@/features/auth/schemas/auth.schema";

/**
 * Login with password.
 *
 * On success:
 *   - Persists session (access/refresh tokens + user)
 *   - Redirects based on role: admin/editor/support → /admin, customer → /account
 *   - Honors ?redirect= param if present
 */
export function useLogin() {
  const { applySession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: (values: LoginValues) =>
      authService.login({
        identifier: values.identifier,
        password: values.password,
        deviceName: values.deviceName ?? defaultDeviceName(),
      }),
    onSuccess: (session) => {
      applySession(session);
      toast.success("خوش آمدید 👋");

      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.replace(redirect);
      } else {
        // Role-based redirect.
        const isAdmin = ["ADMIN", "EDITOR", "SUPPORT"].includes(session.user.role);
        router.replace(isAdmin ? "/admin" : "/account");
      }
      router.refresh();
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isBlocked) {
        toast.error("حساب شما مسدود شده است", {
          description: apiErr.message,
        });
      } else if (apiErr.isRateLimited) {
        toast.error("تلاش‌های ناموفق زیاد بود", {
          description: "لطفاً چند دقیقه بعد دوباره تلاش کنید",
        });
      } else {
        toast.error(apiErr.message || "ورود ناموفق بود");
      }
    },
  });
}

function defaultDeviceName(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = "Chrome";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Edg/.test(ua)) browser = "Edge";

  let os = "Unknown OS";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac/.test(ua)) os = "Mac";
  else if (/Linux/.test(ua)) os = "Linux";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";

  return `${browser} on ${os}`;
}

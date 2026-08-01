"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import type { LoginValues } from "@/features/auth/schemas/auth.schema";

/**
 * Login with email/phone + password via NextAuth credentials provider.
 * On success, NextAuth creates a JWT session (with auto-refresh).
 *
 * Role-based redirect:
 *   ADMIN / EDITOR / SUPPORT → /admin
 *   CUSTOMER → /account
 *
 * If a `redirect` search param is present, it takes precedence
 * (e.g. user tried to access /account/orders while logged out).
 */
export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (values: LoginValues) => {
      const result = await signIn("credentials", {
        identifier: values.identifier,
        password: values.password,
        redirect: false,
      });
      if (!result || result.error) {
        throw new Error("INVALID_CREDENTIALS");
      }
      return result;
    },
    onSuccess: async () => {
      toast.success("ورود موفقیت‌آمیز بود");

      // Read redirect param directly from window (avoids useSearchParams
      // which requires Suspense boundary and can cause loading stuck).
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect") || params.get("callbackUrl");
        if (redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("/login")) {
          router.push(redirectUrl);
          router.refresh();
          return;
        }
      }

      // Fetch session to determine role-based redirect.
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;
        const isStaff = role === "ADMIN" || role === "EDITOR" || role === "SUPPORT";
        router.push(isStaff ? "/admin" : "/account");
        router.refresh();
      } catch {
        // Fallback if session fetch fails — go to home.
        router.push("/");
        router.refresh();
      }
    },
    onError: () => {
      toast.error("شناسه یا رمز عبور اشتباه است");
    },
  });
}

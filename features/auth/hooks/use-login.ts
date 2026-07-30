"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
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
 * If a `callbackUrl` search param is present, it takes precedence
 * (e.g. user tried to access /account/orders while logged out).
 */
export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

      // Check for redirect param in search params (takes precedence).
      // AuthGuard sets ?redirect=/account/orders when blocking a page.
      const redirectUrl = searchParams.get("redirect") || searchParams.get("callbackUrl");
      if (redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("/login")) {
        router.push(redirectUrl);
        router.refresh();
        return;
      }

      // Fetch session to determine role-based redirect.
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;
      const isStaff = role === "ADMIN" || role === "EDITOR" || role === "SUPPORT";
      router.push(isStaff ? "/admin" : "/account");
      router.refresh();
    },
    onError: () => {
      toast.error("شناسه یا رمز عبور اشتباه است");
    },
  });
}

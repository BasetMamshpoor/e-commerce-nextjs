"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import type { LoginValues } from "@/features/auth/schemas/auth.schema";

/**
 * Login with email/phone + password via NextAuth credentials provider.
 * On success, NextAuth creates a JWT session (with auto-refresh).
 * User never needs to re-login — refresh token rotation is handled by
 * the jwt callback in auth.ts.
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
      // Fetch session to determine role-based redirect.
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;
      const isAdmin = role === "ADMIN" || role === "EDITOR" || role === "SUPPORT";
      router.push(isAdmin ? "/admin" : "/account");
      router.refresh();
    },
    onError: () => {
      toast.error("شناسه یا رمز عبور اشتباه است");
    },
  });
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { authService } from "@/services";
import { ApiError } from "@/types/api";
import type { OtpValues } from "@/features/auth/schemas/auth.schema";

/**
 * Verify OTP (login or register) via NextAuth "otp" provider.
 * On success, NextAuth creates a JWT session with auto-refresh.
 */
export function useVerifyOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: { identifier: string; code: string; mode?: "login" | "register" }) => {
      const mode = params.mode ?? "login";
      const result = await signIn("otp", {
        identifier: params.identifier,
        code: params.code,
        mode,
        redirect: false,
      });
      if (!result || result.error) {
        throw new Error("INVALID_OTP");
      }
      return result;
    },
    onSuccess: async (_data, variables) => {
      toast.success(variables.mode === "register" ? "ثبت‌نام کامل شد" : "ورود موفقیت‌آمیز بود");
      // Fetch session to determine role-based redirect.
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;
      const isAdmin = role === "ADMIN" || role === "EDITOR" || role === "SUPPORT";
      router.push(isAdmin ? "/admin" : "/account");
      router.refresh();
    },
    onError: () => {
      toast.error("کد تایید اشتباه یا منقضی است");
    },
  });
}

/**
 * Request OTP for login (without password).
 * Calls backend /auth/login/otp/request directly — no session created.
 */
export function useLoginOtpRequest() {
  return useMutation({
    mutationFn: (identifier: string) =>
      authService.loginOtpRequest({ identifier }),
    onSuccess: (data, identifier) => {
      toast.success("کد تایید ارسال شد", {
        description:
          data.channel === "SMS"
            ? `کد ۵ رقمی به شماره ${identifier} پیامک شد`
            : `کد ۵ رقمی به ایمیل ${identifier} ارسال شد`,
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isNotFound) {
        toast.error("کاربری با این مشخصات یافت نشد");
      } else if (apiErr.isForbidden) {
        toast.error("حساب شما مسدود است");
      } else {
        toast.error(apiErr.message || "ارسال کد ناموفق بود");
      }
    },
  });
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "@/services";
import { ApiError } from "@/types/api";
import type {
  ForgotPasswordValues,
  ResetPasswordValues,
} from "@/features/auth/schemas/auth.schema";

/**
 * Step 1 of password reset flow — request an OTP for the identifier.
 * Backend always returns success (even if account doesn't exist) to prevent enumeration.
 */
export function useForgotPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: ForgotPasswordValues) =>
      authService.forgotPassword({ identifier: values.identifier }),
    onSuccess: (_data, variables) => {
      toast.success("در صورت وجود حساب، کد تایید ارسال شد", {
        description: `لطفاً ${variables.identifier} را بررسی کنید`,
      });
      const params = new URLSearchParams({
        identifier: variables.identifier,
      });
      router.push(`/reset-password?${params.toString()}`);
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isRateLimited) {
        toast.error("تعداد درخواست‌ها زیاد بود", {
          description: "لطفاً چند دقیقه بعد دوباره تلاش کنید",
        });
      } else {
        // Even on error, redirect to /reset-password to avoid leaking account existence.
        toast.error("در صورت وجود حساب، کد تایید ارسال شد");
        const params = new URLSearchParams({
          identifier: variables.identifier,
        });
        router.push(`/reset-password?${params.toString()}`);
      }
    },
  });
}

/**
 * Step 2 of password reset flow — verify OTP + set new password.
 * On success, ALL existing sessions for this user are revoked (per api.md),
 * so user must log in again with the new password.
 */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: ResetPasswordValues) =>
      authService.resetPassword({
        identifier: values.identifier,
        code: values.code,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.success("رمز عبور با موفقیت تغییر کرد", {
        description: "لطفاً با رمز جدید وارد شوید",
      });
      router.replace("/login?reset=1");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isRateLimited) {
        toast.error("تعداد تلاش‌های ناموفق زیاد بود", {
          description: "لطفاً چند دقیقه بعد دوباره تلاش کنید",
        });
      } else {
        toast.error(apiErr.message || "کد تایید اشتباه یا منقضی است");
      }
    },
  });
}

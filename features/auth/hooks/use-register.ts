"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "@/services";
import { ApiError } from "@/types/api";
import type { RegisterValues } from "@/features/auth/schemas/auth.schema";

/**
 * Step 1: Submit registration form → backend sends OTP to identifier.
 * Step 2 (separate route /verify-otp): user enters OTP → NextAuth session issued.
 *
 * This hook only handles step 1. The user is then redirected to /verify-otp
 * with the identifier passed via URL query. The OTP verification is handled
 * by useVerifyOtp() with mode="register" which calls NextAuth's "otp" provider.
 */
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: RegisterValues) =>
      authService.register({
        fullName: values.fullName,
        identifier: values.identifier,
        password: values.password,
      }),
    onSuccess: (data, variables) => {
      toast.success("کد تایید ارسال شد", {
        description:
          data.channel === "SMS"
            ? `کد ۵ رقمی به شماره ${variables.identifier} پیامک شد`
            : `کد ۵ رقمی به ایمیل ${variables.identifier} ارسال شد`,
      });
      const params = new URLSearchParams({
        identifier: variables.identifier,
        mode: "register",
      });
      router.push(`/verify-otp?${params.toString()}`);
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isConflict) {
        toast.error("این حساب از قبل وجود دارد", {
          description: "لطفاً وارد شوید یا از شناسه‌ی دیگری استفاده کنید",
        });
      } else if (apiErr.isRateLimited) {
        toast.error("تعداد درخواست‌ها زیاد بود", {
          description: "لطفاً چند دقیقه بعد دوباره تلاش کنید",
        });
      } else {
        toast.error(apiErr.message || "ثبت‌نام ناموفق بود");
      }
    },
  });
}

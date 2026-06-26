"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "@/services";
import { ApiError } from "@/types/api";
import type { RegisterValues } from "@/features/auth/schemas/auth.schema";

/**
 * Step 1: Submit registration form → backend sends OTP to identifier.
 * Step 2 (separate route /verify-otp): user enters OTP → session issued.
 *
 * This hook only handles step 1. The user is then redirected to /verify-otp
 * with the identifier passed via URL query.
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
      // Pass identifier to verify page via URL.
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

/**
 * Step 2: Verify OTP for registration → issues full session.
 */
export function useRegisterVerifyOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (params: { identifier: string; code: string; deviceName?: string }) =>
      authService.registerVerifyOtp({
        identifier: params.identifier,
        code: params.code,
        deviceName: params.deviceName ?? defaultDeviceName(),
      }),
    onSuccess: (session) => {
      // Persist session via auth context (injected by caller).
      // We can't access useAuth here cleanly without circular deps; caller wires this.
      toast.success("ثبت‌نام شما تکمیل شد");
      const params = new URLSearchParams({ registered: "1" });
      router.replace(`/account?${params.toString()}`);
      router.refresh();
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isRateLimited) {
        toast.error("تعداد تلاش‌های ناموفق زیاد بود", {
          description: "لطفاً چند دقیقه بعد دوباره تلاش کنید",
        });
      } else {
        toast.error(apiErr.message || "کد تایید اشتباه است");
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

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "@/services";
import { useAuth } from "@/providers/auth-context";
import { ApiError } from "@/types/api";

type VerifyParams = {
  identifier: string;
  code: string;
  deviceName?: string;
  mode: "register" | "login";
};

/**
 * Universal OTP verification hook — handles both:
 *   - register mode → POST /auth/register/verify-otp
 *   - login mode → POST /auth/login/otp/verify
 *
 * Both return the same AuthSession shape.
 */
export function useVerifyOtp() {
  const { applySession } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ identifier, code, deviceName, mode }: VerifyParams) => {
      const finalDevice = deviceName ?? defaultDeviceName();
      if (mode === "register") {
        return authService.registerVerifyOtp({ identifier, code, deviceName: finalDevice });
      }
      return authService.loginOtpVerify({ identifier, code, deviceName: finalDevice });
    },
    onSuccess: (session, variables) => {
      applySession(session);
      toast.success(
        variables.mode === "register" ? "ثبت‌نام شما تکمیل شد 🎉" : "خوش آمدید 👋",
      );
      const isAdmin = ["ADMIN", "EDITOR", "SUPPORT"].includes(session.user.role);
      router.replace(isAdmin ? "/admin" : "/account");
      router.refresh();
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

/** Request an OTP for login (without password). */
export function useLoginOtpRequest() {
  return useMutation({
    mutationFn: (identifier: string) =>
      authService.loginOtpRequest({ identifier }),
    onSuccess: (data) => {
      toast.success("کد تایید ارسال شد", {
        description:
          data.channel === "SMS"
            ? "کد ۵ رقمی به شماره موبایل شما پیامک شد"
            : "کد ۵ رقمی به ایمیل شما ارسال شد",
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isNotFound) {
        // Backend returns 404 — but to avoid account enumeration, show generic message.
        toast.error("اگر حسابی با این مشخصات وجود داشته باشد، کد ارسال می‌شود");
      } else if (apiErr.isForbidden) {
        toast.error("حساب شما مسدود شده است");
      } else if (apiErr.isRateLimited) {
        toast.error("تعداد درخواست‌ها زیاد بود", {
          description: "لطفاً چند دقیقه بعد دوباره تلاش کنید",
        });
      } else {
        toast.error(apiErr.message || "ارسال کد ناموفق بود");
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

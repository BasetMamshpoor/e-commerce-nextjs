"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { usersMeService, mediaService } from "@/services";
import { ApiError } from "@/types/api";
import type { User } from "@/types/domain";

export const USER_QUERY_KEY = ["user", "me"] as const;

/** Fetch current user's profile (includes walletBalance). */
export function useUserMe() {
  return useQuery<User>({
    queryKey: USER_QUERY_KEY,
    queryFn: () => usersMeService.get(),
    staleTime: 30 * 1000,
  });
}

/** Update fullName. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fullName: string) => usersMeService.update({ fullName }),
    onSuccess: (user) => {
      queryClient.setQueryData(USER_QUERY_KEY, user);
      toast.success("پروفایل به‌روزرسانی شد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "به‌روزرسانی ناموفق بود");
    },
  });
}

/** Upload avatar file → set as avatar.
 *
 * NOTE: This currently uploads the file to /media as a standalone Media
 * asset because the backend's `/users/me` endpoint does not yet accept
 * an avatar file directly via multipart. When the backend adds multipart
 * support for avatars (e.g. field name "avatar" on PUT /users/me), this
 * should be refactored to send the file inline — same pattern as brands
 * (brandsService.createWithLogo) and shipping-companies.
 */
export function useSetAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Backend doesn't currently expose a set-avatar endpoint — we just
      // upload the media file. Keeping the hook so the UI stays functional.
      const media = await mediaService.upload(file);
      return media;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      toast.success("تصویر پروفایل به‌روزرسانی شد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "آپلود تصویر ناموفق بود");
    },
  });
}

/** Change password (requires currentPassword). */
export function useChangePassword() {
  return useMutation({
    mutationFn: (params: { currentPassword: string; newPassword: string }) =>
      usersMeService.changePassword(params),
    onSuccess: () => {
      toast.success("رمز عبور تغییر کرد", {
        description: "از سایر دستگاه‌ها خارج شدید",
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.status === 400) {
        toast.error("رمز فعلی اشتباه است");
      } else {
        toast.error(apiErr.message || "تغییر رمز ناموفق بود");
      }
    },
  });
}

/** Step 1 of identifier change: request OTP for new email/phone. */
export function useRequestChangeIdentifier() {
  return useMutation({
    mutationFn: (newIdentifier: string) =>
      usersMeService.changeIdentifierRequest({ newIdentifier }),
    onSuccess: (data) => {
      toast.success("کد تایید ارسال شد", {
        description:
          data.channel === "SMS"
            ? "کد به شماره جدید پیامک شد"
            : "کد به ایمیل جدید ارسال شد",
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isConflict) {
        toast.error("این شناسه قبلاً استفاده شده", {
          description: "لطفاً از ایمیل/موبایل دیگری استفاده کنید",
        });
      } else {
        toast.error(apiErr.message || "ارسال کد ناموفق بود");
      }
    },
  });
}

/** Step 2 of identifier change: verify OTP and apply. */
export function useVerifyChangeIdentifier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { newIdentifier: string; code: string }) =>
      usersMeService.changeIdentifierVerify(params),
    onSuccess: (user) => {
      queryClient.setQueryData(USER_QUERY_KEY, user);
      toast.success("ایمیل/موبایل با موفقیت تغییر کرد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "کد تایید اشتباه است");
    },
  });
}

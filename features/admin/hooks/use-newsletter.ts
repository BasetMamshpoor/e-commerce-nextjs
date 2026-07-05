"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { newsletterService } from "@/services";
import { ApiError } from "@/types/api";

export const NEWSLETTER_QUERY_KEY = ["newsletter"] as const;

export function useNewsletterSubscribers(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...NEWSLETTER_QUERY_KEY, "subscribers", params ?? {}],
    queryFn: () => newsletterService.adminSubscribers(params),
  });
}

export function useSubscribeNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => newsletterService.subscribe(email),
    onSuccess: () => {
      toast.success("ایمیل شما با موفقیت در خبرنامه ثبت شد");
      qc.invalidateQueries({ queryKey: NEWSLETTER_QUERY_KEY });
    },
    onError: (e) => toast.error((e as ApiError).message || "عضویت ناموفق بود"),
  });
}

export function useUnsubscribeNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => newsletterService.unsubscribe(email),
    onSuccess: () => {
      toast.success("عضویت شما لغو شد");
      qc.invalidateQueries({ queryKey: NEWSLETTER_QUERY_KEY });
    },
    onError: (e) => toast.error((e as ApiError).message || "لغو عضویت ناموفق بود"),
  });
}

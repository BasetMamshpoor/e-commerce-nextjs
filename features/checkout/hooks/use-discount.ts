"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { discountCodesService } from "@/services";
import { ApiError } from "@/types/api";
import type { DiscountApplyResult } from "@/types/domain";

/**
 * Apply (preview) a discount code on the current cart.
 * Doesn't consume the code — only shows the discount amount.
 */
export function useApplyDiscountCode() {
  return useMutation({
    mutationFn: (code: string) => discountCodesService.apply({ code }),
    onSuccess: (data: DiscountApplyResult) => {
      toast.success(`تخفیف ${data.discountAmount.toLocaleString("fa-IR")} تومان اعمال شد`, {
        description: `مبلغ قابل پرداخت: ${data.payableTotal.toLocaleString("fa-IR")} تومان`,
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isNotFound) {
        toast.error("کد تخفیف یافت نشد");
      } else if (apiErr.isUnauthorized) {
        toast.error("برای استفاده از این کد باید وارد شوید");
      } else {
        toast.error(apiErr.message || "کد تخفیف نامعتبر است");
      }
    },
  });
}

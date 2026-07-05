"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { walletService } from "@/services";
import { ApiError } from "@/types/api";

export const WITHDRAWALS_QUERY_KEY = ["wallet", "withdrawals"] as const;

/** User's own withdrawal requests. */
export function useMyWithdrawals(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...WITHDRAWALS_QUERY_KEY, page, limit],
    queryFn: () => walletService.myWithdrawals({ page, limit }),
  });
}

/** Submit a new withdrawal request. */
export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: number; description?: string }) =>
      walletService.requestWithdrawal(body),
    onSuccess: () => {
      toast.success("درخواست برداشت ثبت شد و در انتظار بررسی است.");
      queryClient.invalidateQueries({ queryKey: WITHDRAWALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "ثبت درخواست برداشت ناموفق بود");
    },
  });
}

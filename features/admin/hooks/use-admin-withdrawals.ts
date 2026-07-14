"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { walletService, type ReviewWithdrawalBody } from "@/services";
import { ApiError } from "@/types/api";

export const ADMIN_WITHDRAWALS_QUERY_KEY = ["admin", "withdrawals"] as const;

/** Admin: list all withdrawal requests. */
export function useAdminWithdrawals(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: [...ADMIN_WITHDRAWALS_QUERY_KEY, params ?? {}],
    queryFn: () => walletService.adminWithdrawals(params),
  });
}

/** Admin: approve or reject a withdrawal request. */
export function useReviewWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ReviewWithdrawalBody }) =>
      walletService.adminReviewWithdrawal(id, body),
    onSuccess: (_data, vars) => {
      toast.success(vars.body.status === "APPROVED" ? "درخواست برداشت تایید شد." : "درخواست برداشت رد شد.");
      queryClient.invalidateQueries({ queryKey: ADMIN_WITHDRAWALS_QUERY_KEY });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "بررسی درخواست ناموفق بود");
    },
  });
}

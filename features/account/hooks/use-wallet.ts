"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { walletService } from "@/services";
import { ApiError } from "@/types/api";
import type { WalletData } from "@/types/domain";

export const WALLET_QUERY_KEY = ["wallet"] as const;

export function useWallet(page = 1, limit = 20) {
  return useQuery<WalletData>({
    queryKey: [...WALLET_QUERY_KEY, page, limit],
    queryFn: () => walletService.get({ page, limit }),
    staleTime: 30 * 1000,
  });
}

export function useChargeWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, gatewaySlug }: { amount: number; gatewaySlug: string }) =>
      walletService.chargeInitiate({ amount, gatewaySlug }),
    onSuccess: (data) => {
      if (typeof window !== "undefined" && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "شارژ کیف پول ناموفق بود");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
    },
  });
}

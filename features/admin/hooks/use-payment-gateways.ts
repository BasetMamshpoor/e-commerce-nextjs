"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { paymentGatewaysService } from "@/services/remaining-services";
import { ApiError } from "@/types/api";
import type { PaymentGateway, UpsertPaymentGatewayBody } from "@/types/domain";

export const PAYMENT_GATEWAYS_QUERY_KEY = ["payment-gateways"] as const;

export function usePaymentGateways() {
  return useQuery<PaymentGateway[]>({
    queryKey: PAYMENT_GATEWAYS_QUERY_KEY,
    queryFn: () => paymentGatewaysService.list(),
  });
}

export function useCreatePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertPaymentGatewayBody) => paymentGatewaysService.create(body),
    onSuccess: () => {
      toast.success("درگاه پرداخت ایجاد شد");
      qc.invalidateQueries({ queryKey: PAYMENT_GATEWAYS_QUERY_KEY });
    },
    onError: (e) => toast.error((e as ApiError).message || "ایجاد درگاه ناموفق بود"),
  });
}

export function useUpdatePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<UpsertPaymentGatewayBody> }) =>
      paymentGatewaysService.update(id, body),
    onSuccess: () => {
      toast.success("درگاه ویرایش شد");
      qc.invalidateQueries({ queryKey: PAYMENT_GATEWAYS_QUERY_KEY });
    },
    onError: (e) => toast.error((e as ApiError).message || "ویرایش درگاه ناموفق بود"),
  });
}

export function useDeletePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentGatewaysService.delete,
    onSuccess: () => {
      toast.success("درگاه حذف شد");
      qc.invalidateQueries({ queryKey: PAYMENT_GATEWAYS_QUERY_KEY });
    },
    onError: (e) => toast.error((e as ApiError).message || "حذف درگاه ناموفق بود"),
  });
}

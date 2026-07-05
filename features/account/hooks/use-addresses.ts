"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { addressesService } from "@/services";
import type { UpsertAddressBody } from "@/services";
import { ApiError } from "@/types/api";
import type { Address } from "@/types/domain";

export const ADDRESSES_QUERY_KEY = ["addresses"] as const;

export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: () => addressesService.list(),
    staleTime: 60 * 1000,
  });
}

export function useAddress(id: string | undefined) {
  return useQuery<Address>({
    queryKey: [...ADDRESSES_QUERY_KEY, "detail", id],
    queryFn: () => addressesService.byId(id!),
    enabled: !!id,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpsertAddressBody) => addressesService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
      toast.success("آدرس جدید ذخیره شد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "ذخیره آدرس ناموفق بود");
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<UpsertAddressBody> }) =>
      addressesService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
      toast.success("آدرس به‌روزرسانی شد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "به‌روزرسانی آدرس ناموفق بود");
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
      toast.success("آدرس حذف شد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isConflict) {
        toast.error("این آدرس در سفارش استفاده شده", {
          description: "نمی‌توان آن را حذف کرد",
        });
      } else {
        toast.error(apiErr.message || "حذف آدرس ناموفق بود");
      }
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ordersService } from "@/services";
import { ApiError } from "@/types/api";
import type {
  CreateOrderBody,
  Order,
  OrderListQuery,
  PaginatedData,
  RequestReturnBody,
} from "@/types/domain";
import { CART_QUERY_KEY } from "@/providers/cart-context";
import { APP_CONFIG } from "@/constants/app";

export const ORDERS_QUERY_KEY = ["orders"] as const;

/* ───────── User orders ───────── */

export function useOrders(query?: OrderListQuery) {
  return useQuery<PaginatedData<Order>>({
    queryKey: [...ORDERS_QUERY_KEY, "list", query ?? {}],
    queryFn: () => ordersService.list({ limit: APP_CONFIG.defaultPageSize, ...query }),
    staleTime: 30 * 1000,
  });
}

export function useOrderDetail(id: number | undefined) {
  return useQuery<Order>({
    queryKey: [...ORDERS_QUERY_KEY, "detail", id],
    queryFn: () => ordersService.byId(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/* ───────── Create order (checkout) ───────── */

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: CreateOrderBody) => ordersService.create(body),
    onSuccess: (order) => {
      // Invalidate cart (it should now be empty) and orders list.
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });

      if (order.status === "PROCESSING") {
        // Fully paid (WALLET or MIXED with enough wallet).
        toast.success("سفارش شما با موفقیت ثبت شد", {
          description: `شماره سفارش: ${order.orderNumber}`,
        });
        router.replace(`/account/orders/${order.id}?success=1`);
      } else if (order.status === "PENDING_PAYMENT") {
        // Needs gateway payment — initiate it.
        toast.success("سفارش ثبت شد", {
          description: "در حال انتقال به درگاه پرداخت...",
        });
        // The page will handle payment initiation based on the returned order.
        router.replace(`/account/orders/${order.id}?pending=1`);
      }
    },
    onError: (err) => {
      const apiErr = err as ApiError;

      // Check if this is a PRICE_CHANGED error (currency-based products whose
      // price has fluctuated more than the threshold since the cart was loaded).
      const errors = apiErr.errors as Array<{
        priceChanged?: boolean;
        oldPrice?: number;
        newPrice?: number;
        message?: string;
      }> | undefined;

      const priceChangedItems = errors?.filter((e) => e.priceChanged);

      if (priceChangedItems && priceChangedItems.length > 0) {
        // Refresh the cart so the user sees updated prices.
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });

        const descriptions = priceChangedItems.map((item) => {
          if (item.oldPrice && item.newPrice) {
            return `${item.message ?? "قیمت تغییر کرد"}: ${item.oldPrice.toLocaleString("fa-IR")} → ${item.newPrice.toLocaleString("fa-IR")} تومان`;
          }
          return item.message ?? "قیمت تغییر کرد";
        });

        toast.error("قیمت برخی محصولات تغییر کرده است", {
          description: descriptions.join(" — "),
        });
        return;
      }

      if (apiErr.isConflict) {
        toast.error("موجودی هم‌زمان تغییر کرد", {
          description: "لطفاً سبد خود را بررسی و دوباره تلاش کنید",
        });
      } else if (apiErr.status === 400) {
        toast.error(apiErr.message || "اطلاعات سفارش نامعتبر است");
      } else {
        toast.error(apiErr.message || "ثبت سفارش ناموفق بود");
      }
    },
  });
}

/* ───────── Cancel order ───────── */

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      ordersService.cancel(id, { reason }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("سفارش لغو شد", {
        description: order.cancellation?.reason,
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isConflict) {
        toast.error("این سفارش قابل لغو نیست", {
          description: "سفارش ارسال شده است — باید مرجوعی بزنید",
        });
      } else {
        toast.error(apiErr.message || "لغو سفارش ناموفق بود");
      }
    },
  });
}

/* ───────── Request return ───────── */

export function useRequestReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
      files,
    }: {
      id: number;
      body: Omit<RequestReturnBody, "imageMediaIds">;
      /** Optional image files — when provided, sent via multipart/form-data
       *  with field name "images" (no pre-upload to /media needed). */
      files?: File[];
    }) => {
      if (files && files.length > 0) {
        return ordersService.requestReturnWithImages(id, body, files);
      }
      // No files — fall back to plain JSON request.
      return ordersService.requestReturn(id, body);
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast.success("درخواست مرجوعی ثبت شد", {
        description: "در انتظار بررسی پشتیبانی",
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isConflict) {
        toast.error("این سفارش قابل مرجوعی نیست", {
          description: "فقط سفارش‌های تحویل‌شده قابل مرجوعی هستند",
        });
      } else {
        toast.error(apiErr.message || "ثبت مرجوعی ناموفق بود");
      }
    },
  });
}

/* ───────── Payment initiation (for PENDING_PAYMENT orders) ───────── */

export function useInitiatePayment() {
  return useMutation({
    mutationFn: ({ id, gatewaySlug }: { id: number; gatewaySlug: string }) =>
      ordersService.paymentInitiate(id, { gatewaySlug }),
    onSuccess: (data) => {
      // Redirect to gateway.
      if (typeof window !== "undefined" && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "شروع پرداخت ناموفق بود");
    },
  });
}

/* ───────── Payment verify (after returning from gateway) ───────── */

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      providerParams,
    }: {
      id: number;
      providerParams: Record<string, string>;
    }) => ordersService.paymentVerify(id, { providerParams }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      if (order.status === "PROCESSING") {
        toast.success("پرداخت با موفقیت انجام شد");
      }
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "پرداخت ناموفق بود", {
        description: "می‌توانید دوباره تلاش کنید",
      });
    },
  });
}

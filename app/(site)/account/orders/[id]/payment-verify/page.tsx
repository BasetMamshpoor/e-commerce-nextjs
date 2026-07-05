"use client";

// Opt out of static prerendering — page uses useSearchParams.
export const dynamic = "force-dynamic";


import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ShoppingBag } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVerifyPayment } from "@/features/checkout/hooks";
import { formatPrice, toPersianDigits } from "@/utils/format";

/**
 * Order payment verification page.
 *
 * User returns here from the payment gateway after paying for an order.
 * URL: /account/orders/[id]/payment-verify?Authority=xxx&Status=OK
 *
 * This page calls `POST /orders/:id/payment/verify` with providerParams
 * extracted from the URL, and shows the result.
 */
export default function OrderPaymentVerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const verify = useVerifyPayment();

  const [status, setStatus] = React.useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = React.useState<string>("");

  React.useEffect(() => {
    if (!Number.isFinite(orderId)) {
      setStatus("error");
      setMessage("شناسه سفارش نامعتبر است.");
      return;
    }

    // Collect all query params as providerParams (gateway-specific)
    const providerParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      providerParams[key] = value;
    });

    if (Object.keys(providerParams).length === 0) {
      setStatus("error");
      setMessage("پارامترهای بازگشت از درگاه یافت نشد.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const order = await verify.mutateAsync({
          id: orderId,
          providerParams,
        });
        if (cancelled) return;
        if (order.status === "PROCESSING") {
          setStatus("success");
          setMessage(`سفارش #${order.orderNumber} با موفقیت پرداخت شد.`);
        } else {
          setStatus("error");
          setMessage(`پرداخت ناموفق بود. وضعیت سفارش: ${order.status}`);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const apiErr = err as { message?: string };
        setStatus("error");
        setMessage(apiErr?.message ?? "تأیید پرداخت ناموفق بود.");
      }
    })();

    return () => {
      cancelled = true;
    };
     
  }, [orderId]);

  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="mx-auto mb-4 size-12 animate-spin text-primary" />
              <h1 className="text-lg font-bold text-foreground">در حال تأیید پرداخت</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                لطفاً صبر کنید. در حال بررسی پرداخت سفارش #{toPersianDigits(orderId)}...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 size-12 text-success" />
              <h1 className="text-lg font-bold text-foreground">پرداخت موفق</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                می‌توانید وضعیت سفارش خود را در صفحه سفارش‌ها پیگیری کنید.
              </p>
              <Button asChild className="mt-6 w-full">
                <Link href={`/account/orders/${orderId}`}>
                  <ShoppingBag className="size-4" />
                  مشاهده سفارش
                </Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto mb-4 size-12 text-destructive" />
              <h1 className="text-lg font-bold text-foreground">پرداخت ناموفق</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                در صورت کسر مبلغ از حساب، حداکثر تا ۷۲ ساعت بازگردانده می‌شود.
              </p>
              <div className="mt-6 flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/account/orders/${orderId}`}>مشاهده سفارش</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/account/orders">سفارش‌های من</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

// Opt out of static prerendering — page uses useSearchParams.
export const dynamic = "force-dynamic";


import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { walletService } from "@/services";
import { useWallet } from "@/features/account/hooks";
import { formatToman, toPersianDigits } from "@/utils/format";

/**
 * Wallet charge verification page.
 *
 * User returns here from the payment gateway with query params like:
 *   ?transactionId=1&Authority=xxx&Status=OK
 *
 * This page calls `POST /wallet/charge/:transactionId/verify` with providerParams
 * extracted from the URL, and shows the result.
 */
export default function WalletVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refetch: refetchWallet } = useWallet();

  const transactionId = searchParams.get("transactionId");
  const [status, setStatus] = React.useState<"verifying" | "success" | "error" | "already">("verifying");
  const [message, setMessage] = React.useState<string>("");
  const [balance, setBalance] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!transactionId) {
      setStatus("error");
      setMessage("شناسه تراکنش یافت نشد.");
      return;
    }

    // Collect all query params as providerParams (gateway-specific: Authority, Status, etc.)
    const providerParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "transactionId") providerParams[key] = value;
    });

    let cancelled = false;

    (async () => {
      try {
        const result = await walletService.chargeVerify(
          Number(transactionId),
          { providerParams }
        );
        if (cancelled) return;
        if (result.alreadyProcessed) {
          setStatus("already");
          setMessage("این پرداخت قبلاً تأیید شده است.");
        } else {
          setStatus("success");
          setMessage("کیف پول شما با موفقیت شارژ شد.");
        }
        setBalance(result.balance);
        refetchWallet();
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
     
  }, [transactionId]);

  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="mx-auto mb-4 size-12 animate-spin text-primary" />
              <h1 className="text-lg font-bold text-foreground">در حال تأیید پرداخت</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                لطفاً صبر کنید. در حال بررسی تراکنش #{transactionId && toPersianDigits(Number(transactionId))}...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 size-12 text-success" />
              <h1 className="text-lg font-bold text-foreground">شارژ موفق</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              {balance != null && (
                <div className="mt-4 rounded-lg bg-success/10 p-3">
                  <p className="text-xs text-muted-foreground">موجودی فعلی کیف پول</p>
                  <p className="mt-1 text-xl font-bold text-success nums-fa">
                    {formatToman(balance)}
                  </p>
                </div>
              )}
              <Button asChild className="mt-6 w-full">
                <Link href="/account/wallet">
                  <Wallet className="size-4" />
                  بازگشت به کیف پول
                </Link>
              </Button>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 size-12 text-blue-500" />
              <h1 className="text-lg font-bold text-foreground">پرداخت قبلاً تأیید شده</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link href="/account/wallet">بازگشت به کیف پول</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto mb-4 size-12 text-destructive" />
              <h1 className="text-lg font-bold text-foreground">پرداخت ناموفق</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <div className="mt-6 flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/account/wallet">بازگشت</Link>
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push("/account/wallet")}
                >
                  تلاش مجدد
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

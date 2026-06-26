"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronLeft,
  ShoppingBag,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { useWallet, useChargeWallet } from "@/features/account/hooks";
import { paymentGatewaysService } from "@/services";
import { formatToman, formatPrice, formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { WalletTransactionType, PaymentGateway } from "@/types/domain";

const TX_TYPE_CONFIG: Record<WalletTransactionType, { label: string; icon: React.ReactNode; isPositive: boolean }> = {
  DEPOSIT: { label: "شارژ", icon: <ArrowDownToLine className="size-4" />, isPositive: true },
  WITHDRAW: { label: "برداشت", icon: <ArrowUpFromLine className="size-4" />, isPositive: false },
  PURCHASE: { label: "خرید", icon: <ShoppingBag className="size-4" />, isPositive: false },
  REFUND: { label: "بازگشت وجه", icon: <RefreshCw className="size-4" />, isPositive: true },
  ADMIN_ADJUST: { label: "تعدیل ادمین", icon: <Plus className="size-4" />, isPositive: true },
};

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];

export default function WalletPage() {
  const { data: wallet, isLoading } = useWallet(1, 50);
  const [chargeOpen, setChargeOpen] = React.useState(false);
  const [gateways, setGateways] = React.useState<PaymentGateway[]>([]);

  React.useEffect(() => {
    paymentGatewaysService.list().then(setGateways).catch(() => {});
  }, []);

  const transactions = wallet?.transactions ?? [];
  const balance = wallet?.balance ?? 0;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "کیف پول", url: "/account/wallet" },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">کیف پول</h1>
        <Button onClick={() => setChargeOpen(true)}>
          <Plus className="size-4" />
          شارژ کیف پول
        </Button>
      </div>

      {/* Balance card */}
      <Card className="overflow-hidden border-primary/30">
        <CardContent className="flex items-center gap-4 bg-gradient-to-l from-primary/5 to-transparent p-6">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WalletIcon className="size-7" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">موجودی فعلی</p>
            <p className="text-2xl font-bold text-foreground nums-fa">
              {isLoading ? "..." : formatToman(balance)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تاریخچه تراکنش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<WalletIcon className="size-12" />}
              title="تراکنشی وجود ندارد"
              description="با شارژ کیف پول، اولین تراکنش خود را ثبت کنید."
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const cfg = TX_TYPE_CONFIG[tx.type] ?? TX_TYPE_CONFIG.PURCHASE;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 p-3"
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                        cfg.isPositive
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {tx.description ?? cfg.label}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {cfg.label}
                        </Badge>
                        <span>{formatDateTimeFa(tx.createdAt)}</span>
                        {tx.orderId && (
                          <Link
                            href={`/account/orders/${tx.orderId}`}
                            className="text-primary hover:underline"
                          >
                            مشاهده سفارش
                          </Link>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold nums-fa ${
                        cfg.isPositive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {cfg.isPositive ? "+" : "-"}
                      {formatPrice(tx.amount)}
                      <span className="mr-1 text-xs font-normal text-muted-foreground">
                        تومان
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ChargeWalletDialog
        open={chargeOpen}
        onOpenChange={setChargeOpen}
        gateways={gateways}
      />
    </div>
  );
}

function ChargeWalletDialog({
  open,
  onOpenChange,
  gateways,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateways: PaymentGateway[];
}) {
  const [amount, setAmount] = React.useState<number>(100000);
  const [customAmount, setCustomAmount] = React.useState("");
  const [selectedGateway, setSelectedGateway] = React.useState("");
  const charge = useChargeWallet();

  React.useEffect(() => {
    if (gateways.length > 0 && !selectedGateway) {
      setSelectedGateway(gateways[0].slug);
    }
  }, [gateways, selectedGateway]);

  const finalAmount = customAmount ? Number(customAmount) : amount;

  const onCharge = () => {
    if (finalAmount < 10000) {
      toast.error("حداقل مبلغ شارژ ۱۰٬۰۰۰ تومان است");
      return;
    }
    if (!selectedGateway) {
      toast.error("درگاه پرداخت را انتخاب کنید");
      return;
    }
    charge.mutate({ amount: finalAmount, gatewaySlug: selectedGateway });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>شارژ کیف پول</DialogTitle>
          <DialogDescription>
            مبلغ موردنظر را انتخاب کنید. پس از پرداخت موفق، مبلغ به کیف پول شما اضافه می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick amounts */}
          <div>
            <Label className="mb-2 block text-sm font-medium">مبلغ سریع</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                    !customAmount && amount === amt
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {toPersianDigits(amt.toLocaleString("fa-IR"))}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <Label className="mb-2 block text-sm font-medium">مبلغ دلخواه (تومان)</Label>
            <Input
              type="number"
              dir="ltr"
              className="text-left"
              placeholder="مثال: 250000"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={10000}
            />
          </div>

          {/* Gateway selection */}
          {gateways.length > 0 && (
            <div>
              <Label className="mb-2 block text-sm font-medium">درگاه پرداخت</Label>
              <RadioGroup
                value={selectedGateway}
                onValueChange={setSelectedGateway}
                className="space-y-2"
              >
                {gateways.map((g) => (
                  <label
                    key={g.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-border p-3 hover:border-primary/40"
                  >
                    <RadioGroupItem value={g.slug} />
                    <span className="text-sm font-medium">{g.name}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">مبلغ قابل پرداخت:</span>
            <span className="text-lg font-bold nums-fa">
              {toPersianDigits(finalAmount.toLocaleString("fa-IR"))} تومان
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={onCharge}
            disabled={charge.isPending || finalAmount < 10000 || !selectedGateway}
          >
            {charge.isPending ? "در حال انتقال..." : "ادامه به درگاه"}
            {!charge.isPending && <ChevronLeft className="size-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

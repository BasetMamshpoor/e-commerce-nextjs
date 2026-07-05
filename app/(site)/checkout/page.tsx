"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Truck,
  Tag,
  CreditCard,
  Check,
  ChevronLeft,
  Wallet,
  Plus,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/common/auth-guard";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { AddressFormDialog } from "@/features/account/components/address-form-dialog";
import {
  useAddresses,
  useWallet,
} from "@/features/account/hooks";
import { useCart } from "@/features/cart/hooks";
import {
  useCreateOrder,
  useApplyDiscountCode,
} from "@/features/checkout/hooks";
import { shippingCompaniesService, paymentGatewaysService } from "@/services";
import type {
  Address,
  DiscountApplyResult,
  PaymentMethod,
  ShippingCompany,
  PaymentGateway,
} from "@/types/domain";
import { formatToman, formatPrice, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

type Step = "address" | "shipping" | "review" | "payment";

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "address", label: "آدرس", icon: <MapPin className="size-4" /> },
  { id: "shipping", label: "ارسال", icon: <Truck className="size-4" /> },
  { id: "review", label: "بررسی", icon: <Tag className="size-4" /> },
  { id: "payment", label: "پرداخت", icon: <CreditCard className="size-4" /> },
];

export default function CheckoutPage() {
  return (
    <AuthGuard redirectTo="/login">
      <CheckoutContent />
    </AuthGuard>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const { data: wallet } = useWallet();

  const [step, setStep] = React.useState<Step>("address");
  const [selectedAddressId, setSelectedAddressId] = React.useState<number | null>(null);
  const [selectedShippingId, setSelectedShippingId] = React.useState<number | null>(null);
  const [discountCode, setDiscountCode] = React.useState("");
  const [discountResult, setDiscountResult] = React.useState<DiscountApplyResult | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("GATEWAY");
  const [addressDialogOpen, setAddressDialogOpen] = React.useState(false);

  // Shipping companies + payment gateways (one-time fetch).
  const [shippingCompanies, setShippingCompanies] = React.useState<ShippingCompany[]>([]);
  const [gateways, setGateways] = React.useState<PaymentGateway[]>([]);
  React.useEffect(() => {
    shippingCompaniesService.list().then(setShippingCompanies).catch(() => {});
    paymentGatewaysService.list().then(setGateways).catch(() => {});
  }, []);

  // Auto-select first address + first shipping company.
  React.useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  React.useEffect(() => {
    if (shippingCompanies.length > 0 && !selectedShippingId) {
      setSelectedShippingId(shippingCompanies[0].id);
    }
  }, [shippingCompanies, selectedShippingId]);

  // Redirect to cart if empty.
  React.useEffect(() => {
    if (!cartLoading && cart && cart.items.length === 0) {
      router.replace("/cart");
    }
  }, [cartLoading, cart, router]);

  // Calculate totals (safe even if cart is empty).
  const cartTotal = cart?.total ?? 0;
  const selectedShipping = shippingCompanies.find((s) => s.id === selectedShippingId);
  const shippingCost = selectedShipping?.baseCost ?? 0;
  const discountAmount = discountResult?.discountAmount ?? 0;
  const payableTotal = Math.max(0, cartTotal - discountAmount + shippingCost);
  const walletBalance = wallet?.balance ?? 0;
  const canPayWithWallet = walletBalance >= payableTotal && payableTotal > 0;

  const applyDiscount = useApplyDiscountCode();
  const createOrder = useCreateOrder();

  // Auto-switch payment method if wallet can't cover.
  React.useEffect(() => {
    if (paymentMethod === "WALLET" && !canPayWithWallet && payableTotal > 0) {
      setPaymentMethod("GATEWAY");
    }
  }, [paymentMethod, canPayWithWallet, payableTotal]);

  if (cartLoading || addressesLoading) {
    return <CheckoutSkeleton />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-site py-12">
        <EmptyState
          icon={<ShoppingBag className="size-16" />}
          title="سبد خرید شما خالی است"
          description="برای ادامه خرید، ابتدا محصولاتی را به سبد اضافه کنید."
          action={
            <Button asChild>
              <Link href="/products">مشاهده محصولات</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  const onApplyDiscount = () => {
    if (!discountCode.trim()) return;
    applyDiscount.mutate(discountCode, {
      onSuccess: (data) => {
        setDiscountResult(data);
        setDiscountCode("");
      },
      onError: () => {
        setDiscountResult(null);
      },
    });
  };

  const onPlaceOrder = () => {
    if (!selectedAddressId || !selectedShippingId) {
      toast.error("آدرس و روش ارسال را انتخاب کنید");
      return;
    }
    const gatewaySlug = paymentMethod !== "WALLET" ? gateways[0]?.slug : undefined;
    if (paymentMethod !== "WALLET" && !gatewaySlug) {
      toast.error("درگاه پرداخت در دسترس نیست");
      return;
    }
    createOrder.mutate({
      addressId: selectedAddressId,
      shippingCompanyId: selectedShippingId,
      paymentMethod,
      gatewaySlug,
      discountCode: discountResult?.code,
    });
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "سبد خرید", url: "/cart" },
          { name: "تسویه حساب", url: "/checkout" },
        ]}
      />

      <h1 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">تسویه حساب</h1>

      {/* Stepper */}
      <div className="mb-6 flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isDone = i < currentStepIndex;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => {
                  if (i <= currentStepIndex) setStep(s.id);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  {isDone ? <Check className="size-3" /> : toPersianDigits(i + 1)}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px flex-1", isDone ? "bg-primary" : "bg-border")} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Step: Address */}
          {step === "address" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-5 text-primary" />
                  انتخاب آدرس تحویل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses && addresses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="mb-3 text-sm text-muted-foreground">
                      هنوز آدرسی ثبت نکرده‌اید
                    </p>
                    <Button onClick={() => setAddressDialogOpen(true)}>
                      <Plus className="size-4" />
                      افزودن آدرس جدید
                    </Button>
                  </div>
                ) : (
                  <>
                    {addresses?.map((addr) => (
                      <AddressRadioCard
                        key={addr.id}
                        address={addr}
                        selected={addr.id === selectedAddressId}
                        onSelect={() => setSelectedAddressId(addr.id)}
                        onEdit={() => setAddressDialogOpen(true)}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddressDialogOpen(true)}
                    >
                      <Plus className="size-4" />
                      افزودن آدرس جدید
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step: Shipping */}
          {step === "shipping" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="size-5 text-primary" />
                  انتخاب روش ارسال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shippingCompanies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    در حال حاضر روش ارسالی موجود نیست.
                  </p>
                ) : (
                  shippingCompanies.map((sc) => (
                    <ShippingRadioCard
                      key={sc.id}
                      company={sc}
                      selected={sc.id === selectedShippingId}
                      onSelect={() => setSelectedShippingId(sc.id)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Step: Review */}
          {step === "review" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="size-5 text-primary" />
                  مرور سفارش و کد تخفیف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Discount code */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">کد تخفیف</Label>
                  {discountResult ? (
                    <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-success">
                          کد «{discountResult.code}» اعمال شد
                        </span>
                        <span className="mr-2 text-muted-foreground nums-fa">
                          ({toPersianDigits(discountResult.discountAmount)} تومان تخفیف)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive"
                        onClick={() => {
                          setDiscountResult(null);
                        }}
                      >
                        حذف
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="مثال: WELCOME20"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        dir="ltr"
                        className="text-left"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onApplyDiscount}
                        disabled={applyDiscount.isPending || !discountCode.trim()}
                      >
                        {applyDiscount.isPending && <Loader2 className="size-4 animate-spin" />}
                        اعمال
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cart items review */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">اقلام سفارش</h4>
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs nums-fa">
                          {toPersianDigits(item.quantity)}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{item.productName}</p>
                          {item.attributesLabel && (
                            <p className="text-xs text-muted-foreground">
                              {item.attributesLabel}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-medium nums-fa">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Address + shipping summary */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/30 p-3 text-sm">
                    <p className="mb-1 flex items-center gap-1 font-medium text-foreground">
                      <MapPin className="size-3.5 text-primary" />
                      آدرس تحویل
                    </p>
                    {selectedAddress ? (
                      <>
                        <p className="text-muted-foreground">{selectedAddress.receiverName}</p>
                        <p className="text-muted-foreground">
                          {selectedAddress.province}، {selectedAddress.city}
                        </p>
                        <p className="text-muted-foreground">{selectedAddress.fullAddress}</p>
                      </>
                    ) : (
                      <p className="text-destructive">آدرسی انتخاب نشده</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3 text-sm">
                    <p className="mb-1 flex items-center gap-1 font-medium text-foreground">
                      <Truck className="size-3.5 text-primary" />
                      روش ارسال
                    </p>
                    {selectedShipping ? (
                      <>
                        <p className="text-muted-foreground">{selectedShipping.name}</p>
                        {selectedShipping.estimatedDaysMin && (
                          <p className="text-muted-foreground">
                            تحویل: {toPersianDigits(selectedShipping.estimatedDaysMin)}
                            {selectedShipping.estimatedDaysMax
                              ? ` تا ${toPersianDigits(selectedShipping.estimatedDaysMax)}`
                              : ""}{" "}
                            روز
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-destructive">روش ارسالی انتخاب نشده</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Payment */}
          {step === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="size-5 text-primary" />
                  روش پرداخت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <PaymentOptionCard
                    value="GATEWAY"
                    selected={paymentMethod === "GATEWAY"}
                    icon={<CreditCard className="size-5" />}
                    title="پرداخت آنلاین (درگاه)"
                    description={`مبلغ ${formatPrice(payableTotal)} تومان از درگاه بانکی پرداخت می‌شود`}
                  />
                  <PaymentOptionCard
                    value="WALLET"
                    selected={paymentMethod === "WALLET"}
                    icon={<Wallet className="size-5" />}
                    title="پرداخت از کیف پول"
                    description={
                      canPayWithWallet
                        ? `موجودی شما: ${formatPrice(walletBalance)} تومان`
                        : `موجودی ناکافی (${formatPrice(walletBalance)} تومان)`
                    }
                    disabled={!canPayWithWallet}
                  />
                  <PaymentOptionCard
                    value="MIXED"
                    selected={paymentMethod === "MIXED"}
                    icon={<CreditCard className="size-5" />}
                    title="پرداخت ترکیبی (کیف پول + درگاه)"
                    description={
                      canPayWithWallet
                        ? "کل مبلغ از کیف پول کسر می‌شود"
                        : `${formatPrice(walletBalance)} تومان از کیف پول، ${formatPrice(
                            payableTotal - walletBalance,
                          )} تومان از درگاه`
                    }
                    disabled={walletBalance === 0}
                  />
                </RadioGroup>

                <div className="rounded-lg bg-info/10 p-3 text-xs text-info">
                  <AlertCircle className="mb-1 size-4" />
                  {paymentMethod === "WALLET" && "سفارش بلافاصله پس از پرداخت پردازش می‌شود."}
                  {paymentMethod === "GATEWAY" &&
                    "پس از ثبت سفارش، به درگاه پرداخت منتقل می‌شوید."}
                  {paymentMethod === "MIXED" &&
                    "مبلغ کیف پول بلافاصله کسر می‌شود؛ بقیه از درگاه پرداخت می‌شود."}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            {currentStepIndex > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(STEPS[currentStepIndex - 1].id)}
              >
                <ChevronLeft className="size-4 rotate-180" />
                مرحله قبل
              </Button>
            ) : (
              <Button asChild variant="ghost">
                <Link href="/cart">
                  <ChevronLeft className="size-4 rotate-180" />
                  بازگشت به سبد
                </Link>
              </Button>
            )}

            {currentStepIndex < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(STEPS[currentStepIndex + 1].id)}
                disabled={
                  (step === "address" && !selectedAddressId) ||
                  (step === "shipping" && !selectedShippingId)
                }
              >
                مرحله بعد
                <ChevronLeft className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={onPlaceOrder}
                disabled={createOrder.isPending}
                size="lg"
              >
                {createOrder.isPending && <Loader2 className="size-4 animate-spin" />}
                ثبت سفارش
                <Check className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-32 border-border/60">
            <CardHeader>
              <CardTitle className="text-base">خلاصه سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع کالاها</span>
                <span className="nums-fa">{formatPrice(cart.subtotal)}</span>
              </div>
              {cart.totalDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>تخفیف کالاها</span>
                  <span className="nums-fa">- {formatPrice(cart.totalDiscount)}</span>
                </div>
              )}
              {discountResult && discountResult.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>کد تخفیف ({discountResult.code})</span>
                  <span className="nums-fa">- {formatPrice(discountResult.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">هزینه ارسال</span>
                <span className="nums-fa">
                  {selectedShipping ? formatPrice(selectedShipping.baseCost) : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>مبلغ قابل پرداخت</span>
                <span className="nums-fa">{formatToman(payableTotal)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Address dialog */}
      <AddressFormDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        address={null}
      />
    </div>
  );
}

/* ───────── Sub-components ───────── */

function AddressRadioCard({
  address,
  selected,
  onSelect,
  onEdit,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border-2 p-4 text-right transition-all",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
              {address.title}
            </span>
            {address.isDefault && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                پیش‌فرض
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground">{address.receiverName}</p>
          <p className="text-sm text-muted-foreground" dir="ltr">
            {address.receiverPhone}
          </p>
          <p className="text-sm text-muted-foreground">
            {address.province}، {address.city} — {address.fullAddress}
          </p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            کد پستی: {address.postalCode}
          </p>
        </div>
        <div
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {selected && <Check className="size-3" />}
        </div>
      </div>
    </button>
  );
}

function ShippingRadioCard({
  company,
  selected,
  onSelect,
}: {
  company: ShippingCompany;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border-2 p-4 text-right transition-all",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Truck className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{company.name}</p>
          {company.estimatedDaysMin && (
            <p className="text-xs text-muted-foreground">
              تحویل {toPersianDigits(company.estimatedDaysMin)}
              {company.estimatedDaysMax
                ? ` تا ${toPersianDigits(company.estimatedDaysMax)}`
                : ""}{" "}
              روز کاری
            </p>
          )}
        </div>
      </div>
      <div className="text-left">
        <p className="font-bold nums-fa">{formatPrice(company.baseCost)}</p>
        <p className="text-xs text-muted-foreground">تومان</p>
      </div>
    </button>
  );
}

function PaymentOptionCard({
  value,
  selected,
  icon,
  title,
  description,
  disabled,
}: {
  value: string;
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <Label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <RadioGroupItem value={value} disabled={disabled} />
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Label>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="container-site py-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-48" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

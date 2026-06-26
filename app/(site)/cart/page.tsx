"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
  AlertCircle,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { QuantitySelector } from "@/components/common/quantity-selector";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@/features/cart/hooks";
import { useAuth } from "@/providers/auth-context";
import { formatToman, toPersianDigits, formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-site py-6">
        <Breadcrumb
          items={[
            { name: "خانه", url: "/" },
            { name: "سبد خرید", url: "/cart" },
          ]}
        />
        <EmptyState
          icon={<ShoppingBag className="size-16" />}
          title="سبد خرید شما خالی است"
          description="برای ادامه خرید، محصولات موردنظر خود را به سبد اضافه کنید."
          action={
            <Button asChild>
              <Link href="/products">
                مشاهده محصولات
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          }
          className="mt-6 border border-dashed border-border rounded-xl"
        />
      </div>
    );
  }

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "سبد خرید", url: "/cart" },
        ]}
      />

      <h1 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">
        سبد خرید
        <span className="mr-2 text-sm font-normal text-muted-foreground">
          ({toPersianDigits(cart.itemCount)} کالا)
        </span>
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items list */}
        <div className="space-y-3 lg:col-span-2">
          {!isAuthenticated && (
            <div className="flex items-center gap-2 rounded-lg bg-info/10 px-4 py-3 text-sm text-info">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                شما به‌عنوان مهمان در حال خرید هستید.{" "}
                <Link href="/login?redirect=/cart" className="font-medium underline">
                  وارد شوید
                </Link>{" "}
                تا سبد شما ذخیره شود.
              </span>
            </div>
          )}

          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}

          <div className="flex justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link href="/products">
                <ArrowLeft className="size-4" />
                ادامه خرید
              </Link>
            </Button>
            <ClearCartButton />
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <CartSummary cart={cart} />
        </div>
      </div>
    </div>
  );
}

function CartItemRow({ item }: { item: import("@/types/domain").CartItem }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const [qty, setQty] = React.useState(item.quantity);

  // Sync local state when server updates (e.g. after wasAdjusted).
  React.useEffect(() => {
    setQty(item.quantity);
  }, [item.quantity]);

  const onQtyChange = (next: number) => {
    setQty(next);
    if (next !== item.quantity) {
      update.mutate({ itemId: item.id, quantity: next });
    }
  };

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Image */}
        <Link
          href={`/products/${item.productSlug}`}
          className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.productName}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ShoppingBag className="size-6 opacity-30" />
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/products/${item.productSlug}`}
                className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary sm:text-base"
              >
                {item.productName}
              </Link>
              {item.attributesLabel && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.attributesLabel}
                </p>
              )}
              {!item.isAvailable && (
                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  موجودی ناکافی — موجودی فعلی: {toPersianDigits(item.availableStock)}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove.mutate(item.id)}
              disabled={remove.isPending}
              aria-label="حذف از سبد"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
            <QuantitySelector
              value={qty}
              onChange={onQtyChange}
              min={1}
              max={item.availableStock || 99}
              disabled={update.isPending}
              size="sm"
            />

            <div className="text-left">
              {item.unitPrice < item.originalPrice && (
                <p className="text-xs text-muted-foreground line-through nums-fa">
                  {formatPrice(item.originalPrice)}
                </p>
              )}
              <p className="text-sm font-bold text-foreground nums-fa">
                {formatPrice(item.lineTotal)}
                <span className="mr-1 text-xs font-normal text-muted-foreground">تومان</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClearCartButton() {
  const clear = useClearCart();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-destructive"
      onClick={() => clear.mutate()}
      disabled={clear.isPending}
    >
      <Trash2 className="size-4" />
      خالی کردن سبد
    </Button>
  );
}

function CartSummary({ cart }: { cart: import("@/types/domain").Cart }) {
  const { isAuthenticated } = useAuth();
  const [discountCode, setDiscountCode] = React.useState("");
  const [applying, setApplying] = React.useState(false);

  const onApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim()) return;
    setApplying(true);
    // Discount code is applied at order-creation time per api.md,
    // but we can preview it via POST /discount-codes/apply. For now,
    // we just store it in local state and pass it on to checkout.
    setTimeout(() => {
      setApplying(false);
      // Toast will be handled in checkout phase.
    }, 500);
  };

  const shippingCost = cart.total >= 500000 ? 0 : 45000;
  const grandTotal = cart.total + shippingCost;

  return (
    <Card className="sticky top-32 border-border/60">
      <CardHeader>
        <CardTitle className="text-base">خلاصه سفارش</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Discount code */}
        <form onSubmit={onApplyDiscount} className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Tag className="size-4 text-primary" />
            کد تخفیف
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="مثال: WELCOME20"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="text-sm"
              dir="ltr"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={applying || !discountCode.trim()}
            >
              اعمال
            </Button>
          </div>
        </form>

        <Separator />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">جمع کالاها</span>
            <span className="nums-fa">{formatToman(cart.subtotal)}</span>
          </div>
          {cart.totalDiscount > 0 && (
            <div className="flex justify-between text-success">
              <span>تخفیف کالاها</span>
              <span className="nums-fa">- {formatToman(cart.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">هزینه ارسال</span>
            {shippingCost === 0 ? (
              <span className="text-success">رایگان</span>
            ) : (
              <span className="nums-fa">{formatPrice(shippingCost)} تومان</span>
            )}
          </div>
          {shippingCost > 0 && cart.total < 500000 && (
            <p className="rounded-md bg-warning/10 px-2 py-1 text-xs text-warning">
              با خرید {toPersianDigits(formatPrice(500000 - cart.total))} تومان دیگر، ارسال رایگان می‌شود!
            </p>
          )}
        </div>

        <Separator />

        <div className="flex justify-between text-base font-bold">
          <span>مبلغ قابل پرداخت</span>
          <span className="nums-fa">{formatToman(grandTotal)}</span>
        </div>

        <Button asChild size="lg" className="mt-2 w-full">
          <Link href={isAuthenticated ? "/checkout" : "/login?redirect=/checkout"}>
            ادامه فرآیند خرید
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        {!isAuthenticated && (
          <p className="text-center text-xs text-muted-foreground">
            برای تکمیل خرید باید{" "}
            <Link href="/login?redirect=/checkout" className="text-primary hover:underline">
              وارد شوید
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CartSkeleton() {
  return (
    <div className="container-site py-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-48" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}

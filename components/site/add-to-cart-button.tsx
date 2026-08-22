"use client";

import * as React from "react";
import { ShoppingCart, Loader2, Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from "@/features/cart/hooks";
import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  variantId: number;
  quantity?: number;
  /** Cap for the quantity stepper — usually the variant's available stock. */
  maxQuantity?: number;
  /** Disable (e.g. out of stock). */
  disabled?: boolean;
  /** Full-width button. */
  fullWidth?: boolean;
  /** Show with icon. */
  showIcon?: boolean;
  /** Custom label. */
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary";
}

/**
 * Add-to-cart control that reflects actual cart state instead of always
 * being a plain "افزودن به سبد" button: if the variant isn't in the cart
 * yet, it's the add button; once it is, it becomes a quantity stepper
 * (+/-) so there's a single control per variant instead of two
 * disconnected pieces of UI (an "add" button that keeps working even
 * after the item is already in the cart, with no visible way to see or
 * change the quantity from here). Decrementing from 1 removes the item
 * (the minus button becomes a trash icon at that point).
 */
export function AddToCartButton({
  variantId,
  quantity = 1,
  maxQuantity,
  disabled,
  fullWidth,
  showIcon = true,
  label = "افزودن به سبد",
  className,
  size = "sm",
  variant = "default",
}: AddToCartButtonProps) {
  const { data: cart } = useCart();
  const add = useAddToCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  const cartItem = cart?.items.find((it) => it.variantId === variantId);
  const stockCap = maxQuantity ?? cartItem?.availableStock ?? 99;
  const isPending = update.isPending || remove.isPending;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || add.isPending) return;
    add.mutate({ variantId, quantity });
  };

  const onIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem || isPending) return;
    if (cartItem.quantity >= stockCap) return;
    update.mutate({ itemId: cartItem.id, quantity: cartItem.quantity + 1 });
  };

  const onDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem || isPending) return;
    if (cartItem.quantity <= 1) {
      remove.mutate(cartItem.id);
    } else {
      update.mutate({ itemId: cartItem.id, quantity: cartItem.quantity - 1 });
    }
  };

  // Already in the cart — quantity stepper instead of an add button.
  if (cartItem) {
    const isCompact = size === "icon";
    return (
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-full border border-primary bg-primary text-primary-foreground",
          isCompact ? "h-9" : "h-9",
          fullWidth && !isCompact && "w-full justify-between",
          className,
        )}
        onClick={(e) => e.preventDefault()}
      >
        <button
          type="button"
          onClick={onDecrement}
          disabled={isPending}
          aria-label={cartItem.quantity <= 1 ? "حذف از سبد" : "کاهش تعداد"}
          className="flex h-full w-8 shrink-0 items-center justify-center transition-colors hover:bg-primary-foreground/20 disabled:opacity-50"
        >
          {cartItem.quantity <= 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
        </button>
        <span className="min-w-5 px-1 text-center text-xs font-bold nums-fa">
          {isPending ? <Loader2 className="mx-auto size-3 animate-spin" /> : toPersianDigits(cartItem.quantity)}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={isPending || cartItem.quantity >= stockCap}
          aria-label="افزایش تعداد"
          className="flex h-full w-8 shrink-0 items-center justify-center transition-colors hover:bg-primary-foreground/20 disabled:opacity-40"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onAdd}
      disabled={disabled || add.isPending}
      className={cn(fullWidth && "w-full", className)}
    >
      {add.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        showIcon && <ShoppingCart className="size-4" />
      )}
      {add.isPending ? "در حال افزودن..." : label}
    </Button>
  );
}

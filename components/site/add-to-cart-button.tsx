"use client";

import * as React from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/features/cart/hooks";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  variantId: string;
  quantity?: number;
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
 * Reusable add-to-cart button. Fires the cart mutation + toast.
 */
export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled,
  fullWidth,
  showIcon = true,
  label = "افزودن به سبد",
  className,
  size = "sm",
  variant = "default",
}: AddToCartButtonProps) {
  const add = useAddToCart();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || add.isPending) return;
    add.mutate({ variantId, quantity });
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
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

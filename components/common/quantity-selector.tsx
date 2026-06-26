"use client";

import * as React from "react";
import { Minus, Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Quantity selector with +/- buttons. Used in cart + product detail buy box.
 */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const btn = size === "sm" ? "size-8" : "size-9";
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-border",
        disabled && "opacity-50",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(btn, "rounded-l-none")}
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label="کاهش تعداد"
      >
        <Minus className="size-3" />
      </Button>
      <span
        className={cn(
          "text-center font-medium nums-fa tabular-nums",
          size === "sm" ? "w-8 text-xs" : "w-10 text-sm",
        )}
      >
        {value.toLocaleString("fa-IR")}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(btn, "rounded-r-none")}
        onClick={increment}
        disabled={disabled || value >= max}
        aria-label="افزایش تعداد"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}

/** Loading spinner button — used while a mutation is in flight. */
export function LoadingButton({
  loading,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button {...props} disabled={props.disabled || loading}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

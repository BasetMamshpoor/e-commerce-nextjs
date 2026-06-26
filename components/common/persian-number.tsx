"use client";

import * as React from "react";

import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

interface PersianNumberProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number | string;
  /** Wrap with `.nums-fa` for proper digit shaping (default: true). */
  fa?: boolean;
}

/** Render an integer/string with Persian digits. */
export function PersianNumber({
  value,
  fa = true,
  className,
  ...rest
}: PersianNumberProps) {
  return (
    <span className={cn(fa && "nums-fa", className)} {...rest}>
      {toPersianDigits(value)}
    </span>
  );
}

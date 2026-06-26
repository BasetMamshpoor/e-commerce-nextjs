"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/types/api";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

export function ErrorState({ error, onRetry, className, title }: ErrorStateProps) {
  const apiError = error instanceof ApiError ? error : null;
  const message =
    apiError?.message ??
    (error instanceof Error ? error.message : "خطای ناشناخته رخ داد.");

  const isBlocked = apiError?.isBlocked;
  const isRateLimited = apiError?.isRateLimited;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {title ?? (isBlocked ? "حساب شما مسدود شده است" : isRateLimited ? "تعداد درخواست‌ها زیاد بود" : "خطا در دریافت اطلاعات")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      {onRetry && !isBlocked && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw className="size-4" />
          تلاش مجدد
        </Button>
      )}
    </div>
  );
}

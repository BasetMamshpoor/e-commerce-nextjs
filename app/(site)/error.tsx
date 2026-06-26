"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">خطایی رخ داد</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          متأسفانه در بارگذاری این صفحه مشکلی پیش آمد. لطفاً دوباره تلاش کنید.
        </p>
      </div>
      <Button onClick={reset} variant="default">
        <RotateCcw className="size-4" />
        تلاش مجدد
      </Button>
    </div>
  );
}

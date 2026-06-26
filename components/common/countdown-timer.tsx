"use client";

import * as React from "react";

import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /** Target time (epoch ms or Date). */
  target: number | Date;
  /** Called when countdown reaches zero. */
  onExpire?: () => void;
  /** Render the elapsed/expired state. Default: "منقضی شد". */
  expiredLabel?: string;
  className?: string;
  /** Show seconds (default: true). */
  showSeconds?: boolean;
}

/**
 * Lightweight countdown timer that updates every second.
 * Used by OTP resend button + OTP code expiry display.
 */
export function CountdownTimer({
  target,
  onExpire,
  expiredLabel = "منقضی شد",
  className,
  showSeconds = true,
}: CountdownTimerProps) {
  const targetMs = typeof target === "number" ? target : target.getTime();
  const [now, setNow] = React.useState(Date.now());
  const expiredRef = React.useRef(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = Math.max(0, targetMs - now);
  const isExpired = remainingMs === 0;

  React.useEffect(() => {
    if (isExpired && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [isExpired, onExpire]);

  if (isExpired) {
    return <span className={cn("text-muted-foreground", className)}>{expiredLabel}</span>;
  }

  const totalSec = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;

  return (
    <span className={cn("nums-fa tabular-nums", className)}>
      {showSeconds
        ? `${toPersianDigits(String(minutes).padStart(2, "0"))}:${toPersianDigits(
            String(seconds).padStart(2, "0"),
          )}`
        : `${toPersianDigits(minutes)} دقیقه`}
    </span>
  );
}

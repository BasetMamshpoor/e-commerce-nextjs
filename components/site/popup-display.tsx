"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePopups } from "@/features/catalog/hooks/use-popups";
import { APP_CONFIG } from "@/constants/app";
import Image from "next/image";

/**
 * Show active promotional popups.
 * Respects `showOncePerSession` flag (closes for the rest of the browser session).
 */
export function PopupDisplay() {
  const { data: popups, isLoading } = usePopups();
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [dismissed, setDismissed] = React.useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    // Check sessionStorage for previously-dismissed-in-this-session popups.
    try {
      const raw = sessionStorage.getItem(APP_CONFIG.storageKeys.dismissedPopups);
      return new Set(raw ? (JSON.parse(raw) as number[]) : []);
    } catch {
      return new Set();
    }
  });

  // Pick the first non-dismissed popup to display.
  const visiblePopups = React.useMemo(
    () => (popups ?? []).filter((p) => !dismissed.has(p.id)),
    [popups, dismissed],
  );

  React.useEffect(() => {
    if (!isLoading && visiblePopups.length > 0 && openIndex === null) {
      // Slight delay so it doesn't appear instantly on page load.
      const timer = setTimeout(() => setOpenIndex(0), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, visiblePopups.length, openIndex]);

  const handleOpenChange = (open: boolean) => {
    if (!open && visiblePopups[openIndex ?? 0]) {
      const popup = visiblePopups[openIndex ?? 0];
      const newDismissed = new Set(dismissed);
      newDismissed.add(popup.id);
      setDismissed(newDismissed);
      if (typeof window !== "undefined" && popup.showOncePerSession) {
        try {
          sessionStorage.setItem(
            APP_CONFIG.storageKeys.dismissedPopups,
            JSON.stringify(Array.from(newDismissed)),
          );
        } catch {
          // ignore quota errors
        }
      }
      setOpenIndex(null);
    }
  };

  if (visiblePopups.length === 0 || openIndex === null) return null;
  const popup = visiblePopups[openIndex];
  if (!popup) return null;

  return (
    <Dialog open={!!popup} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{popup.title}</DialogTitle>
          <DialogDescription>{popup.content}</DialogDescription>
        </DialogHeader>
        <button
          aria-label="بستن"
          onClick={() => handleOpenChange(false)}
          className="absolute left-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur hover:bg-background hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        {popup.mediaUrl && (
          <Link
            href={popup.link ?? "#"}
            onClick={() => handleOpenChange(false)}
            className="block"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <Image
                src={popup.mediaUrl}
                alt={popup.title}
                fill unoptimized
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
            />
            </div>
          </Link>
        )}
        <div className="space-y-3 p-6">
          <h2 className="text-xl font-bold text-foreground">{popup.title}</h2>
          <p className="text-sm text-muted-foreground">{popup.content}</p>
          {popup.link && (
            <Button asChild className="w-full">
              <Link href={popup.link} onClick={() => handleOpenChange(false)}>
                مشاهده جزئیات
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

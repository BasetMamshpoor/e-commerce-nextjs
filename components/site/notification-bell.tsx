"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-context";
import {
  useUnreadNotificationsCount,
  useNotifications,
  useMarkNotificationRead,
} from "@/features/notifications/hooks";
import { toPersianDigits, formatRelativeFa } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/types/domain";

const TYPE_DOT_COLORS: Record<NotificationType, string> = {
  ORDER: "bg-info",
  SYSTEM: "bg-muted-foreground",
  TICKET: "bg-warning",
  PROMOTION: "bg-primary",
  WALLET: "bg-success",
  COMMENT: "bg-muted-foreground",
};

export function NotificationBell({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.count ?? 0;
  const [open, setOpen] = React.useState(false);

  if (!isAuthenticated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label="نوتیفیکیشن‌ها"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {toPersianDigits(unreadCount > 99 ? "۹۹+" : unreadCount)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <NotificationPopoverContent onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function NotificationPopoverContent({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useNotifications({ limit: 5 });
  const markRead = useMarkNotificationRead();
  const notifications = data?.items ?? [];

  return (
    <div className="flex max-h-[400px] flex-col">
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="text-sm font-medium text-foreground">نوتیفیکیشن‌ها</span>
        <Link
          href="/account/notifications"
          onClick={onClose}
          className="text-xs text-primary hover:underline"
        >
          مشاهده همه
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              نوتیفیکیشنی وجود ندارد
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.isRead) markRead.mutate(n.id);
                if (n.link) {
                  onClose();
                  // Let parent handle navigation via Link
                }
              }}
              className={cn(
                "flex w-full items-start gap-2 border-b border-border/40 p-3 text-right transition-colors hover:bg-accent/40",
                !n.isRead && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  TYPE_DOT_COLORS[n.type] ?? "bg-muted-foreground",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {n.title}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {n.message}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatRelativeFa(n.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-border p-2">
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/account/notifications" onClick={onClose}>
            همه نوتیفیکیشن‌ها
          </Link>
        </Button>
      </div>
    </div>
  );
}

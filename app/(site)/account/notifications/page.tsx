"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  MessageSquare,
  Ticket,
  Wallet,
  AlertCircle,
  Megaphone,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useUnreadNotificationsCount,
} from "@/features/notifications/hooks";
import { formatRelativeFa, formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { NotificationType } from "@/types/domain";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  ORDER: { icon: <Package className="size-4" />, color: "bg-info/10 text-info" },
  SYSTEM: { icon: <AlertCircle className="size-4" />, color: "bg-muted text-muted-foreground" },
  TICKET: { icon: <Ticket className="size-4" />, color: "bg-warning/10 text-warning" },
  PROMOTION: { icon: <Megaphone className="size-4" />, color: "bg-primary/10 text-primary" },
  WALLET: { icon: <Wallet className="size-4" />, color: "bg-success/10 text-success" },
  COMMENT: { icon: <MessageSquare className="size-4" />, color: "bg-muted text-muted-foreground" },
};

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markAll = useMarkAllNotificationsRead();
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.count ?? 0;
  const notifications = data?.items ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "نوتیفیکیشن‌ها", url: "/account/notifications" },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          نوتیفیکیشن‌ها
          {unreadCount > 0 && (
            <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground nums-fa">
              {toPersianDigits(unreadCount)} جدید
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            {markAll.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            خواندن همه
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-16" />}
          title="نوتیفیکیشنی وجود ندارد"
          description="نوتیفیکیشن‌های مربوط به سفارش‌ها، کیف پول و تخفیف‌ها در این صفحه نمایش داده می‌شوند."
          className="border border-dashed border-border rounded-xl"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
}: {
  notification: import("@/types/domain").AppNotification;
}) {
  const markRead = useMarkNotificationRead();
  const del = useDeleteNotification();
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.SYSTEM;

  const content = (
    <Card
      className={cn(
        "border-border/60 transition-colors hover:border-primary/30",
        !notification.isRead && "border-primary/30 bg-primary/5",
      )}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            cfg.color,
          )}
        >
          {cfg.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{notification.title}</p>
            {!notification.isRead && (
              <span className="size-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelativeFa(notification.createdAt)}
            <span className="mx-2">•</span>
            {formatDateTimeFa(notification.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markRead.mutate(notification.id);
              }}
              aria-label="خواندن"
            >
              <CheckCheck className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              del.mutate(notification.id);
            }}
            aria-label="حذف"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={() => {
          // Clicking through to the linked content implies the
          // notification has been seen — previously only the explicit
          // checkmark button marked it read, so a notification could sit
          // "unread" forever even after the user had already acted on it.
          if (!notification.isRead) markRead.mutate(notification.id);
        }}
      >
        {content}
      </Link>
    );
  }
  return content;
}

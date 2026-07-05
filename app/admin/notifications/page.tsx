"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  RotateCcw,
  Wallet as WalletIcon,
  Ticket as TicketIcon,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import {
  useAdminNotifications,
  useAdminUnreadCount,
  useReadAdminNotification,
  useReadAllAdminNotifications,
} from "@/features/admin/hooks";
import { formatDateTimeFa, formatRelativeFa, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { AdminNotification } from "@/types/domain";

// Map notification type to icon and color
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  ORDER: { icon: <ShoppingBag className="size-5" />, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/30" },
  RETURN: { icon: <RotateCcw className="size-5" />, color: "text-amber-600 bg-amber-100 dark:bg-amber-950/30" },
  WITHDRAWAL: { icon: <WalletIcon className="size-5" />, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/30" },
  TICKET: { icon: <TicketIcon className="size-5" />, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/30" },
  SYSTEM: { icon: <AlertTriangle className="size-5" />, color: "text-destructive bg-destructive/10" },
};

const TYPE_LABEL: Record<string, string> = {
  ORDER: "سفارش",
  RETURN: "مرجوعی",
  WITHDRAWAL: "برداشت",
  TICKET: "تیکت",
  SYSTEM: "سیستم",
};

export default function AdminNotificationsPage() {
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const { data, isLoading, isFetching, refetch } = useAdminNotifications({
    page: 1,
    limit: 50,
    isRead: filter === "unread" ? false : undefined,
  });
  const { data: unreadData } = useAdminUnreadCount();
  const readMutation = useReadAdminNotification();
  const readAllMutation = useReadAllAdminNotifications();

  const items = data?.items ?? [];
  const unreadCount = unreadData?.count ?? 0;

  const handleClick = (n: AdminNotification) => {
    if (!n.isRead) readMutation.mutate(n.id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Bell className="size-5 text-primary" />
            اعلان‌های ادمین
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            رویدادهای مهم سیستم: سفارش جدید، مرجوعی، درخواست برداشت و ...
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            به‌روزرسانی
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending || unreadCount === 0}
          >
            <CheckCheck className="size-4" />
            خواندن همه ({toPersianDigits(unreadCount)})
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          همه
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            filter === "unread"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          نخوانده ({toPersianDigits(unreadCount)})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-12" />}
          title="اعلانی وجود ندارد"
          description={filter === "unread" ? "همه اعلان‌ها خوانده شده‌اند." : "هنوز اعلانی ثبت نشده است."}
          className="py-16"
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
            const label = TYPE_LABEL[n.type] ?? n.type;
            return (
              <Card
                key={n.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-accent/30",
                  !n.isRead && "border-primary/40 bg-primary/5"
                )}
              >
                <Link
                  href={n.link ?? "#"}
                  onClick={() => handleClick(n)}
                  className="block"
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", cfg.color)}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{n.title}</p>
                        <Badge variant="outline" className="text-[10px]">{label}</Badge>
                        {!n.isRead && (
                          <span className="size-2 rounded-full bg-primary" aria-label="خوانده نشده" />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {formatRelativeFa(n.createdAt)} · {formatDateTimeFa(n.createdAt)}
                      </p>
                    </div>
                    {n.link && (
                      <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

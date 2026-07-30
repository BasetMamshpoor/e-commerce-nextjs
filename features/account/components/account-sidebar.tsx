"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  ShieldCheck,
  Wallet,
  MapPin,
  Package,
  Ticket,
  Bell,
  LogOut,
  ChevronLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-context";
import { useLogout } from "@/features/auth/hooks";
import { useUnreadNotificationsCount } from "@/features/notifications/hooks";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toPersianDigits } from "@/utils/format";

const NAV_ITEMS = [
  { href: "/account", label: "داشبورد", icon: LayoutDashboard },
  { href: "/account/profile", label: "پروفایل", icon: User },
  { href: "/account/security", label: "امنیت", icon: ShieldCheck },
  { href: "/account/wallet", label: "کیف پول", icon: Wallet },
  { href: "/account/addresses", label: "آدرس‌ها", icon: MapPin },
  { href: "/account/orders", label: "سفارش‌ها", icon: Package },
  { href: "/account/tickets", label: "تیکت‌ها", icon: Ticket },
  { href: "/account/notifications", label: "نوتیفیکیشن‌ها", icon: Bell },
] as const;

export function AccountSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.count ?? 0;
  const logout = useLogout();

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  const initials = (user?.fullName ?? "؟")
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("");

  return (
    <aside className="space-y-4">
      {/* User card — hidden on mobile (shown in horizontal nav) */}
      <div className="hidden lg:flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
        <Avatar className="size-12 border border-border">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.fullName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user?.fullName ?? "کاربر"}
          </p>
          <p className="truncate text-xs text-muted-foreground" dir="ltr">
            {user?.email ?? user?.phone ?? ""}
          </p>
        </div>
      </div>

      {/* Nav — horizontal scroll on mobile, vertical on desktop */}
      <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const showBadge = item.href === "/account/notifications" && unreadCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors lg:gap-3 lg:w-full",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="lg:flex-1">{item.label}</span>
              {showBadge && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-primary-foreground px-1 text-[10px] font-bold text-primary nums-fa">
                  {toPersianDigits(unreadCount > 99 ? "۹۹+" : unreadCount)}
                </span>
              )}
              {active && <ChevronLeft className="hidden size-4 lg:block" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout — desktop only (mobile uses header menu) */}
      <Button
        variant="outline"
        className="hidden w-full justify-start text-destructive hover:text-destructive lg:flex"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        <LogOut className="size-4" />
        خروج از حساب
      </Button>
    </aside>
  );
}

export function AccountSidebarSkeleton() {
  return (
    <aside className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </aside>
  );
}

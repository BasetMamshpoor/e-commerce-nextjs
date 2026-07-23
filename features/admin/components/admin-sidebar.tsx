"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Image as ImageIcon,
  FolderTree,
  Tag,
  Settings,
  Ticket,
  MessageSquare,
  Megaphone,
  Image as ImageBannerIcon,
  ShieldBan,
  Percent,
  LogOut,
  ChevronLeft,
  Store,
  Menu,
  X,
  Bell,
  Film,
  Mail,
  Wallet,
  CreditCard,
  TrendingUp,
  Truck,
  MessageCircle,
  FileText as FileTextIcon,
  Coins,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-context";
import { useLogout } from "@/features/auth/hooks";
import { useUnreadNotificationsCount } from "@/features/notifications/hooks";
import { useAdminUnreadCount } from "@/features/admin/hooks";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { APP_NAME } from "@/constants/app";
import { toPersianDigits } from "@/utils/format";

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; roles?: string[] }[];
}[] = [
  {
    label: "اصلی",
    items: [
      { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "تحلیل و گزارش‌ها", icon: TrendingUp, roles: ["ADMIN"] },
      { href: "/admin/notifications", label: "اعلان‌های ادمین", icon: Bell },
    ],
  },
  {
    label: "کاتالوگ",
    items: [
      { href: "/admin/products", label: "محصولات", icon: Package },
      { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
      { href: "/admin/brands", label: "برندها", icon: Tag },
      { href: "/admin/attributes", label: "ویژگی‌ها", icon: Settings },
      { href: "/admin/media", label: "رسانه‌ها", icon: ImageIcon },
      { href: "/admin/currencies", label: "ارزها", icon: Coins },
    ],
  },
  {
    label: "فروش",
    items: [
      { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
      { href: "/admin/discount-codes", label: "کدهای تخفیف", icon: Percent },
      { href: "/admin/withdrawals", label: "برداشت‌های کیف پول", icon: Wallet, roles: ["ADMIN"] },
      { href: "/admin/shipping-companies", label: "شرکت‌های ارسال", icon: Truck },
      { href: "/admin/payment-gateways", label: "درگاه‌های پرداخت", icon: CreditCard, roles: ["ADMIN"] },
    ],
  },
  {
    label: "کاربران",
    items: [
      { href: "/admin/users", label: "کاربران", icon: Users },
      { href: "/admin/tickets", label: "تیکت‌ها", icon: Ticket },
      { href: "/admin/ticket-departments", label: "بخش‌های تیکت", icon: MessageCircle, roles: ["ADMIN"] },
      { href: "/admin/comments", label: "نظرات", icon: MessageSquare },
      { href: "/admin/broadcast", label: "ارسال اعلان گروهی", icon: Megaphone },
    ],
  },
  {
    label: "محتوا",
    items: [
      { href: "/admin/banners", label: "بنرها", icon: ImageBannerIcon },
      { href: "/admin/popups", label: "پاپ‌آپ‌ها", icon: Megaphone },
      { href: "/admin/stories", label: "استوری‌ها", icon: Film },
      { href: "/admin/blog", label: "وبلاگ", icon: FileTextIcon },
      { href: "/admin/newsletter", label: "خبرنامه", icon: Mail },
    ],
  },
  {
    label: "سیستم",
    items: [
      { href: "/admin/settings", label: "تنظیمات", icon: Settings, roles: ["ADMIN"] },
      { href: "/admin/blocked-ips", label: "مسدودسازی IP", icon: ShieldBan, roles: ["ADMIN"] },
    ],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSidebar({ open, onOpenChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const logout = useLogout();
  const userRole = user?.role ?? "CUSTOMER";

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Filter out items that the user's role can't access.
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(userRole)),
  })).filter((group) => group.items.length > 0);

  const initials = (user?.fullName ?? "؟")
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("");

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Store className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-sidebar-foreground">{APP_NAME}</p>
              <p className="text-[10px] text-muted-foreground">پنل مدیریت</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* User card */}
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 p-2.5">
            <Avatar className="size-9 border border-sidebar-border">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.fullName} />
              <AvatarFallback className="bg-sidebar-primary/10 text-xs font-bold text-sidebar-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user?.fullName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user?.role === "ADMIN" ? "مدیر کل" : user?.role === "EDITOR" ? "ویرایشگر" : user?.role === "SUPPORT" ? "پشتیبانی" : "کاربر"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div dir="rtl" className="flex-1 overflow-auto px-3 py-3">
          <nav className="space-y-5">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", active ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronLeft className="size-3.5" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <Link href="/">
                <Store className="size-4" />
                مشاهده فروشگاه
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/70 hover:text-destructive"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              aria-label="خروج"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ───────── Topbar ───────── */

export function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const { data: unreadData } = useUnreadNotificationsCount();
  const { data: adminUnreadData } = useAdminUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const adminUnread = adminUnreadData?.count ?? 0;
  const pathname = usePathname();

  // Generate page title from pathname.
  const pageTitle = React.useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return "داشبورد";
    const map: Record<string, string> = {
      products: "محصولات",
      categories: "دسته‌بندی‌ها",
      brands: "برندها",
      attributes: "ویژگی‌ها",
      media: "رسانه‌ها",
      currencies: "ارزها",
      orders: "سفارش‌ها",
      "discount-codes": "کدهای تخفیف",
      users: "کاربران",
      tickets: "تیکت‌ها",
      "ticket-departments": "بخش‌های تیکت",
      comments: "نظرات",
      banners: "بنرها",
      popups: "پاپ‌آپ‌ها",
      stories: "استوری‌ها",
      newsletter: "خبرنامه",
      settings: "تنظیمات",
      "blocked-ips": "مسدودسازی IP",
      withdrawals: "برداشت‌های کیف پول",
      notifications: "اعلان‌های ادمین",
      analytics: "تحلیل و گزارش‌ها",
      "payment-gateways": "درگاه‌های پرداخت",
      "shipping-companies": "شرکت‌های ارسال",
      broadcast: "ارسال اعلان گروهی",
      blog: "وبلاگ",
    };
    return map[parts[1]] ?? "پنل مدیریت";
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="اعلان‌های ادمین"
        >
          <Link href="/admin/notifications">
            <Bell className="size-5" />
            {adminUnread > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {toPersianDigits(adminUnread > 99 ? "۹۹+" : adminUnread)}
              </span>
            )}
          </Link>
        </Button>

        <Link
          href="/account"
          className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 transition-colors hover:bg-accent"
        >
          <Avatar className="size-7">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.fullName} />
            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
              {(user?.fullName ?? "؟").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-xs font-medium sm:inline">
            {user?.fullName}
          </span>
        </Link>
      </div>
    </header>
  );
}

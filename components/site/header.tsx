"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { CartBadge } from "./cart-badge";
import { WishlistBadge } from "./wishlist-badge";
import { ComparisonBadge } from "./comparison-badge";
import { NotificationBell } from "./notification-bell";
import { CategoryNavMenu } from "./category-nav-menu";
import { SearchAutocomplete } from "./search-autocomplete";
import { useAuth } from "@/providers/auth-context";
import { APP_NAME } from "@/constants/app";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [mobileSearchQuery, setMobileSearchQuery] = React.useState("");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const onMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileSearchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      {/* Top bar (desktop) */}
      <div className="hidden border-b border-border/60 bg-muted/30 lg:block">
        <div className="container-site flex h-9 items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            ارسال رایگان برای سفارش‌های بالای ۵۰۰٬۰۰۰ تومان
          </span>
          <div className="flex items-center gap-4">
            <Link href="/tracking" className="hover:text-foreground transition-colors">
              پیگیری سفارش
            </Link>
            <Link href="/tickets" className="hover:text-foreground transition-colors">
              پشتیبانی
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              درباره ما
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container-site flex h-16 items-center gap-3">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="منو">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>منو</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1 px-2 text-sm">
              <MobileLink href="/" onClick={() => setMobileOpen(false)}>خانه</MobileLink>
              <MobileLink href="/products" onClick={() => setMobileOpen(false)}>همه محصولات</MobileLink>
              <MobileLink href="/categories" onClick={() => setMobileOpen(false)}>دسته‌بندی‌ها</MobileLink>
              <MobileLink href="/brands" onClick={() => setMobileOpen(false)}>برندها</MobileLink>
              <MobileLink href="/cart" onClick={() => setMobileOpen(false)}>سبد خرید</MobileLink>
              <MobileLink href="/wishlist" onClick={() => setMobileOpen(false)}>علاقه‌مندی</MobileLink>
              <MobileLink href="/comparison" onClick={() => setMobileOpen(false)}>مقایسه</MobileLink>
              {isAuthenticated && (
                <>
                  <MobileLink href="/account" onClick={() => setMobileOpen(false)}>حساب کاربری</MobileLink>
                  <MobileLink href="/account/orders" onClick={() => setMobileOpen(false)}>سفارش‌های من</MobileLink>
                  <MobileLink href="/account/wallet" onClick={() => setMobileOpen(false)}>کیف پول</MobileLink>
                  <MobileLink href="/account/tickets" onClick={() => setMobileOpen(false)}>تیکت‌ها</MobileLink>
                  <MobileLink href="/account/notifications" onClick={() => setMobileOpen(false)}>نوتیفیکیشن‌ها</MobileLink>
                </>
              )}
              {!isAuthenticated && (
                <MobileLink href="/login" onClick={() => setMobileOpen(false)}>ورود / ثبت‌نام</MobileLink>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105" aria-label={APP_NAME}>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <ShoppingCart className="size-5" />
          </span>
          <span className="hidden text-lg font-bold text-foreground sm:inline">
            {APP_NAME}
          </span>
        </Link>

        {/* Search (desktop) — autocomplete dropdown */}
        <SearchAutocomplete className="hidden flex-1 lg:block" />

        {/* Actions */}
        <div className="mr-auto flex items-center gap-1 lg:mr-0 lg:gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <WishlistBadge />
            <ComparisonBadge />
            <NotificationBell />
          </div>
          <CartBadge />
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild aria-label="حساب کاربری" className="hidden sm:inline-flex">
            <Link href={isAuthenticated ? "/account" : "/login"}>
              <User className="size-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Search (mobile) */}
      <div className="container-site pb-3 lg:hidden">
        <form onSubmit={onMobileSearch}>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="جست‌وجو..."
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
        </form>
      </div>

      {/* Category nav (desktop) */}
      <nav className="hidden border-t border-border/60 bg-card lg:block">
        <div className="container-site flex h-11 items-center gap-5 text-sm">
          <CategoryLink href="/products">همه محصولات</CategoryLink>
          <CategoryNavMenu />
          <div className="mr-auto flex items-center gap-4">
            <CategoryLink href="/products?hasDiscount=true">تخفیف‌دارها</CategoryLink>
            <CategoryLink href="/products?isFeatured=true">محصولات منتخب</CategoryLink>
            <CategoryLink href="/brands">برندها</CategoryLink>
          </div>
        </div>
      </nav>
    </header>
  );
}

function CategoryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-md px-3 py-2 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  );
}

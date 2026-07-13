"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Users,
  ShieldBan,
  ShieldCheck,
  KeyRound,
  LogOut,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Wallet,
  ShoppingCart,
  Ticket as TicketIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersAdminService } from "@/services";
import type { UserRole } from "@/types/domain";
import { formatDateTimeFa, toPersianDigits, formatPrice } from "@/utils/format";

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  ADMIN: { label: "مدیر کل", color: "#ef3a4b" },
  EDITOR: { label: "ویرایشگر", color: "#3b82f6" },
  SUPPORT: { label: "پشتیبانی", color: "#f59e0b" },
  CUSTOMER: { label: "مشتری", color: "#6b7280" },
};

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [blockReason, setBlockReason] = React.useState("");
  const [roleChange, setRoleChange] = React.useState<UserRole | null>(null);
  const [walletAdjustOpen, setWalletAdjustOpen] = React.useState(false);
  const [walletAmount, setWalletAmount] = React.useState("");
  const [walletDescription, setWalletDescription] = React.useState("");
  const [walletProcessing, setWalletProcessing] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      usersAdminService.byId(Number(id)),
      usersAdminService.sessions(Number(id)).catch(() => []),
    ]).then(([u, s]) => {
      setUser(u);
      setSessions(s);
    }).finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-12 text-center">
        <Users className="mx-auto mb-4 size-16 text-muted-foreground/40" />
        <p className="text-muted-foreground">کاربر پیدا نشد</p>
        <Button asChild className="mt-4">
          <Link href="/admin/users">بازگشت</Link>
        </Button>
      </div>
    );
  }

  const initials = (user.fullName ?? "؟").split(" ").map((p: string) => p.charAt(0)).slice(0, 2).join("");
  const roleCfg = ROLE_LABELS[user.role as UserRole] ?? ROLE_LABELS.CUSTOMER;
  const isAdmin = user.role === "ADMIN";

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      toast.error("دلیل مسدودسازی را وارد کنید");
      return;
    }
    try {
      await usersAdminService.block(user.id, { reason: blockReason });
      toast.success("کاربر مسدود شد");
      setBlockOpen(false);
      setBlockReason("");
      load();
    } catch {
      toast.error("عملیات ناموفق بود");
    }
  };

  const handleUnblock = async () => {
    try {
      await usersAdminService.unblock(user.id);
      toast.success("رفع مسدودیت شد");
      load();
    } catch {
      toast.error("عملیات ناموفق بود");
    }
  };

  const handleRoleChange = async () => {
    if (!roleChange) return;
    try {
      await usersAdminService.setRole(user.id, { role: roleChange });
      toast.success("نقش تغییر کرد");
      setRoleChange(null);
      load();
    } catch {
      toast.error("تغییر نقش ناموفق بود");
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    if (!confirm("ابطال این نشست؟")) return;
    try {
      await usersAdminService.revokeSession(user.id, sessionId);
      toast.success("نشست ابطال شد");
      load();
    } catch {
      toast.error("عملیات ناموفق بود");
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm("خروج اجباری از تمام دستگاه‌ها؟")) return;
    try {
      await usersAdminService.revokeAllSessions(user.id);
      toast.success("از تمام دستگاه‌ها خارج شد");
      load();
    } catch {
      toast.error("عملیات ناموفق بود");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/users">
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Avatar className="size-12 border-2 border-border">
            <AvatarFallback className="bg-primary/10 font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-foreground">{user.fullName}</h1>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${roleCfg.color}15`, color: roleCfg.color }}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: roleCfg.color }} />
                {roleCfg.label}
              </span>
              {user.isBlocked && <Badge variant="destructive">مسدود</Badge>}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!isAdmin && (
            user.isBlocked ? (
              <Button variant="outline" size="sm" onClick={handleUnblock}>
                <ShieldCheck className="size-4 text-green-600" />
                رفع مسدودیت
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setBlockOpen(true)}>
                <ShieldBan className="size-4" />
                مسدود کردن
              </Button>
            )
          )}
          {!isAdmin && (
            <Select value={user.role} onValueChange={(v) => setRoleChange(v as UserRole)}>
              <SelectTrigger className="w-[140px]">
                <KeyRound className="size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">مشتری</SelectItem>
                <SelectItem value="SUPPORT">پشتیبانی</SelectItem>
                <SelectItem value="EDITOR">ویرایشگر</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اطلاعات کاربر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ایمیل</p>
                    <p className="font-medium" dir="ltr">{user.email ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">موبایل</p>
                    <p className="font-medium" dir="ltr">{user.phone ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">عضویت</p>
                    <p className="font-medium text-xs">{formatDateTimeFa(user.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">موجودی کیف پول</p>
                    <p className="font-medium nums-fa">{formatPrice(user.walletBalance ?? 0)} تومان</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setWalletAdjustOpen(true)}
                  >
                    تعدیل
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">تعداد سفارش</p>
                    <p className="font-medium nums-fa">{toPersianDigits(user.orderCount ?? 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">نشست‌های فعال</p>
                    <p className="font-medium nums-fa">{toPersianDigits(user.activeSessionCount ?? 0)}</p>
                  </div>
                </div>
              </div>
              {user.isBlocked && user.blockedReason && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                    <p className="font-medium text-destructive">دلیل مسدودیت:</p>
                    <p className="text-muted-foreground">{user.blockedReason}</p>
                    {user.blockedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeFa(user.blockedAt)}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardContent className="flex flex-wrap gap-2 p-4">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/tickets?userId=${user.id}`}>
                  <TicketIcon className="size-4" />
                  تیکت‌های کاربر
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/orders?userId=${user.id}`}>
                  <ShoppingCart className="size-4" />
                  سفارش‌های کاربر
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">نشست‌ها ({sessions.length})</CardTitle>
              {sessions.length > 0 && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRevokeAllSessions}>
                  <LogOut className="size-4" />
                  خروج از همه
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {sessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">نشست فعالی وجود ندارد</p>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                    <div className={`flex size-8 items-center justify-center rounded-lg ${s.isActive ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      <KeyRound className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.deviceName ?? "دستگاه ناشناخته"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.ip ?? "—"} • {formatDateTimeFa(s.createdAt)}
                      </p>
                    </div>
                    {s.isActive && <Badge variant="default" className="text-xs">فعال</Badge>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRevokeSession(s.id)}
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Block dialog */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسدود کردن کاربر</AlertDialogTitle>
            <AlertDialogDescription>
              کاربر فوراً از تمام دستگاه‌ها خارج می‌شود و نمی‌تواند وارد شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>دلیل مسدودیت</Label>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
              placeholder="مثال: تخلف از قوانین..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              مسدود کردن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role change confirm */}
      <AlertDialog open={!!roleChange} onOpenChange={() => setRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تغییر نقش کاربر</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید نقش این کاربر را به «{roleChange ? ROLE_LABELS[roleChange].label : ""}» تغییر دهید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>تأیید</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Wallet adjust dialog */}
      <AlertDialog open={walletAdjustOpen} onOpenChange={setWalletAdjustOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تعدیل موجودی کیف پول</AlertDialogTitle>
            <AlertDialogDescription>
              موجودی فعلی: <span className="font-bold nums-fa">{formatPrice(user?.walletBalance ?? 0)}</span> تومان.
              مقدار مثبت = افزایش، مقدار منفی = کاهش.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="mb-1 block text-sm font-medium">مبلغ (تومان)</Label>
              <Input
                type="number"
                dir="ltr"
                className="text-left"
                placeholder="مثال: 50000 یا -50000"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-medium">توضیحات (اختیاری)</Label>
              <Input
                placeholder="مثال: افزودن اعتبار هدیه"
                value={walletDescription}
                onChange={(e) => setWalletDescription(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!walletAmount) return;
                setWalletProcessing(true);
                try {
                  await usersAdminService.walletAdjust(user.id, {
                    amount: Number(walletAmount),
                    description: walletDescription.trim() || undefined,
                  });
                  toast.success("موجودی کیف پول با موفقیت تعدیل شد");
                  setWalletAdjustOpen(false);
                  setWalletAmount("");
                  setWalletDescription("");
                  load();
                } catch {
                  toast.error("تعدیل موجودی ناموفق بود");
                } finally {
                  setWalletProcessing(false);
                }
              }}
              disabled={walletProcessing || !walletAmount}
            >
              {walletProcessing ? "در حال..." : "تأیید"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

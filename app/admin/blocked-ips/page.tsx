"use client";

import * as React from "react";
import { Plus, Trash2, ShieldBan, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { securityService } from "@/services";
import type { BlockedIp } from "@/types/domain";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";

// Mirrors the backend's validation (blocked-ip.validation.ts) — catches an
// obviously-malformed IP before the round-trip, since a typo here used to
// silently create a "blocked IP" that would never match any real request.
const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
const isValidIp = (v: string) => ipv4Pattern.test(v) || ipv6Pattern.test(v);

export default function AdminBlockedIpsPage() {
  const [ips, setIps] = React.useState<BlockedIp[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ip, setIp] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    securityService.listBlockedIps().then(setIps).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onBlock = async () => {
    if (!ip.trim()) {
      toast.error("آدرس IP را وارد کنید");
      return;
    }
    if (!isValidIp(ip.trim())) {
      toast.error("فرمت آدرس IP معتبر نیست");
      return;
    }
    setAdding(true);
    try {
      await securityService.blockIp({
        ip: ip.trim(),
        reason: reason || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      toast.success("IP مسدود شد");
      setIp("");
      setReason("");
      setExpiresAt("");
      load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "مسدودسازی ناموفق بود");
    } finally {
      setAdding(false);
    }
  };

  const onUnblock = async (id: number) => {
    if (!confirm("رفع مسدودیت؟")) return;
    try {
      await securityService.unblockIp(id);
      toast.success("رفع مسدودیت شد");
      load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "عملیات ناموفق بود");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">مسدودسازی IP</h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت آدرس‌های IP مسدودشده</p>
      </div>

      {/* Add form */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">آدرس IP *</Label>
              <Input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                dir="ltr"
                placeholder="1.2.3.4"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">دلیل</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: تلاش مکرر ورود ناموفق"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                انقضا
                <span className="mr-1 text-[10px] text-muted-foreground">(خالی = دائمی)</span>
              </Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={onBlock} disabled={adding || !ip.trim()}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            مسدود کردن
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : ips.length === 0 ? (
        <EmptyState
          icon={<ShieldBan className="size-16" />}
          title="IP مسدودی موجود نیست"
          description="هیچ آدرس IP مسدودشده‌ای وجود ندارد."
          className="border border-dashed border-border rounded-xl"
        />
      ) : (
        <div className="space-y-2">
          {ips.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <ShieldBan className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-medium text-foreground" dir="ltr">{b.ip}</p>
                  {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTimeFa(b.createdAt)}
                    {b.expiresAt && (
                      <span className="mr-2">• انقضا: {formatDateTimeFa(b.expiresAt)}</span>
                    )}
                  </p>
                </div>
                {!b.expiresAt && <Badge variant="destructive">دائمی</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-success"
                  onClick={() => onUnblock(b.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { Megaphone, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notificationsService } from "@/services";
import type { NotificationType } from "@/types/domain";
import { toPersianDigits } from "@/utils/format";

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "PROMOTION", label: "تبلیغاتی" }, { value: "SYSTEM", label: "سیستمی" }, { value: "ORDER", label: "سفارش" }, { value: "WALLET", label: "کیف پول" }, { value: "TICKET", label: "تیکت" }, { value: "COMMENT", label: "نظر" },
];

export default function AdminBroadcastPage() {
  const [form, setForm] = React.useState({ type: "PROMOTION" as NotificationType, title: "", message: "", link: "", userIds: "" });
  const [sending, setSending] = React.useState(false);
  const [sentCount, setSentCount] = React.useState<number | null>(null);

  const onSend = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("عنوان و پیام الزامی است"); return; }
    setSending(true); setSentCount(null);
    try {
      const userIds = form.userIds.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map(Number);
      const result = await notificationsService.broadcast({ type: form.type, title: form.title, message: form.message, link: form.link || undefined, userIds: userIds.length > 0 ? userIds : undefined });
      setSentCount(result.sentCount);
      toast.success(`پخش به ${toPersianDigits(result.sentCount)} کاربر ارسال شد`);
      setForm({ ...form, title: "", message: "", link: "" });
    } catch { toast.error("ارسال ناموفق بود"); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-foreground sm:text-2xl">پخش همگانی</h1><p className="mt-1 text-sm text-muted-foreground">ارسال نوتیفیکیشن به همه یا گروهی از کاربران</p></div>
      {sentCount !== null && (
        <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <Megaphone className="size-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">نوتیفیکیشن با موفقیت به <span className="font-bold nums-fa">{toPersianDigits(sentCount)}</span> کاربر ارسال شد.</p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">پیام جدید</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>نوع نوتیفیکیشن</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as NotificationType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>لینک (اختیاری)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} dir="ltr" placeholder="/products?hasDiscount=true" /></div>
          </div>
          <div className="space-y-2"><Label>عنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: جشنواره تابستانه" /></div>
          <div className="space-y-2"><Label>پیام *</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="متن پیام..." /></div>
          <div className="space-y-2"><Label>کاربران مشخص (اختیاری)</Label><Textarea value={form.userIds} onChange={(e) => setForm({ ...form, userIds: e.target.value })} rows={2} dir="ltr" placeholder="userId1, userId2 یا هر خط یک ID — خالی = همه کاربران" /><p className="text-xs text-muted-foreground">اگر خالی بگذارید، برای همه کاربران ارسال می‌شود.</p></div>
          <div className="flex justify-end"><Button onClick={onSend} disabled={sending} size="lg">{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}ارسال</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

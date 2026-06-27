"use client";

import * as React from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { settingsService } from "@/services";
import type { Setting } from "@/types/domain";

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<Setting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    settingsService.adminList().then((data) => {
      setSettings(data);
      const map: Record<string, string> = {};
      data.forEach((s) => (map[s.key] = s.value));
      setValues(map);
    }).finally(() => setLoading(false));
  }, []);

  const onSave = async (key: string) => {
    setSaving(true);
    try {
      const setting = settings.find((s) => s.key === key);
      await settingsService.upsert(key, {
        value: values[key],
        type: setting?.type ?? "string",
      });
      toast.success(`تنظیم «${key}» ذخیره شد`);
    } catch {
      toast.error("ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">تنظیمات سایت</h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت تنظیمات سراسری</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تنظیمات عمومی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((s) => (
            <div key={s.key} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-mono" dir="ltr">{s.key}</Label>
                <Input
                  value={values[s.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  dir={s.type === "number" || s.key.includes("url") ? "ltr" : "rtl"}
                />
              </div>
              <Button size="sm" onClick={() => onSave(s.key)} disabled={saving}>
                <Save className="size-3.5" />
              </Button>
            </div>
          ))}
          {settings.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              تنظیمی موجود نیست
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

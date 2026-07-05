"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, CreditCard, Power } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { AdminTable } from "@/features/admin/components/admin-table";
import { useAuth } from "@/providers/auth-context";
import {
  usePaymentGateways,
  useCreatePaymentGateway,
  useUpdatePaymentGateway,
  useDeletePaymentGateway,
} from "@/features/admin/hooks";
import { formatDateTimeFa } from "@/utils/format";
import type { PaymentGateway } from "@/types/domain";

export default function AdminPaymentGatewaysPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data: gateways, isLoading } = usePaymentGateways();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PaymentGateway | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (g: PaymentGateway) => {
    setEditing(g);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <CreditCard className="size-5 text-primary" />
            درگاه‌های پرداخت
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت درگاه‌های پرداخت آنلاین (فقط ادمین)
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            درگاه جدید
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          فقط ادمین کل می‌تواند درگاه‌های پرداخت را ایجاد، ویرایش یا حذف کند.
        </div>
      )}

      <AdminTable
        title=""
        columns={[
          {
            key: "name",
            header: "نام",
            render: (g) => (
              <div>
                <p className="font-medium text-foreground">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.slug}</p>
              </div>
            ),
          },
          {
            key: "isActive",
            header: "وضعیت",
            render: (g) =>
              g.isActive ? (
                <Badge variant="default">فعال</Badge>
              ) : (
                <Badge variant="secondary">غیرفعال</Badge>
              ),
          },
          {
            key: "config",
            header: "تنظیمات",
            render: (g) => (
              <span className="text-xs text-muted-foreground">
                {g.config ? `${Object.keys(g.config).length} کلید` : "بدون تنظیمات"}
              </span>
            ),
            hideOnMobile: true,
          },
          {
            key: "createdAt",
            header: "تاریخ ایجاد",
            render: (g) => (
              <span className="text-xs text-muted-foreground">
                {g.createdAt ? formatDateTimeFa(g.createdAt) : "—"}
              </span>
            ),
            hideOnMobile: true,
          },
          ...(isAdmin
            ? [{
                key: "actions",
                header: "عملیات",
                align: "left" as const,
                render: (g: PaymentGateway) => (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEdit(g);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                ),
              }]
            : []),
        ]}
        data={gateways ?? []}
        isLoading={isLoading}
        getRowId={(g) => String(g.id)}
        emptyTitle="درگاهی وجود ندارد"
        emptyDescription="هنوز درگاه پرداختی ثبت نشده است."
      />

      <GatewayDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  );
}

function GatewayDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PaymentGateway | null;
}) {
  const create = useCreatePaymentGateway();
  const update = useUpdatePaymentGateway();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [configText, setConfigText] = React.useState("{}");

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setSlug(editing?.slug ?? "");
      setIsActive(editing?.isActive ?? true);
      setConfigText(editing?.config ? JSON.stringify(editing.config, null, 2) : "{}");
    }
  }, [open, editing]);

  const onSubmit = () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("نام و شناسه (slug) الزامی هستند");
      return;
    }
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(configText || "{}");
    } catch {
      toast.error("تنظیمات (config) باید JSON معتبر باشد");
      return;
    }
    const body = { name: name.trim(), slug: slug.trim(), isActive, config };
    if (editing) {
      update.mutate(
        { id: editing.id, body },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      create.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editing ? "ویرایش درگاه" : "درگاه پرداخت جدید"}</DialogTitle>
          <DialogDescription>
            تنظیمات درگاه پرداخت آنلاین را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-1.5 block text-sm font-medium">نام درگاه</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: زرین‌پال" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium">شناسه (slug)</Label>
            <Input
              dir="ltr"
              className="text-left"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="zarinpal"
              disabled={!!editing}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              این شناسه در API و درگاه شارژ کیف پول استفاده می‌شود.
            </p>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium">وضعیت</Label>
            <Select value={isActive ? "true" : "false"} onValueChange={(v) => setIsActive(v === "true")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">فعال</SelectItem>
                <SelectItem value="false">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              تنظیمات (JSON) — مرچنت‌کد، کلیدها و ...
            </Label>
            <Textarea
              dir="ltr"
              className="min-h-[120px] font-mono text-xs"
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder='{"merchantId":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button
            onClick={onSubmit}
            disabled={create.isPending || update.isPending || !name.trim() || !slug.trim()}
          >
            {create.isPending || update.isPending ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ایجاد درگاه"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

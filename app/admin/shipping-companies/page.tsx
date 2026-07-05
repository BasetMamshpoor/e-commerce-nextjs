"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { AdminTable } from "@/features/admin/components/admin-table";
import { shippingCompaniesService } from "@/services";
import type { ShippingCompany } from "@/types/domain";
import { formatPrice, toPersianDigits } from "@/utils/format";

export default function AdminShippingCompaniesPage() {
  const [companies, setCompanies] = React.useState<ShippingCompany[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ShippingCompany | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => { setLoading(true); shippingCompaniesService.list({ includeInactive: true }).then(setCompanies).finally(() => setLoading(false)); }, []);
  React.useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await shippingCompaniesService.delete(deleteId); toast.success("حذف شد"); setDeleteId(null); load(); }
    catch { toast.error("حذف ناموفق — در سفارش استفاده شده"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-4">
      <AdminTable title="شرکت‌های ارسال" description="مدیریت شرکت‌های حمل و نقل"
        columns={[
          { key: "name", header: "نام شرکت", render: (c) => <span className="font-medium text-foreground">{c.name}</span> },
          { key: "cost", header: "هزینه پایه", align: "left", render: (c) => <span className="nums-fa">{formatPrice(c.baseCost)}</span> },
          { key: "days", header: "زمان تحویل", hideOnMobile: true, render: (c) => c.estimatedDaysMin ? `${toPersianDigits(c.estimatedDaysMin)}-${toPersianDigits(c.estimatedDaysMax ?? c.estimatedDaysMin)} روز` : "—" },
          { key: "status", header: "وضعیت", render: (c) => <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "فعال" : "غیرفعال"}</Badge> },
          { key: "actions", header: "", align: "left", render: (c) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => { setEditing(c); setDialogOpen(true); }}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="size-4" /></Button>
            </div>
          )},
        ]}
        data={companies} isLoading={loading} getRowId={(c) => String(c.id)} emptyTitle="شرکتی یافت نشد"
        headerActions={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" />شرکت جدید</Button>}
      />
      <ShippingFormDialog open={dialogOpen} onOpenChange={setDialogOpen} company={editing} onSaved={load} />
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="حذف شرکت ارسال" description="آیا مطمئن هستید؟ اگر در سفارشی استفاده شده باشد، حذف امکان‌پذیر نخواهد بود." confirmText="حذف" variant="destructive" onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}

function ShippingFormDialog({ open, onOpenChange, company, onSaved }: any) {
  const [form, setForm] = React.useState({ name: "", baseCost: "", estimatedDaysMin: "", estimatedDaysMax: "", description: "", isActive: true });
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (open) setForm({ name: company?.name ?? "", baseCost: company?.baseCost?.toString() ?? "", estimatedDaysMin: company?.estimatedDaysMin?.toString() ?? "", estimatedDaysMax: company?.estimatedDaysMax?.toString() ?? "", description: company?.description ?? "", isActive: company?.isActive ?? true }); }, [open, company]);
  const onSubmit = async () => {
    if (!form.name.trim() || !form.baseCost) { toast.error("نام و هزینه الزامی است"); return; }
    setSaving(true);
    try {
      const body = { name: form.name, baseCost: Number(form.baseCost), estimatedDaysMin: form.estimatedDaysMin ? Number(form.estimatedDaysMin) : undefined, estimatedDaysMax: form.estimatedDaysMax ? Number(form.estimatedDaysMax) : undefined, description: form.description || undefined, isActive: form.isActive };
      if (company) { await shippingCompaniesService.update(company.id, body); toast.success("به‌روزرسانی شد"); }
      else { await shippingCompaniesService.create(body); toast.success("ایجاد شد"); }
      onOpenChange(false); onSaved();
    } catch { toast.error("ذخیره ناموفق بود"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{company ? "ویرایش شرکت" : "شرکت جدید"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>نام شرکت *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>هزینه پایه (تومان) *</Label><Input type="number" value={form.baseCost} onChange={(e) => setForm({ ...form, baseCost: e.target.value })} dir="ltr" /></div>
            <div className="space-y-2"><Label>حداقل روز تحویل</Label><Input type="number" value={form.estimatedDaysMin} onChange={(e) => setForm({ ...form, estimatedDaysMin: e.target.value })} dir="ltr" /></div>
          </div>
          <div className="space-y-2"><Label>حداکثر روز تحویل</Label><Input type="number" value={form.estimatedDaysMax} onChange={(e) => setForm({ ...form, estimatedDaysMax: e.target.value })} dir="ltr" /></div>
          <div className="space-y-2"><Label>توضیحات</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 rounded" /><span className="text-sm">فعال</span></label>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button><Button onClick={onSubmit} disabled={saving}>{saving ? "..." : "ذخیره"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

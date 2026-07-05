"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ticketsService } from "@/services";
import type { TicketDepartment } from "@/types/domain";

export default function AdminTicketDepartmentsPage() {
  const [departments, setDepartments] = React.useState<TicketDepartment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TicketDepartment | null>(null);
  const [deleteDept, setDeleteDept] = React.useState<TicketDepartment | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => { setLoading(true); ticketsService.departments().then(setDepartments).finally(() => setLoading(false)); }, []);
  React.useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteDept) return;
    setDeleting(true);
    try { await ticketsService.deleteDepartment(deleteDept.id); toast.success("بخش حذف شد"); setDeleteDept(null); load(); }
    catch { toast.error("حذف ناموفق — دارای تیکت است"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-foreground sm:text-2xl">بخش‌های پشتیبانی</h1><p className="mt-1 text-sm text-muted-foreground">مدیریت بخش‌های تیکتینگ</p></div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" />بخش جدید</Button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="h-24 animate-pulse rounded-xl bg-muted" /></Card>)}</div>
      ) : departments.length === 0 ? (
        <EmptyState icon={<Ticket className="size-16" />} title="بخشی موجود نیست" description="اولین بخش پشتیبانی را ایجاد کنید." className="border border-dashed border-border rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Ticket className="size-4" /></span>
                    <p className="font-medium text-foreground">{dept.name}</p>
                  </div>
                  {(dept as any).description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{(dept as any).description}</p>}
                  <div className="mt-2"><Badge variant={(dept as any).isActive ? "default" : "secondary"} className="text-[10px]">{(dept as any).isActive ? "فعال" : "غیرفعال"}</Badge></div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => { setEditing(dept); setDialogOpen(true); }}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteDept(dept)}><Trash2 className="size-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <DepartmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} department={editing} onSaved={load} />
      <ConfirmDialog open={!!deleteDept} onOpenChange={(o) => !o && setDeleteDept(null)} title="حذف بخش" description={`آیا از حذف «${deleteDept?.name ?? ""}» مطمئن هستید؟ اگر تیکت داشته باشد، حذف امکان‌پذیر نیست.`} confirmText="حذف" variant="destructive" onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}

function DepartmentFormDialog({ open, onOpenChange, department, onSaved }: any) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (open) { setName(department?.name ?? ""); setDescription((department as any)?.description ?? ""); setIsActive((department as any)?.isActive ?? true); } }, [open, department]);
  const onSubmit = async () => {
    if (!name.trim()) { toast.error("نام الزامی است"); return; }
    setSaving(true);
    try {
      const body = { name, description: description || undefined, isActive };
      if (department) { await ticketsService.updateDepartment(department.id, body); toast.success("بخش به‌روزرسانی شد"); }
      else { await ticketsService.createDepartment(body); toast.success("بخش ایجاد شد"); }
      onOpenChange(false); onSaved();
    } catch { toast.error("ذخیره ناموفق بود"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{department ? "ویرایش بخش" : "بخش جدید"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>نام بخش *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: پشتیبانی فنی" /></div>
          <div className="space-y-2"><Label>توضیحات</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" /><span className="text-sm">فعال</span></label>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button><Button onClick={onSubmit} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}{department ? "ذخیره" : "ایجاد"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="h-20 animate-pulse rounded-xl bg-muted" /></Card>)}</div>
      ) : departments.length === 0 ? (
        <EmptyState icon={<Ticket className="size-16" />} title="بخشی موجود نیست" description="اولین بخش پشتیبانی را ایجاد کنید." className="border border-dashed border-border rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Ticket className="size-4" /></span>
                  <p className="font-medium text-foreground">{dept.name}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => { setEditing(dept); setDialogOpen(true); }}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteDept(dept)}><Trash2 className="size-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <DepartmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} department={editing} onSaved={load} />
      <ConfirmDialog open={!!deleteDept} onOpenChange={(o) => !o && setDeleteDept(null)} title="حذف بخش" description={`آیا از حذف «${deleteDept?.name ?? ""}» مطمئن هستید؟`} confirmText="حذف" variant="destructive" onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}

function DepartmentFormDialog({ open, onOpenChange, department, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; department: TicketDepartment | null; onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (open) setName(department?.name ?? ""); }, [open, department]);
  const onSubmit = async () => {
    if (!name.trim()) { toast.error("نام الزامی است"); return; }
    setSaving(true);
    try {
      if (department) { await ticketsService.updateDepartment(department.id, { name: name.trim() }); toast.success("بخش به‌روزرسانی شد"); }
      else { await ticketsService.createDepartment({ name: name.trim() }); toast.success("بخش ایجاد شد"); }
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
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button><Button onClick={onSubmit} disabled={saving || !name.trim()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}{department ? "ذخیره" : "ایجاد"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

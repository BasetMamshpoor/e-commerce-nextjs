"use client";

import * as React from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { AddressFormDialog } from "@/features/account/components/address-form-dialog";
import {
  useAddresses,
  useDeleteAddress,
} from "@/features/account/hooks";
import type { Address } from "@/types/domain";

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<Address | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const onAdd = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const onEdit = (addr: Address) => {
    setEditingAddress(addr);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "آدرس‌ها", url: "/account/addresses" },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">آدرس‌های من</h1>
        <Button onClick={onAdd}>
          <Plus className="size-4" />
          آدرس جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-16" />}
          title="هنوز آدرسی ثبت نکرده‌اید"
          description="برای تسریع در فرآیند خرید، آدرس‌های خود را ذخیره کنید."
          action={
            <Button onClick={onAdd}>
              <Plus className="size-4" />
              افزودن اولین آدرس
            </Button>
          }
          className="border border-dashed border-border rounded-xl"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => onEdit(addr)}
              onDelete={() => setDeletingId(addr.id)}
            />
          ))}
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        address={editingAddress}
      />

      <DeleteAddressDialog
        addressId={deletingId}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{address.title}</span>
                {address.isDefault && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Check className="size-3" />
                    پیش‌فرض
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{address.receiverName}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={onEdit}
              aria-label="ویرایش"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label="حذف"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground" dir="ltr">
            {address.receiverPhone}
          </p>
          <p className="text-foreground">
            {address.province}، {address.city}
          </p>
          <p className="text-muted-foreground">{address.fullAddress}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            کد پستی: {address.postalCode}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteAddressDialog({
  addressId,
  onClose,
}: {
  addressId: string | null;
  onClose: () => void;
}) {
  const deleteAddress = useDeleteAddress();

  const onConfirm = () => {
    if (!addressId) return;
    deleteAddress.mutate(addressId, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <AlertDialog open={!!addressId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف آدرس</AlertDialogTitle>
          <AlertDialogDescription>
            آیا از حذف این آدرس مطمئن هستید؟ این عملیات قابل بازگشت نیست.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            اگر این آدرس در سفارش قبلی استفاده شده باشد، حذف آن امکان‌پذیر نخواهد بود.
          </span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleteAddress.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteAddress.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

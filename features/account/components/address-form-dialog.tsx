"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AddressMapPicker } from "@/components/common/address-map-picker";
import {
  useCreateAddress,
  useUpdateAddress,
} from "@/features/account/hooks";
import { normalizePhone } from "@/utils/format";
import type { Address } from "@/types/domain";

const addressSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  receiverName: z.string().min(3, "نام گیرنده الزامی است"),
  receiverPhone: z.string().refine((v) => /^09\d{9}$/.test(normalizePhone(v)), {
    message: "شماره موبایل معتبر وارد کنید (09xxxxxxxxx)",
  }),
  province: z.string().min(1, "استان الزامی است"),
  city: z.string().min(1, "شهر الزامی است"),
  postalCode: z.string().min(10, "کد پستی باید ۱۰ رقم باشد"),
  fullAddress: z.string().min(10, "آدرس کامل را وارد کنید"),
  lat: z.number(),
  lng: z.number(),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing address for edit mode. */
  address?: Address | null;
  /** Called after successful create/update. */
  onSaved?: (address: Address) => void;
}

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSaved,
}: AddressFormDialogProps) {
  const isEdit = !!address;
  const create = useCreateAddress();
  const update = useUpdateAddress();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      receiverName: "",
      receiverPhone: "",
      province: "",
      city: "",
      postalCode: "",
      fullAddress: "",
      lat: 35.6892,
      lng: 51.3890,
      isDefault: false,
    },
  });

  const lngValue = useWatch({ control: form.control, name: "lng" });

  // Reset form when dialog opens or address changes.
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: address?.title ?? "",
        receiverName: address?.receiverName ?? "",
        receiverPhone: address?.receiverPhone ?? "",
        province: address?.province ?? "",
        city: address?.city ?? "",
        postalCode: address?.postalCode ?? "",
        fullAddress: address?.fullAddress ?? "",
        lat: address?.lat ?? 35.6892,
        lng: address?.lng ?? 51.3890,
        isDefault: address?.isDefault ?? false,
      });
    }
  }, [open, address, form]);

  const onSubmit = (values: AddressFormValues) => {
    const body = {
      ...values,
      receiverPhone: normalizePhone(values.receiverPhone),
    };
    if (isEdit && address) {
      update.mutate(
        { id: address.id, body },
        {
          onSuccess: (updated) => {
            onOpenChange(false);
            onSaved?.(updated);
          },
        },
      );
    } else {
      create.mutate(body, {
        onSuccess: (created) => {
          onOpenChange(false);
          onSaved?.(created);
        },
      });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش آدرس" : "آدرس جدید"}</DialogTitle>
          <DialogDescription>
            آدرس تحویل را وارد کنید. می‌توانید موقعیت را روی نقشه انتخاب کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان آدرس</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: خانه، محل کار" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تماس گیرنده</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        dir="ltr"
                        className="text-left"
                        placeholder="09123456789"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="receiverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام و نام خانوادگی گیرنده</FormLabel>
                  <FormControl>
                    <Input placeholder="نام کامل گیرنده" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>استان</FormLabel>
                    <FormControl>
                      <Input placeholder="تهران" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شهر</FormLabel>
                    <FormControl>
                      <Input placeholder="تهران" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد پستی</FormLabel>
                    <FormControl>
                      <Input
                        dir="ltr"
                        className="text-left"
                        placeholder="1234567890"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fullAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس کامل</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="خیابان، کوچه، پلاک، واحد"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Map picker */}
            <FormField
              control={form.control}
              name="lat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>موقعیت روی نقشه</FormLabel>
                  <AddressMapPicker
                    value={{ lat: field.value, lng: lngValue }}
                    onChange={(coords) => {
                      field.onChange(coords.lat);
                      form.setValue("lng", coords.lng, { shouldDirty: true });
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <Label className="text-sm font-normal text-muted-foreground cursor-pointer">
                      تنظیم به‌عنوان آدرس پیش‌فرض
                    </Label>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "ذخیره تغییرات" : "افزودن آدرس"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

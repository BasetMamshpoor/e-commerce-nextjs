"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Camera, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { useUserMe, useUpdateProfile, useSetAvatar } from "@/features/account/hooks";

const profileSchema = z.object({
  fullName: z.string().min(3, "نام باید حداقل ۳ کاراکتر باشد").max(100),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: user } = useUserMe();
  const updateProfile = useUpdateProfile();
  const setAvatar = useSetAvatar();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "" },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({ fullName: user.fullName });
    }
  }, [user, form]);

  const onSubmit = (values: ProfileValues) => {
    updateProfile.mutate(values.fullName);
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری مجاز است");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیش از ۵ مگابایت باشد");
      return;
    }
    setAvatar.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const initials = (user?.fullName ?? "؟")
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("");

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "پروفایل", url: "/account/profile" },
        ]}
      />

      <h1 className="text-xl font-bold text-foreground sm:text-2xl">پروفایل</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Avatar card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">تصویر پروفایل</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="size-32 border-2 border-border">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.fullName} />
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                  {initials || <UserIcon className="size-10" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={setAvatar.isPending}
                className="absolute -bottom-1 -left-1 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                aria-label="تغییر تصویر"
              >
                {setAvatar.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              برای تغییر تصویر، روی آیکون دوربین کلیک کنید
              <br />
              حداکثر حجم: ۵ مگابایت
            </p>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">اطلاعات شخصی</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام و نام خانوادگی</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="نام کامل" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    ایمیل
                  </label>
                  <Input
                    value={user?.email ?? "—"}
                    disabled
                    className="bg-muted/50"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    برای تغییر ایمیل به{" "}
                    <a href="/account/security" className="text-primary hover:underline">
                      بخش امنیت
                    </a>{" "}
                    مراجعه کنید
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    شماره موبایل
                  </label>
                  <Input
                    value={user?.phone ?? "—"}
                    disabled
                    className="bg-muted/50"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    برای تغییر شماره به{" "}
                    <a href="/account/security" className="text-primary hover:underline">
                      بخش امنیت
                    </a>{" "}
                    مراجعه کنید
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfile.isPending || !form.formState.isDirty}
                >
                  {updateProfile.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  ذخیره تغییرات
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

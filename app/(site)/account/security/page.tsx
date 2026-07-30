"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { PasswordField } from "@/components/auth/form-fields";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  useChangePassword,
  useRequestChangeIdentifier,
  useVerifyChangeIdentifier,
} from "@/features/account/hooks";
import { passwordSchema, identifierSchema } from "@/features/auth/schemas/auth.schema";
import { APP_CONFIG } from "@/constants/app";
import { isValidEmail, isValidIranMobile } from "@/utils/format";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز فعلی الزامی است"),
  newPassword: passwordSchema,
});
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "امنیت", url: "/account/security" },
        ]}
      />
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">امنیت حساب</h1>
      <ChangePasswordSection />
      <Separator />
      <ChangeIdentifierSection />
    </div>
  );
}

function ChangePasswordSection() {
  const changePassword = useChangePassword();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const onSubmit = (values: ChangePasswordValues) => {
    changePassword.mutate(values, {
      onSuccess: () => form.reset(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">تغییر رمز عبور</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رمز عبور فعلی</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      dir="ltr"
                      className="px-3 text-left"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PasswordField
              control={form.control}
              name="newPassword"
              label="رمز عبور جدید"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              رمز باید حداقل ۸ کاراکتر و شامل حداقل یک حرف و یک عدد باشد.
            </p>
            <Button
              type="submit"
              disabled={changePassword.isPending || !form.formState.isDirty}
            >
              {changePassword.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              تغییر رمز
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ChangeIdentifierSection() {
  const [newIdentifier, setNewIdentifier] = React.useState("");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"request" | "verify">("request");

  const request = useRequestChangeIdentifier();
  const verify = useVerifyChangeIdentifier();

  const isValid = isValidEmail(newIdentifier) || isValidIranMobile(newIdentifier);

  const onRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    request.mutate(newIdentifier, {
      onSuccess: () => setStep("verify"),
    });
  };

  const onVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== APP_CONFIG.otpLength) return;
    verify.mutate(
      { newIdentifier, code },
      {
        onSuccess: () => {
          setStep("request");
          setNewIdentifier("");
          setCode("");
        },
      },
    );
  };

  const onCancel = () => {
    setStep("request");
    setNewIdentifier("");
    setCode("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">تغییر ایمیل یا شماره موبایل</CardTitle>
      </CardHeader>
      <CardContent>
        {step === "request" ? (
          <form onSubmit={onRequest} className="space-y-4">
            <div className="space-y-2">
              <Label>ایمیل یا شماره موبایل جدید</Label>
              <Input
                type="text"
                dir="ltr"
                className="text-left"
                placeholder="new@example.com یا 09123456789"
                value={newIdentifier}
                onChange={(e) => setNewIdentifier(e.target.value)}
              />
              {!isValid && newIdentifier.length > 0 && (
                <p className="text-xs text-destructive">
                  فرمت ایمیل یا شماره موبایل معتبر نیست
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={request.isPending || !isValid}
            >
              {request.isPending && <Loader2 className="size-4 animate-spin" />}
              ارسال کد تایید
            </Button>
            <p className="text-xs text-muted-foreground">
              کد تایید به ایمیل یا شماره جدید ارسال می‌شود. این تغییر پس از تایید کد اعمال می‌گردد.
            </p>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="text-muted-foreground">کد تایید ارسال شد به:</p>
              <p className="font-medium text-foreground" dir="ltr">
                {newIdentifier}
              </p>
            </div>
            <div className="space-y-2">
              <Label>کد تایید ۵ رقمی</Label>
              <div className="flex justify-center" dir={"ltr"}>
                <InputOTP
                  maxLength={APP_CONFIG.otpLength}
                  value={code}
                  onChange={setCode}
                >
                  <InputOTPGroup>
                    {Array.from({ length: APP_CONFIG.otpLength }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} className="size-12 text-lg" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={verify.isPending || code.length !== APP_CONFIG.otpLength}
              >
                {verify.isPending && <Loader2 className="size-4 animate-spin" />}
                تایید و اعمال تغییر
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                انصراف
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

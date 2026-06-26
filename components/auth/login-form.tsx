"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import {
  IdentifierField,
  PasswordField,
} from "@/components/auth/form-fields";
import { useLogin, useLoginOtpRequest } from "@/features/auth/hooks";
import { loginSchema, type LoginValues } from "@/features/auth/schemas/auth.schema";

type Mode = "password" | "otp";

export function LoginForm() {
  const [mode, setMode] = React.useState<Mode>("password");

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="password">ورود با رمز عبور</TabsTrigger>
        <TabsTrigger value="otp">ورود با کد یکبار مصرف</TabsTrigger>
      </TabsList>

      <TabsContent value="password" className="mt-4">
        <PasswordLogin />
      </TabsContent>
      <TabsContent value="otp" className="mt-4">
        <OtpLogin />
      </TabsContent>
    </Tabs>
  );
}

function PasswordLogin() {
  const login = useLogin();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = (values: LoginValues) => login.mutate(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <IdentifierField control={form.control} />

        <PasswordField control={form.control} autoComplete="current-password" />

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            رمز عبور را فراموش کرده‌اید؟
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={login.isPending}
        >
          {login.isPending && <Loader2 className="size-4 animate-spin" />}
          ورود
        </Button>
      </form>
    </Form>
  );
}

function OtpLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [step, setStep] = React.useState<"request" | "verify">("request");
  const requestOtp = useLoginOtpRequest();

  const onRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    requestOtp.mutate(identifier, {
      onSuccess: () => setStep("verify"),
    });
  };

  React.useEffect(() => {
    if (step !== "verify") return;
    const params = new URLSearchParams({ identifier, mode: "login" });
    router.push(`/verify-otp?${params.toString()}`);
  }, [step, identifier, router]);

  if (step === "verify") {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        در حال انتقال به صفحه‌ی تایید کد...
      </div>
    );
  }

  return (
    <form onSubmit={onRequest} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp-identifier">ایمیل یا شماره موبایل</Label>
        <Input
          id="otp-identifier"
          type="text"
          inputMode="email"
          dir="ltr"
          className="text-left"
          placeholder="example@mail.com یا 09123456789"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoFocus
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={requestOtp.isPending || !identifier.trim()}
      >
        {requestOtp.isPending && <Loader2 className="size-4 animate-spin" />}
        ارسال کد یکبار مصرف
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        کد ۵ رقمی به ایمیل یا شماره موبایل شما ارسال می‌شود
      </p>
    </form>
  );
}

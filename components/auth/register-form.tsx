"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  IdentifierField,
  PasswordField,
} from "@/components/auth/form-fields";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas/auth.schema";

export function RegisterForm() {
  const register = useRegister();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", identifier: "", password: "", terms: false as unknown as true },
  });

  const onSubmit = (values: RegisterValues) => register.mutate(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام و نام خانوادگی</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="مثال: علی رضایی"
                  autoComplete="name"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <IdentifierField control={form.control} />

        <PasswordField
          control={form.control}
          label="رمز عبور"
          autoComplete="new-password"
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal text-muted-foreground">
                    <Link href="/terms" className="text-primary hover:underline" target="_blank">
                      قوانین و مقررات
                    </Link>{" "}
                    و{" "}
                    <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                      حریم خصوصی
                    </Link>{" "}
                    را می‌پذیرم
                  </FormLabel>
                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={register.isPending}
        >
          {register.isPending && <Loader2 className="size-4 animate-spin" />}
          ثبت‌نام
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          با ثبت‌نام، کد تایید ۵ رقمی به ایمیل یا شماره موبایل شما ارسال می‌شود
        </p>
      </form>
    </Form>
  );
}

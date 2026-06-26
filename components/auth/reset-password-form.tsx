"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  IdentifierField,
  PasswordField,
} from "@/components/auth/form-fields";
import { useResetPassword } from "@/features/auth/hooks";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/features/auth/schemas/auth.schema";
import { APP_CONFIG } from "@/constants/app";
import { isValidEmail, isValidIranMobile } from "@/utils/format";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifierFromUrl = searchParams.get("identifier") ?? "";

  const reset = useResetPassword();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      identifier: identifierFromUrl,
      code: "",
      newPassword: "",
    },
  });

  React.useEffect(() => {
    if (
      identifierFromUrl &&
      !isValidEmail(identifierFromUrl) &&
      !isValidIranMobile(identifierFromUrl)
    ) {
      toast.error("شناسه نامعتبر است");
      router.replace("/forgot-password");
    }
  }, [identifierFromUrl, router]);

  const onSubmit = (values: ResetPasswordValues) => reset.mutate(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!identifierFromUrl && <IdentifierField control={form.control} />}

        {identifierFromUrl && (
          <div className="rounded-lg bg-muted/60 p-3 text-center text-sm">
            <p className="text-muted-foreground">بازیابی رمز برای:</p>
            <p className="mt-1 font-medium text-foreground" dir="ltr">
              {identifierFromUrl}
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">کد تایید</FormLabel>
              <FormControl>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={APP_CONFIG.otpLength}
                    value={field.value}
                    onChange={field.onChange}
                    dir="ltr"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: APP_CONFIG.otpLength }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="size-12 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <PasswordField
          control={form.control}
          label="رمز عبور جدید"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={reset.isPending}
        >
          {reset.isPending && <Loader2 className="size-4 animate-spin" />}
          تغییر رمز عبور
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          پس از تغییر رمز، از تمام دستگاه‌های دیگر خارج می‌شوید
        </p>
      </form>
    </Form>
  );
}

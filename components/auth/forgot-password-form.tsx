"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { IdentifierField } from "@/components/auth/form-fields";
import { useForgotPassword } from "@/features/auth/hooks";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/features/auth/schemas/auth.schema";

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  const onSubmit = (values: ForgotPasswordValues) => forgot.mutate(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <IdentifierField control={form.control} />

        <Button
          type="submit"
          className="w-full"
          disabled={forgot.isPending}
        >
          {forgot.isPending && <Loader2 className="size-4 animate-spin" />}
          ارسال کد بازیابی
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          کد ۵ رقمی بازیابی به ایمیل یا شماره موبایل شما ارسال می‌شود
        </p>
      </form>
    </Form>
  );
}

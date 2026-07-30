"use client";

import * as React from "react";
import { Eye, EyeOff, KeyRound, Mail, Phone } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Control } from "react-hook-form";
import { isValidEmail, isValidIranMobile } from "@/utils/format";

/**
 * Identifier field — accepts either email or Iranian mobile.
 * Shows a small hint chip showing which channel was detected.
 */
export function IdentifierField({
  control,
  name = "identifier",
  label = "ایمیل یا شماره موبایل",
  placeholder = "example@mail.com یا 09123456789",
  autoFocus = true,
}: {
  control: Control<any>;
  name?: string;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const isEmail = isValidEmail(field.value ?? "");
        const isMobile = isValidIranMobile(field.value ?? "");
        const channel = isEmail ? "ایمیل" : isMobile ? "پیامک" : null;
        return (
          <FormItem>
            <FormLabel dir="rtl">{label}</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {isEmail ? <Mail className="size-4" /> : <Phone className="size-4" />}
                </span>
                <Input
                  type="text"
                  inputMode="email"
                  dir="ltr"
                  className="pr-9 text-left"
                  placeholder={placeholder}
                  autoFocus={autoFocus}
                  {...field}
                />
                {channel && (
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {channel}
                  </span>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

/** Password field with show/hide toggle. */
export function PasswordField({
  control,
  name = "password",
  label = "رمز عبور",
  placeholder = "••••••••",
  autoComplete = "current-password",
}: {
  control: Control<any>;
  name?: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel dir="rtl">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <KeyRound className="size-4" />
              </span>
              <Input
                type={show ? "text" : "password"}
                dir="ltr"
                className="px-9 text-left"
                placeholder={placeholder}
                autoComplete={autoComplete}
                {...field}
              />
              <button
                type="button"
                aria-label={show ? "مخفی کردن رمز" : "نمایش رمز"}
                onClick={() => setShow((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

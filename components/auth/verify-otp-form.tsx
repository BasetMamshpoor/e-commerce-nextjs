"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { CountdownTimer } from "@/components/common/countdown-timer";
import { useVerifyOtp, useLoginOtpRequest } from "@/features/auth/hooks";
import { otpSchema, type OtpValues } from "@/features/auth/schemas/auth.schema";
import { APP_CONFIG } from "@/constants/app";
import { isValidEmail, isValidIranMobile } from "@/utils/format";

type Mode = "register" | "login";

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const identifier = searchParams.get("identifier") ?? "";
  const mode = (searchParams.get("mode") as Mode) ?? "register";

  const verifyOtp = useVerifyOtp();
  const requestOtp = useLoginOtpRequest();

  const form = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { identifier, code: "" },
  });

  const codeValue = useWatch({ control: form.control, name: "code" });

  // Compute OTP expiry (default: 2 minutes from mount — backend's actual expiry is in the
  // request-OTP response, but we don't always have it; this is a UX hint).
  const [expiresAt, setExpiresAt] = React.useState<number>(
    Date.now() + 2 * 60 * 1000,
  );
  const [canResend, setCanResend] = React.useState(false);

  const onSubmit = (values: OtpValues) => {
    verifyOtp.mutate({
      identifier,
      code: values.code,
      mode,
    });
  };

  const handleResend = () => {
    if (mode === "login") {
      requestOtp.mutate(identifier, {
        onSuccess: () => {
          setExpiresAt(Date.now() + 2 * 60 * 1000);
          setCanResend(false);
          form.setValue("code", "");
        },
      });
    } else {
      // For register mode, navigate back to /register so user can re-submit
      // (which re-sends the OTP). Simpler than calling /auth/register again here.
      router.push("/register");
    }
  };

  // Validate identifier from URL — if missing, redirect back.
  React.useEffect(() => {
    if (!identifier || (!isValidEmail(identifier) && !isValidIranMobile(identifier))) {
      toast.error("شناسه نامعتبر است");
      router.replace(mode === "login" ? "/login" : "/register");
    }
  }, [identifier, mode, router]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/60 p-3 text-center text-sm">
        <p className="text-muted-foreground">کد تایید ارسال شد به:</p>
        <p className="mt-1 font-medium text-foreground" dir="ltr">
          {identifier}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
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

          <Button
            type="submit"
            className="w-full"
            disabled={verifyOtp.isPending || (codeValue ?? "").length < APP_CONFIG.otpLength}
          >
            {verifyOtp.isPending && <Loader2 className="size-4 animate-spin" />}
            تایید و ادامه
          </Button>
        </form>
      </Form>

      <div className="space-y-2 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-1">
          <span>ارسال مجدد کد در</span>
          <CountdownTimer
            target={expiresAt}
            onExpire={() => setCanResend(true)}
            expiredLabel="زمان ارسال مجدد فرا رسید"
          />
        </div>
        {canResend && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={requestOtp.isPending}
            className="text-primary"
          >
            {requestOtp.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCw className="size-4" />
            )}
            ارسال مجدد کد
          </Button>
        )}
      </div>
    </div>
  );
}

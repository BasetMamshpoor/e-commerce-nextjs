import type { Metadata } from "next";

import { AuthFormCard } from "@/components/auth/auth-form-card";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import { GuestOnly } from "@/components/common/auth-guard";
import { absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "تایید کد یکبار مصرف",
  description: "کد ۵ رقمی ارسال‌شده به ایمیل یا شماره موبایل خود را وارد کنید.",
  alternates: { canonical: absUrl("/verify-otp") },
  robots: { index: false, follow: false },
};

export default function VerifyOtpPage() {
  return (
    <div className="container-site flex min-h-[80vh] items-center justify-center py-12">
      <GuestOnly>
        <AuthFormCard
          title="تایید کد یکبار مصرف"
          description="کد ۵ رقمی را وارد کنید"
        >
          <VerifyOtpForm />
        </AuthFormCard>
      </GuestOnly>
    </div>
  );
}

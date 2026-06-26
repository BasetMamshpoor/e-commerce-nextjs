import type { Metadata } from "next";

import { AuthFormCard } from "@/components/auth/auth-form-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { GuestOnly } from "@/components/common/auth-guard";
import { absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "بازیابی رمز عبور",
  description: "ایمیل یا شماره موبایل خود را وارد کنید تا کد بازیابی برای شما ارسال شود.",
  alternates: { canonical: absUrl("/forgot-password") },
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="container-site flex min-h-[80vh] items-center justify-center py-12">
      <GuestOnly>
        <AuthFormCard
          title="بازیابی رمز عبور"
          description="کد بازیابی به ایمیل یا شماره موبایل شما ارسال می‌شود"
          footer={
            <p className="text-sm text-muted-foreground">
              رمز عبور را به یاد آوردید؟{" "}
              <a href="/login" className="font-medium text-primary hover:underline">
                ورود
              </a>
            </p>
          }
        >
          <ForgotPasswordForm />
        </AuthFormCard>
      </GuestOnly>
    </div>
  );
}

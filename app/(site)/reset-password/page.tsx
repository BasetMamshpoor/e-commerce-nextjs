import type { Metadata } from "next";

import { AuthFormCard } from "@/components/auth/auth-form-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { GuestOnly } from "@/components/common/auth-guard";
import { absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "تغییر رمز عبور",
  description: "کد بازیابی و رمز عبور جدید خود را وارد کنید.",
  alternates: { canonical: absUrl("/reset-password") },
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="container-site flex min-h-[80vh] items-center justify-center py-12">
      <GuestOnly>
        <AuthFormCard
          title="تغییر رمز عبور"
          description="کد بازیابی و رمز جدید را وارد کنید"
        >
          <ResetPasswordForm />
        </AuthFormCard>
      </GuestOnly>
    </div>
  );
}

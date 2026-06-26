import type { Metadata } from "next";

import { AuthFormCard } from "@/components/auth/auth-form-card";
import { RegisterForm } from "@/components/auth/register-form";
import { GuestOnly } from "@/components/common/auth-guard";
import { absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "ثبت‌نام در فروشگاه",
  description: "ثبت‌نام کنید تا بتوانید خرید کنید، سفارش‌ها را پیگیری کنید و از تخفیف‌های ویژه بهره‌مند شوید.",
  alternates: { canonical: absUrl("/register") },
  robots: { index: false, follow: false },
  openGraph: {
    title: "ثبت‌نام در فروشگاه",
    description: "ثبت‌نام کنید تا خرید کنید.",
    url: absUrl("/register"),
  },
};

export default function RegisterPage() {
  return (
    <div className="container-site flex min-h-[80vh] items-center justify-center py-12">
      <GuestOnly>
        <AuthFormCard
          title="ساخت حساب کاربری"
          description="ثبت‌نام رایگان است و فقط چند ثانیه زمان می‌برد"
          footer={
            <p className="text-sm text-muted-foreground">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <a href="/login" className="font-medium text-primary hover:underline">
                وارد شوید
              </a>
            </p>
          }
        >
          <RegisterForm />
        </AuthFormCard>
      </GuestOnly>
    </div>
  );
}

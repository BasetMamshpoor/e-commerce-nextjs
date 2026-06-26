import type { Metadata } from "next";

import { AuthFormCard } from "@/components/auth/auth-form-card";
import { LoginForm } from "@/components/auth/login-form";
import { GuestOnly } from "@/components/common/auth-guard";
import { absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "ورود به حساب کاربری",
  description: "وارد حساب کاربری خود شوید تا از سفارش‌ها، سبد خرید و تخفیف‌های ویژه بهره‌مند شوید.",
  alternates: { canonical: absUrl("/login") },
  robots: { index: false, follow: false }, // Auth pages should not be indexed
  openGraph: {
    title: "ورود به حساب کاربری",
    description: "وارد حساب کاربری خود شوید.",
    url: absUrl("/login"),
  },
};

export default function LoginPage() {
  return (
    <div className="container-site flex min-h-[80vh] items-center justify-center py-12">
      <GuestOnly>
        <AuthFormCard
          title="ورود به حساب"
          description="برای ادامه وارد حساب خود شوید"
          footer={
            <p className="text-sm text-muted-foreground">
              حساب کاربری ندارید؟{" "}
              <a href="/register" className="font-medium text-primary hover:underline">
                ثبت‌نام کنید
              </a>
            </p>
          }
        >
          <LoginForm />
        </AuthFormCard>
      </GuestOnly>
    </div>
  );
}

"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Newsletter signup section.
 *
 * NOTE: There is no newsletter API in api.md, so this just shows a success toast.
 * When a newsletter endpoint is added, swap the onSubmit to call it.
 */
export function HomeNewsletter() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    // Simulate API call.
    await new Promise((r) => setTimeout(r, 800));
    toast.success("عضویت شما در خبرنامه با موفقیت ثبت شد ✅");
    setEmail("");
    setSubmitting(false);
  };

  return (
    <section className="mb-10" aria-label="خبرنامه">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-red-700 px-6 py-10 text-primary-foreground shadow-lg sm:px-12 sm:py-12">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Mail className="size-6" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold sm:text-2xl">
            از جدیدترین تخفیف‌ها باخبر شوید
          </h2>
          <p className="mb-6 text-sm text-primary-foreground/90 sm:text-base">
            عضو خبرنامه ما شوید و اولین نفری باشید که از فروش‌های ویژه مطلع می‌شود.
          </p>
          <form
            onSubmit={onSubmit}
            className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              required
              placeholder="ایمیل خود را وارد کنید"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/95 text-foreground placeholder:text-muted-foreground"
              disabled={submitting}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={submitting}
              className="shrink-0"
            >
              {submitting ? "در حال ثبت..." : "عضویت"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-primary-foreground/70">
            با عضویت در خبرنامه، شرایط استفاده و حریم خصوصی را می‌پذیرید.
          </p>
        </div>
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 size-96 rounded-full bg-white/5 blur-3xl" />
      </div>
    </section>
  );
}

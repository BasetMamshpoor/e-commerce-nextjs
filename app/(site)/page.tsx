import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Truck, ShieldCheck, Headphones, CreditCard } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HomeHeroSlider } from "@/components/site/home-hero-slider";
import { HomeCategoriesGrid } from "@/components/site/home-categories-grid";
import { HomeFeaturedProducts, HomeDiscountProducts } from "@/components/site/home-products";
import { HomeTopBrands } from "@/components/site/home-top-brands";
import { HomeMiddleBanners } from "@/components/site/home-middle-banners";
import { HomeBlogSection } from "@/components/site/home-blog-section";
import { HomeNewsletter } from "@/components/site/home-newsletter";
import { PopupDisplay } from "@/components/site/popup-display";
import { itemListJsonLd, JsonLd } from "@/lib/seo";

export default function HomePage() {
  return (
    <div className="container-site py-6">
      {/* Hero slider */}
      <HomeHeroSlider />

      {/* Feature strip */}
      <section className="mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="مزایای خرید">
        <FeatureCard icon={<Truck className="size-5" />} title="ارسال سریع" desc="تحویل در کوتاه‌ترین زمان" />
        <FeatureCard icon={<ShieldCheck className="size-5" />} title="ضمانت اصالت" desc="تضمین کالای اصل" />
        <FeatureCard icon={<CreditCard className="size-5" />} title="پرداخت امن" desc="درگاه‌های معتبر بانکی" />
        <FeatureCard icon={<Headphones className="size-5" />} title="پشتیبانی ۲۴/۷" desc="همیشه در کنار شما" />
      </section>

      {/* Categories */}
      <HomeCategoriesGrid />

      {/* Middle banners */}
      <HomeMiddleBanners />

      {/* Featured products */}
      <HomeFeaturedProducts />

      {/* Discount products */}
      <HomeDiscountProducts />

      {/* Top brands */}
      <HomeTopBrands />

      {/* Blog */}
      <HomeBlogSection />

      {/* Newsletter */}
      <HomeNewsletter />

      {/* Promotional popups (one-shot per session) */}
      <PopupDisplay />

      {/* Site-wide ItemList for SEO (top categories) — populated at runtime by categories */}
      <JsonLd
        data={itemListJsonLd([
          { name: "محصولات", url: "/products" },
          { name: "دسته‌بندی‌ها", url: "/categories" },
          { name: "برندها", url: "/brands" },
          { name: "تخفیف‌دارها", url: "/products?hasDiscount=true" },
        ])}
      />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          <div className="truncate text-xs text-muted-foreground">{desc}</div>
        </div>
      </CardContent>
    </Card>
  );
}

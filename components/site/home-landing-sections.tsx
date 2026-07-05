"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Flame, Star, Truck, ShieldCheck, Headphones, CreditCard, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/section-header";
import { useLanding } from "@/features/catalog/hooks";
import type {
  Banner,
  Category,
  Brand,
  Product,
  Story,
  BlogPost,
  Popup,
  LandingSection,
} from "@/types/domain";

/**
 * Unified home page renderer — uses the single /landing endpoint.
 * Renders each section in the order returned by the backend.
 * Falls back to skeletons during initial load.
 */
export function HomeLandingSections() {
  const { data, isLoading, isError } = useLanding();

  if (isLoading) return <HomeSkeleton />;
  if (isError || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">بارگذاری صفحه اصلی ناموفق بود. لطفاً دوباره تلاش کنید.</p>
      </div>
    );
  }

  return (
    <>
      {/* Feature strip — always shown */}
      <section
        className="mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        aria-label="مزایای خرید"
      >
        <FeatureCard icon={<Truck className="size-5" />} title="ارسال سریع" desc="تحویل در کوتاه‌ترین زمان" color="text-blue-600 bg-blue-50 dark:bg-blue-950/30" />
        <FeatureCard icon={<ShieldCheck className="size-5" />} title="ضمانت اصالت" desc="تضمین کالای اصل" color="text-green-600 bg-green-50 dark:bg-green-950/30" />
        <FeatureCard icon={<CreditCard className="size-5" />} title="پرداخت امن" desc="درگاه‌های معتبر بانکی" color="text-purple-600 bg-purple-50 dark:bg-purple-950/30" />
        <FeatureCard icon={<Headphones className="size-5" />} title="پشتیبانی ۲۴/۷" desc="همیشه در کنار شما" color="text-orange-600 bg-orange-50 dark:bg-orange-950/30" />
      </section>

      {data.sections.map((section, idx) => (
        <LandingSectionRenderer key={`${section.type}-${idx}`} section={section} />
      ))}

      {/* Newsletter signup — frontend-only widget, not part of /landing sections */}
      <HomeNewsletterInline />

      {/* Popup display — popups are typically rendered as overlay, but if landing includes them we treat as banner */}
      {data.settings && (
        <SettingsFooter settings={data.settings} />
      )}
    </>
  );
}

/* ───────── Newsletter inline (frontend widget) ───────── */
function HomeNewsletterInline() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setErr(null);
    try {
      const { newsletterService } = await import("@/services");
      await newsletterService.subscribe(email.trim());
      setDone(true);
      setEmail("");
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "عضویت ناموفق بود";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-l from-primary/10 to-transparent p-6">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          عضویت در خبرنامه
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          از جدیدترین تخفیف‌ها و محصولات باخبر شوید.
        </p>
        {done ? (
          <p className="mt-4 rounded-lg bg-success/10 p-3 text-sm font-medium text-success">
            ایمیل شما با موفقیت ثبت شد. ✓
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              placeholder="ایمیل شما"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "در حال ثبت..." : "عضویت"}
            </button>
          </form>
        )}
        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      </div>
    </section>
  );
}

/* ───────── Section renderer ───────── */
function LandingSectionRenderer({ section }: { section: LandingSection }) {
  const data = section.data;
  switch (section.type) {
    case "banners":
      return <BannersSection banners={asBanners(data)} />;
    case "popups":
      // Popups handled by global PopupDisplay component — skip in sections.
      return null;
    case "stories":
      return <StoriesSection stories={asStories(data)} />;
    case "categories":
      return <CategoriesSection categories={asCategories(data)} />;
    case "featured_products":
      return (
        <ProductsSection
          title={section.label ?? "محصولات ویژه"}
          products={asProducts(data)}
          href="/products?isFeatured=true"
        />
      );
    case "latest_products":
      return (
        <ProductsSection
          title={section.label ?? "جدیدترین محصولات"}
          products={asProducts(data)}
          href="/products?sort=newest"
        />
      );
    case "top_rated_products":
      return (
        <ProductsSection
          title={section.label ?? "محصولات پرامتیاز"}
          products={asProducts(data)}
          href="/products?sort=most_popular"
          icon={<Star className="size-4 text-amber-500" />}
        />
      );
    case "flash_sales":
      return (
        <ProductsSection
          title={section.label ?? "تخفیف‌های ویژه"}
          products={asProducts(data)}
          href="/products?hasDiscount=true"
          icon={<Flame className="size-4 text-primary" />}
        />
      );
    case "latest_blog_posts":
      return <BlogSection posts={asBlogPosts(data)} />;
    case "popular_brands":
      return <BrandsSection brands={asBrands(data)} />;
    default:
      return null;
  }
}

/* ───────── Section components ───────── */

function BannersSection({ banners }: { banners: Banner[] }) {
  if (!banners || banners.length === 0) return null;
  return (
    <section className="mb-8" aria-label="بنرها">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {banners.slice(0, 6).map((b) => (
          <BannerTile key={b.id} banner={b} />
        ))}
      </div>
    </section>
  );
}

function BannerTile({ banner }: { banner: Banner }) {
  const image = banner.media?.url ?? banner.imageUrl;
  return (
    <Link
      href={banner.link ?? "#"}
      className="group relative block overflow-hidden rounded-2xl border border-border/40 bg-muted"
      aria-label={banner.title}
    >
      <div className="relative aspect-[16/7] w-full sm:aspect-[16/6]">
        {image ? (
          <Image
            src={image}
            alt={banner.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-l from-primary/20 to-primary/5 text-primary">
            <Sparkles className="size-8" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <p className="text-sm font-bold text-white sm:text-base">{banner.title}</p>
      </div>
    </Link>
  );
}

function StoriesSection({ stories }: { stories: Story[] }) {
  if (!stories || stories.length === 0) return null;
  return (
    <section className="mb-8" aria-label="استوری‌ها">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stories.map((s) => {
          const coverUrl = s.coverImage?.url ?? s.coverImageUrl;
          return (
            <Link
              key={s.id}
              href={`/products?story=${s.id}`}
              className="group flex w-20 shrink-0 flex-col items-center gap-1.5"
            >
              <div className="relative size-20 overflow-hidden rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary">
                {coverUrl ? (
                  <img src={coverUrl} alt={s.title} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted text-xs text-muted-foreground">
                    {s.title.slice(0, 1)}
                  </div>
                )}
              </div>
              <span className="line-clamp-1 text-[10px] text-foreground">{s.title}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CategoriesSection({ categories }: { categories: Category[] }) {
  if (!categories || categories.length === 0) return null;
  return (
    <section className="mb-10" aria-label="دسته‌بندی‌ها">
      <SectionHeader title="دسته‌بندی‌های محبوب" href="/categories" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {categories.slice(0, 12).map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-center transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="relative size-16 overflow-hidden rounded-full bg-muted sm:size-20">
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
                  {cat.name.slice(0, 2)}
                </div>
              )}
            </div>
            <span className="line-clamp-1 text-xs font-medium text-foreground sm:text-sm">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductsSection({
  title,
  products,
  href,
  icon,
}: {
  title: string;
  products: Product[];
  href?: string;
  icon?: React.ReactNode;
}) {
  if (!products || products.length === 0) return null;
  return (
    <section className="mb-10">
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
        }
        href={href}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {products.slice(0, 10).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function BrandsSection({ brands }: { brands: Brand[] }) {
  if (!brands || brands.length === 0) return null;
  return (
    <section className="mb-10">
      <SectionHeader title="برندهای محبوب" href="/brands" />
      <div className="flex gap-3 overflow-x-auto pb-2">
        {brands.slice(0, 12).map((b) => (
          <Link
            key={b.id}
            href={`/brands/${b.slug}`}
            className="group flex size-24 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            {b.logoUrl ? (
              <Image
                src={b.logoUrl}
                alt={b.name}
                width={64}
                height={64}
                className="size-16 object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <span className="text-xs font-bold text-muted-foreground">{b.name.slice(0, 2)}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function BlogSection({ posts }: { posts: BlogPost[] }) {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="mb-10">
      <SectionHeader title="آخرین مقالات" href="/blog" />
      <div className="grid gap-3 sm:grid-cols-3">
        {posts.slice(0, 3).map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`}>
            <Card className="group h-full overflow-hidden border-border/40 card-hover">
              <div className="relative aspect-[16/9] w-full bg-muted">
                {p.coverImageUrl ? (
                   
                  <img
                    src={p.coverImageUrl}
                    alt={p.title}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary/40">
                    <Sparkles className="size-8" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{p.title}</p>
                {p.excerpt && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.excerpt}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SettingsFooter({ settings }: { settings: Record<string, unknown> }) {
  // Pull store_name and social links from settings.
  const storeName = (settings.store_name as string) ?? null;
  const instagram = (settings.instagram_url as string) ?? null;
  const telegram = (settings.telegram_url as string) ?? null;
  const phone = (settings.phone as string) ?? null;
  if (!storeName && !instagram && !telegram && !phone) return null;
  return (
    <section className="mt-10 rounded-xl border border-border/60 bg-card p-4 text-center text-xs text-muted-foreground">
      {storeName && <p className="font-bold text-foreground">{storeName}</p>}
      <div className="mt-2 flex items-center justify-center gap-4">
        {phone && <a href={`tel:${phone}`} className="hover:text-primary">{phone}</a>}
        {instagram && (
          <a href={instagram} target="_blank" rel="noreferrer" className="hover:text-primary">
            اینستاگرام
          </a>
        )}
        {telegram && (
          <a href={telegram} target="_blank" rel="noreferrer" className="hover:text-primary">
            تلگرام
          </a>
        )}
      </div>
    </section>
  );
}

/* ───────── Helpers ───────── */

function FeatureCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <Card className="group border-border/40 card-hover">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
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

function HomeSkeleton() {
  return (
    <>
      <Skeleton className="mb-6 aspect-[16/5] w-full rounded-2xl" />
      <section className="mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </section>
      <section className="mb-10">
        <Skeleton className="mb-4 h-7 w-48" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      </section>
      <section className="mb-10">
        <Skeleton className="mb-4 h-7 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
          ))}
        </div>
      </section>
    </>
  );
}

/* ───────── Type guards / casts ───────── */

function asBanners(data: unknown): Banner[] { return (data as Banner[]) ?? []; }
function asStories(data: unknown): Story[] { return (data as Story[]) ?? []; }
function asCategories(data: unknown): Category[] { return (data as Category[]) ?? []; }
function asProducts(data: unknown): Product[] { return (data as Product[]) ?? []; }
function asBrands(data: unknown): Brand[] { return (data as Brand[]) ?? []; }
function asBlogPosts(data: unknown): BlogPost[] { return (data as BlogPost[]) ?? []; }

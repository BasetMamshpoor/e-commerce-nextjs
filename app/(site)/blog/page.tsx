import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { absUrl, articleJsonLd, JsonLd, itemListJsonLd } from "@/lib/seo";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";

export const metadata: Metadata = {
  title: "وبلاگ",
  description: "آخرین مقالات و راهنماهای خرید، نقد و بررسی محصولات و نکات کاربردی برای خریداران",
  alternates: { canonical: absUrl("/blog") },
  openGraph: { title: "وبلاگ | فروشگاه اینترنتی", description: "آخرین مقالات و راهنماهای خرید", url: absUrl("/blog"), type: "website" },
};

interface BlogPost {
  id: string; title: string; excerpt: string; slug: string; category: string; readingTime: number; publishedAt: string;
}

const BLOG_POSTS: BlogPost[] = [
  { id: "1", title: "راهنمای کامل خرید لپ‌تاپ در سال ۱۴۰۵", excerpt: "اگر قصد خرید لپ‌تاپ دارید، این راهنما به شما کمک می‌کند بهترین انتخاب را بر اساس نیاز و بودجه خود داشته باشید.", slug: "laptop-buying-guide-1405", category: "راهنمای خرید", readingTime: 8, publishedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "2", title: "۵ نکته برای افزایش عمر باتری موبایل", excerpt: "با رعایت این نکات ساده می‌توانید عمر باتری گوشی خود را به‌طور قابل توجهی افزایش دهید.", slug: "battery-life-tips", category: "نکات کاربردی", readingTime: 5, publishedAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "3", title: "مقایسه بهترین هدفون‌های بی‌سیم زیر ۲ میلیون تومان", excerpt: "در این مقاله ۵ هدفون بی‌سیم برتر را با هم مقایسه می‌کنیم.", slug: "best-wireless-headphones", category: "نقد و بررسی", readingTime: 6, publishedAt: new Date(Date.now() - 21 * 86400000).toISOString() },
  { id: "4", title: "چگونه کفش ورزشی مناسب انتخاب کنیم؟", excerpt: "انتخاب کفش ورزشی مناسب برای جلوگیری از آسیب‌های ورزشی بسیار مهم است.", slug: "sports-shoe-guide", category: "راهنمای خرید", readingTime: 7, publishedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "5", title: "آشنایی با تکنولوژی‌های جدید در گوشی‌های هوشمند", excerpt: "از هوش مصنوعی تا دوربین‌های پیشرفته، در این مقاله با جدیدترین تکنولوژی‌ها آشنا می‌شوید.", slug: "smartphone-tech-trends", category: "تکنولوژی", readingTime: 10, publishedAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "6", title: "راهنمای نگهداری از لباس‌های ورزشی", excerpt: "برای افزایش عمر لباس‌های ورزشی خود، این نکات نگهداری را رعایت کنید.", slug: "sportswear-care-guide", category: "نکات کاربردی", readingTime: 4, publishedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
];

export default function BlogPage() {
  return (
    <div className="container-site py-6">
      <Breadcrumb items={[{ name: "خانه", url: "/" }, { name: "وبلاگ", url: "/blog" }]} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">وبلاگ</h1>
        <p className="mt-2 text-sm text-muted-foreground">آخرین مقالات، راهنماهای خرید و نقد و بررسی محصولات</p>
      </div>
      <Card className="mb-8 overflow-hidden">
        <CardContent className="grid grid-cols-1 gap-0 p-0 md:grid-cols-2">
          <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent md:aspect-auto">
            <div className="flex size-full items-center justify-center text-6xl font-bold text-primary/30">{BLOG_POSTS[0].title.charAt(0)}</div>
          </div>
          <div className="flex flex-col justify-center gap-3 p-6">
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{BLOG_POSTS[0].category}</span>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl"><Link href={`/blog/${BLOG_POSTS[0].slug}`} className="hover:text-primary">{BLOG_POSTS[0].title}</Link></h2>
            <p className="text-sm text-muted-foreground">{BLOG_POSTS[0].excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="size-3.5" />{formatDateTimeFa(BLOG_POSTS[0].publishedAt)}</span>
              <span className="flex items-center gap-1"><Clock className="size-3.5" />{toPersianDigits(BLOG_POSTS[0].readingTime)} دقیقه مطالعه</span>
            </div>
            <Link href={`/blog/${BLOG_POSTS[0].slug}`} className="mt-2 flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"> ادامه مطلب <ArrowLeft className="size-4" /></Link>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.slice(1).map((post) => (
          <article key={post.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md">
            <Link href={`/blog/${post.slug}`} className="relative block aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
              <div className="flex size-full items-center justify-center text-4xl font-bold text-muted-foreground/20 transition-transform group-hover:scale-105">{post.title.charAt(0)}</div>
              <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-primary backdrop-blur">{post.category}</span>
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h3 className="line-clamp-2 text-base font-bold text-foreground"><Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link></h3>
              <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="size-3" />{formatDateTimeFa(post.publishedAt)}</span>
                <span className="flex items-center gap-1"><Clock className="size-3" />{toPersianDigits(post.readingTime)} دقیقه</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <JsonLd data={itemListJsonLd(BLOG_POSTS.map((p) => ({ name: p.title, url: `/blog/${p.slug}` })))} />
    </div>
  );
}

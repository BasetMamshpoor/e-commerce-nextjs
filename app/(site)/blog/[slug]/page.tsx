import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, ChevronLeft } from "lucide-react";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { absUrl, articleJsonLd, JsonLd } from "@/lib/seo";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";

const BLOG_POSTS: Record<string, { title: string; excerpt: string; content: string; category: string; readingTime: number; publishedAt: string }> = {
  "laptop-buying-guide-1405": { title: "راهنمای کامل خرید لپ‌تاپ در سال ۱۴۰۵", excerpt: "اگر قصد خرید لپ‌تاپ دارید، این راهنما به شما کمک می‌کند بهترین انتخاب را بر اساس نیاز و بودجه خود داشته باشید.", content: "محتوای کامل مقاله در اینجا قرار می‌گیرد.", category: "راهنمای خرید", readingTime: 8, publishedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  "battery-life-tips": { title: "۵ نکته برای افزایش عمر باتری موبایل", excerpt: "با رعایت این نکات ساده می‌توانید عمر باتری گوشی خود را به‌طور قابل توجهی افزایش دهید.", content: "محتوای کامل مقاله.", category: "نکات کاربردی", readingTime: 5, publishedAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  "best-wireless-headphones": { title: "مقایسه بهترین هدفون‌های بی‌سیم زیر ۲ میلیون تومان", excerpt: "در این مقاله ۵ هدفون بی‌سیم برتر را با هم مقایسه می‌کنیم.", content: "محتوای کامل مقاله.", category: "نقد و بررسی", readingTime: 6, publishedAt: new Date(Date.now() - 21 * 86400000).toISOString() },
  "sports-shoe-guide": { title: "چگونه کفش ورزشی مناسب انتخاب کنیم؟", excerpt: "انتخاب کفش ورزشی مناسب برای جلوگیری از آسیب‌های ورزشی بسیار مهم است.", content: "محتوای کامل مقاله.", category: "راهنمای خرید", readingTime: 7, publishedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  "smartphone-tech-trends": { title: "آشنایی با تکنولوژی‌های جدید در گوشی‌های هوشمند", excerpt: "از هوش مصنوعی تا دوربین‌های پیشرفته.", content: "محتوای کامل مقاله.", category: "تکنولوژی", readingTime: 10, publishedAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  "sportswear-care-guide": { title: "راهنمای نگهداری از لباس‌های ورزشی", excerpt: "برای افزایش عمر لباس‌های ورزشی.", content: "محتوای کامل مقاله.", category: "نکات کاربردی", readingTime: 4, publishedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
};

interface PageProps { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS[slug];
  if (!post) return { title: "مقاله پیدا نشد" };
  return {
    title: post.title, description: post.excerpt, alternates: { canonical: absUrl(`/blog/${slug}`) },
    openGraph: { title: post.title, description: post.excerpt, url: absUrl(`/blog/${slug}`), type: "article", publishedTime: post.publishedAt },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS[slug];
  if (!post) return (
    <div className="container-site py-12 text-center">
      <h1 className="text-2xl font-bold text-foreground">مقاله پیدا نشد</h1>
      <p className="mt-2 text-sm text-muted-foreground">مقاله موردنظر وجود ندارد یا حذف شده است.</p>
      <Link href="/blog" className="mt-4 inline-block text-primary hover:underline">بازگشت به وبلاگ</Link>
    </div>
  );

  return (
    <div className="container-site py-6">
      <Breadcrumb items={[{ name: "خانه", url: "/" }, { name: "وبلاگ", url: "/blog" }, { name: post.title, url: `/blog/${slug}` }]} />
      <article className="mx-auto max-w-3xl">
        <header className="mb-8 space-y-4">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{post.category}</span>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">{post.title}</h1>
          <p className="text-base text-muted-foreground">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="size-4" />{formatDateTimeFa(post.publishedAt)}</span>
            <span className="flex items-center gap-1.5"><Clock className="size-4" />{toPersianDigits(post.readingTime)} دقیقه مطالعه</span>
          </div>
        </header>
        <div className="mb-8 flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent">
          <span className="text-7xl font-bold text-primary/20">{post.title.charAt(0)}</span>
        </div>
        <div className="prose prose-lg max-w-none">
          <p className="text-base leading-8 text-foreground">{post.content}</p>
          <p className="mt-4 text-base leading-8 text-foreground">این محتوا یک نمونه است و در آینده با داده‌های واقعی از بک‌اند پر خواهد شد. برای افزودن مقالات واقعی، بک‌اند نیاز به ماژول وبلاگ دارد.</p>
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <Link href="/blog" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ChevronLeft className="size-4 rotate-180" />بازگشت به وبلاگ</Link>
        </div>
      </article>
      <JsonLd data={articleJsonLd({ title: post.title, description: post.excerpt, url: `/blog/${slug}`, publishedAt: post.publishedAt })} />
    </div>
  );
}

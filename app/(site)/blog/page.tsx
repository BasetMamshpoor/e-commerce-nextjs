import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { absUrl, itemListJsonLd, JsonLd } from "@/lib/seo";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import { blogService } from "@/services";
import type { BlogPost } from "@/types/domain";

export const metadata: Metadata = {
  title: "وبلاگ",
  description: "آخرین مقالات و راهنماهای خرید، نقد و بررسی محصولات و نکات کاربردی",
  alternates: { canonical: absUrl("/blog") },
  openGraph: {
    title: "وبلاگ | فروشگاه اینترنتی",
    description: "آخرین مقالات و راهنماهای خرید",
    url: absUrl("/blog"),
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  let posts: BlogPost[] = [];
  let error = false;
  try {
    const data = await blogService.list({ page: 1, limit: 20 });
    posts = data.items;
  } catch {
    error = true;
  }

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "وبلاگ", url: "/blog" },
        ]}
      />

      <div className="mb-6 mt-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">وبلاگ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          آخرین مقالات و راهنماهای خرید
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            بارگذاری مقالات ناموفق بود. لطفاً دوباره تلاش کنید.
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            هنوز مقاله‌ای منتشر نشده است.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="group h-full overflow-hidden border-border/40 card-hover">
                <div className="relative aspect-[16/9] w-full bg-muted">
                  {post.coverImageUrl ? (
                     
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary/40">
                      <Tag className="size-8" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h2 className="line-clamp-2 text-sm font-bold text-foreground sm:text-base">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDateTimeFa(post.publishedAt)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                    ادامه مطلب
                    <ArrowLeft className="size-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <JsonLd
        data={itemListJsonLd(
          posts.slice(0, 10).map((p) => ({
            name: p.title,
            url: `/blog/${p.slug}`,
          })),
        )}
      />
    </div>
  );
}

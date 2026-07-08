import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ChevronLeft, Tag, Package, FileText } from "lucide-react";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { BlogTOC } from "@/components/common/blog-toc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { absUrl, articleJsonLd, JsonLd } from "@/lib/seo";
import { formatDateTimeFa } from "@/utils/format";
import { blogService } from "@/services";
import type { BlogPost } from "@/types/domain";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await blogService.bySlug(slug);
    return {
      title: post.title,
      description: post.excerpt ?? post.metaDescription ?? undefined,
      alternates: { canonical: absUrl(`/blog/${slug}`) },
      openGraph: {
        title: post.title,
        description: post.excerpt ?? undefined,
        url: absUrl(`/blog/${slug}`),
        type: "article",
        publishedTime: post.publishedAt ?? undefined,
        images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
      },
    };
  } catch {
    return { title: "مقاله پیدا نشد" };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  let post: BlogPost | null = null;
  try {
    post = await blogService.bySlug(slug);
  } catch {
    post = null;
  }

  if (!post) {
    return (
      <div className="container-site py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">مقاله پیدا نشد</h1>
        <p className="mt-2 text-sm text-muted-foreground">مقاله موردنظر وجود ندارد یا حذف شده است.</p>
        <Link href="/blog" className="mt-4 inline-block text-primary hover:underline">بازگشت به وبلاگ</Link>
      </div>
    );
  }

  return (
    <div className="container-site py-6">
      <Breadcrumb items={[
        { name: "خانه", url: "/" },
        { name: "وبلاگ", url: "/blog" },
        { name: post.title, url: `/blog/${slug}` },
      ]} />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main article */}
        <article className="min-w-0">
          {/* Header */}
          <header className="mb-6 space-y-4">
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-base text-muted-foreground">{post.excerpt}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  {formatDateTimeFa(post.publishedAt)}
                </span>
              )}
            </div>
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {post.tags.map((t) => (
                  <Badge key={t} variant="outline" className="gap-1 text-xs">
                    <Tag className="size-2.5" />
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Cover image */}
          {post.coverImageUrl && (
            <div className="mb-8 overflow-hidden rounded-2xl">
              { }
              <img src={post.coverImageUrl} alt={post.title} className="aspect-video w-full object-cover" />
            </div>
          )}

          {/* Content */}
          {post.content && (
            <div
              className="prose prose-lg max-w-none dark:prose-invert [&_a]:text-primary [&_h2]:mt-8 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:rounded-xl [&_img]:mx-auto [&_p]:leading-8 [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_blockquote]:border-r-4 [&_blockquote]:border-primary [&_blockquote]:pr-4 [&_blockquote]:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Related products */}
          {post.relatedProducts && post.relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Package className="size-5 text-primary" />
                محصولات مرتبط
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {post.relatedProducts.slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/products/${p.slug}`}>
                    <Card className="group overflow-hidden border-border/40 card-hover">
                      <div className="aspect-square bg-muted">
                        {p.images?.[0]?.url ? (
                           
                          <img src={p.images[0].url} alt={p.name} className="size-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <Package className="size-8" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="line-clamp-2 text-xs font-medium text-foreground">{p.name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related posts */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <FileText className="size-5 text-primary" />
                مقالات مرتبط
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {post.relatedPosts.slice(0, 3).map((rp) => (
                  <Link key={rp.id} href={`/blog/${rp.slug}`}>
                    <Card className="group h-full overflow-hidden border-border/40 card-hover">
                      <div className="relative aspect-[16/9] bg-muted">
                        {rp.coverImageUrl ? (
                           
                          <img src={rp.coverImageUrl} alt={rp.title} className="size-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <FileText className="size-8" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">{rp.title}</p>
                        {rp.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{rp.excerpt}</p>}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 border-t border-border pt-6">
            <Link href="/blog" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <ChevronLeft className="size-4 rotate-180" />
              بازگشت به وبلاگ
            </Link>
          </div>
        </article>

        {/* Sidebar: Table of Contents */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            {/* TOC is auto-generated from h2/h3 in content */}
            <BlogTOC content={post.content ?? ""} />
          </div>
        </aside>
      </div>

      <JsonLd data={articleJsonLd({
        title: post.title,
        description: post.excerpt ?? "",
        url: `/blog/${slug}`,
        publishedAt: post.publishedAt ?? "",
        imageUrl: post.coverImageUrl ?? undefined,
      })} />
    </div>
  );
}

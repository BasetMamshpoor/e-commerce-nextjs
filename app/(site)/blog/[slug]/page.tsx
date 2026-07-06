import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ChevronLeft, Tag } from "lucide-react";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { absUrl, articleJsonLd, JsonLd } from "@/lib/seo";
import { formatDateTimeFa } from "@/utils/format";
import { blogService } from "@/services";
import type { BlogPost } from "@/types/domain";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

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
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt ?? undefined,
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
        <p className="mt-2 text-sm text-muted-foreground">
          مقاله موردنظر وجود ندارد یا حذف شده است.
        </p>
        <Link
          href="/blog"
          className="mt-4 inline-block text-primary hover:underline"
        >
          بازگشت به وبلاگ
        </Link>
      </div>
    );
  }

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "وبلاگ", url: "/blog" },
          { name: post.title, url: `/blog/${slug}` },
        ]}
      />
      <article className="mx-auto max-w-3xl">
        <header className="mb-8 space-y-4">
          <span className="flex w-fit items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Tag className="size-3" />
            مقاله
          </span>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-base text-muted-foreground">{post.excerpt}</p>
          )}
          {post.publishedAt && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {formatDateTimeFa(post.publishedAt)}
              </span>
            </div>
          )}
        </header>

        {post.coverImageUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            { }
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="aspect-video w-full object-cover"
            />
          </div>
        )}

        {post.content && (
          <div
            className="prose prose-lg max-w-none dark:prose-invert [&_a]:text-primary [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:rounded-lg [&_p]:leading-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}

        <div className="mt-12 border-t border-border pt-6">
          <Link
            href="/blog"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ChevronLeft className="size-4 rotate-180" />
            بازگشت به وبلاگ
          </Link>
        </div>
      </article>

      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.excerpt ?? "",
          url: `/blog/${slug}`,
          publishedAt: post.publishedAt ?? "",
          imageUrl: post.coverImageUrl ?? undefined,
        })}
      />
    </div>
  );
}

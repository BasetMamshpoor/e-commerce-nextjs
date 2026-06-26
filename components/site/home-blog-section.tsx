"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PersianNumber } from "@/components/common/persian-number";
import { SectionHeader } from "@/components/site/home-categories-grid";
import { formatRelativeFa } from "@/utils/format";

/**
 * Blog section placeholder.
 *
 * NOTE: There is no blog API in api.md/README.md, so this is a static placeholder
 * showing 3 sample blog posts. When a blog module is added to the backend, swap
 * `SAMPLE_POSTS` for a real `useBlogPosts()` hook.
 */
const SAMPLE_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "راهنمای کامل خرید لپ‌تاپ در سال ۱۴۰۵",
    excerpt: "اگر قصد خرید لپ‌تاپ دارید، این راهنما به شما کمک می‌کند بهترین انتخاب را بر اساس نیاز و بودجه خود داشته باشید.",
    imageUrl: undefined,
    slug: "laptop-buying-guide-1405",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    readingTime: 8,
  },
  {
    id: "2",
    title: "۵ نکته برای افزایش عمر باتری موبایل",
    excerpt: "با رعایت این نکات ساده می‌توانید عمر باتری گوشی خود را به‌طور قابل توجهی افزایش دهید.",
    imageUrl: undefined,
    slug: "battery-life-tips",
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    readingTime: 5,
  },
  {
    id: "3",
    title: "مقایسه بهترین هدفون‌های بی‌سیم زیر ۲ میلیون تومان",
    excerpt: "در این مقاله ۵ هدفون بی‌سیم برتر را با هم مقایسه می‌کنیم تا راحت‌تر تصمیم بگیرید.",
    imageUrl: undefined,
    slug: "best-wireless-headphones",
    publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    readingTime: 6,
  },
];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  slug: string;
  publishedAt: string;
  readingTime: number;
}

export function HomeBlogSection() {
  // Simulate loading state.
  const [isLoading] = React.useState(false);
  const posts = SAMPLE_POSTS;

  return (
    <section className="mb-10" aria-label="جدیدترین مقالات">
      <SectionHeader title="از وبلاگ ما" href="/blog" />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/40 hover:shadow-sm">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-muted"
      >
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent">
            <span className="text-3xl font-bold text-primary/30">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatRelativeFa(post.publishedAt)}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            <PersianNumber value={`${post.readingTime} دقیقه مطالعه`} />
          </span>
        </div>
        <h3 className="mb-2 line-clamp-2 font-bold text-foreground">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>
        <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
        <Button asChild variant="ghost" size="sm" className="w-fit justify-start p-0 text-primary hover:bg-transparent hover:underline">
          <Link href={`/blog/${post.slug}`}>
            ادامه مطلب
            <ArrowLeft className="size-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

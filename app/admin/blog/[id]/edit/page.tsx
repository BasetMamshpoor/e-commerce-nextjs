"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { BlogForm } from "@/components/common/blog-form";
import { blogService } from "@/services";
import type { BlogPost } from "@/types/domain";

export default function AdminBlogEditPage() {
  const params = useParams();
  const id = Number(params.id);
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!Number.isFinite(id)) return;
    blogService
      .adminList({ page: 1, limit: 100 })
      .then((data) => {
        const found = data.items.find((p) => p.id === id);
        setPost(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return <BlogForm post={post} loading={loading} />;
}

"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Extract h2/h3 from HTML content and build a table of contents. */
export function BlogTOC({ content }: { content: string }) {
  const headings = React.useMemo(() => {
    if (typeof window === "undefined") return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const h2s = doc.querySelectorAll("h2, h3");
    return Array.from(h2s).map((h) => {
      const level = h.tagName.toLowerCase();
      const text = h.textContent ?? "";
      const id = text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "");
      h.id = id;
      return { level, text, id };
    });
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">فهرست مطالب</p>
        <nav className="space-y-1">
          {headings.map((h, i) => (
            <a
              key={i}
              href={`#${h.id}`}
              className={cn(
                "block text-xs text-muted-foreground transition-colors hover:text-primary",
                h.level === "h3" && "pr-3",
              )}
            >
              {h.text}
            </a>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}

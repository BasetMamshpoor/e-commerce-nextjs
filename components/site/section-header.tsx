"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Reusable section header with an optional "tag" eyebrow (styled after a
 * shoebox size tag — a small notched label above the title), title, and
 * optional "view all" link.
 */
export function SectionHeader({
  title,
  eyebrow,
  href,
  ctaLabel = "مشاهده همه",
}: {
  title: React.ReactNode;
  eyebrow?: string;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <span className="tag-eyebrow mb-2">{eyebrow}</span>}
        <h2 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">{title}</h2>
      </div>
      {href && (
        <Button asChild variant="ghost" size="sm" className="shrink-0 text-primary">
          <Link href={href}>
            {ctaLabel}
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

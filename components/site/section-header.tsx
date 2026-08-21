"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/utils/format";

/**
 * Reusable section header — an optional kicker label, an optional large
 * ghost index number (e.g. "۰۱") as the page's recurring structural
 * signature, a title, and an optional "view all" link.
 */
export function SectionHeader({
  title,
  kicker,
  index,
  href,
  ctaLabel = "مشاهده همه",
}: {
  title: React.ReactNode;
  kicker?: string;
  /** Section order, rendered as a large ghost numeral (e.g. 1 -> "۰۱"). */
  index?: number;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-end gap-3">
        {index != null && (
          <span className="section-index hidden nums-fa sm:inline" aria-hidden="true">
            {toPersianDigits(String(index).padStart(2, "0"))}
          </span>
        )}
        <div className="min-w-0">
          {kicker && <span className="section-kicker mb-1.5">{kicker}</span>}
          <h2 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">{title}</h2>
        </div>
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

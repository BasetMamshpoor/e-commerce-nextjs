"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Reusable section header with title + optional "view all" link.
 */
export function SectionHeader({
  title,
  href,
  ctaLabel = "مشاهده همه",
}: {
  title: React.ReactNode;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-foreground sm:text-xl">{title}</h2>
      {href && (
        <Button asChild variant="ghost" size="sm" className="text-primary">
          <Link href={href}>
            {ctaLabel}
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

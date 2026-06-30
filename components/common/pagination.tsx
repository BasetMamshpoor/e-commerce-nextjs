"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = React.useMemo(() => {
    const result: (number | "...")[] = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    result.push(1);
    if (page > 3) result.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) result.push(i);
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {total !== undefined && (
        <p className="ml-4 hidden text-sm text-muted-foreground nums-fa sm:block">
          مجموع: {toPersianDigits(total)} مورد
        </p>
      )}
      <Button variant="outline" size="icon" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="صفحه قبل">
        <ChevronRight className="size-4" />
      </Button>
      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
          ) : (
            <Button key={p} variant={p === page ? "default" : "outline"} size="icon" onClick={() => onPageChange(p)} className="nums-fa">
              {toPersianDigits(p)}
            </Button>
          ),
        )}
      </div>
      <span className="px-3 text-sm text-muted-foreground nums-fa sm:hidden">
        {toPersianDigits(page)} / {toPersianDigits(totalPages)}
      </span>
      <Button variant="outline" size="icon" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="صفحه بعد">
        <ChevronLeft className="size-4" />
      </Button>
    </div>
  );
}

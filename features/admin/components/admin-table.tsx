"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Plus, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  align?: "right" | "left" | "center";
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  getRowId: (item: T) => string;
  onRowClick?: (item: T) => void;
  getRowHref?: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  // Pagination
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  // Header actions
  headerActions?: React.ReactNode;
  title: string;
  description?: string;
}

export function AdminTable<T>({
  columns,
  data,
  isLoading,
  getRowId,
  getRowHref,
  emptyTitle = "موردی یافت نشد",
  emptyDescription = "برای افزودن، از دکمه بالا استفاده کنید.",
  emptyAction,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "جست‌وجو...",
  headerActions,
  title,
  description,
}: AdminTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {headerActions}
      </div>

      {/* Search */}
      {onSearchChange && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground",
                      col.align === "left" && "text-left",
                      col.align === "center" && "text-center",
                      (!col.align || col.align === "right") && "text-right",
                      col.className,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      action={emptyAction}
                      className="py-12"
                    />
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const href = getRowHref?.(item);
                  const RowTag = href ? "a" : "div";
                  return (
                    <RowTag
                      key={getRowId(item)}
                      href={href}
                      className={cn(
                        "flex border-b border-border/40 transition-colors hover:bg-accent/30",
                        !href && "cursor-default",
                        href && "cursor-pointer",
                      )}
                      style={{ display: "table-row" }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "whitespace-nowrap px-4 py-3 text-sm",
                            col.align === "left" && "text-left",
                            col.align === "center" && "text-center",
                            col.className,
                          )}
                        >
                          {col.render(item)}
                        </td>
                      ))}
                    </RowTag>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground nums-fa">
            مجموع: {toPersianDigits(total)} مورد
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground nums-fa">
              صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Helper: Status badge ───────── */

export function StatusBadge({
  status,
  label,
  color,
}: {
  status: string;
  label: string;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${color}15`, color }}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

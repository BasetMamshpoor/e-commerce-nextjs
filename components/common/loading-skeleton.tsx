import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  /** Number of skeleton lines/blocks to render. */
  count?: number;
  variant?: "rect" | "text" | "circle";
}

/** Single skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-md",
        className,
      )}
      aria-hidden
    />
  );
}

/** Repeating skeleton pattern for lists. */
export function LoadingSkeleton({
  className,
  count = 3,
  variant = "rect",
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={
            variant === "circle"
              ? "size-10 rounded-full"
              : variant === "text"
                ? "h-4 w-full"
                : "h-20 w-full"
          }
        />
      ))}
    </div>
  );
}

/** Grid of product card skeletons (used on listing pages). */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border bg-card p-3">
          <Skeleton className="aspect-square w-full rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

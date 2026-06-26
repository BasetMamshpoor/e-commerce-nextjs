"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useWishlistToggle } from "@/features/wishlist/hooks";
import { useAuth } from "@/providers/auth-context";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "secondary";
  className?: string;
  /** Show with text label (used on product detail page). */
  showLabel?: boolean;
}

/**
 * Wishlist toggle button. If user is not authenticated, prompts login.
 */
export function WishlistButton({
  productId,
  size = "icon",
  variant = "ghost",
  className,
  showLabel = false,
}: WishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggle, isPending } = useWishlistToggle();
  const inWishlist = isInWishlist(productId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("برای افزودن به علاقه‌مندی باید وارد شوید", {
        action: { label: "ورود", onClick: () => (window.location.href = "/login") },
      });
      return;
    }
    toggle(productId);
  };

  if (showLabel) {
    return (
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={onClick}
        disabled={isPending}
        className={cn("gap-1.5", className)}
      >
        <Heart className={cn("size-4", inWishlist && "fill-primary text-primary")} />
        {inWishlist ? "در علاقه‌مندی" : "افزودن به علاقه‌مندی"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isPending}
      className={cn(className)}
      aria-label={inWishlist ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
      aria-pressed={inWishlist}
    >
      <Heart className={cn("size-4", inWishlist && "fill-primary text-primary")} />
    </Button>
  );
}

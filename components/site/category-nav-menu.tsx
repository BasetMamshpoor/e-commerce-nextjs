"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesTree } from "@/features/catalog/hooks";
import type { Category } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Mega-menu navigation showing the category tree.
 * Each top-level category opens a flyout listing its children (max 2 levels deep).
 */
export function CategoryNavMenu() {
  const { data: tree, isLoading } = useCategoriesTree();

  if (isLoading) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (!tree || tree.length === 0) {
    // No categories yet — show a single link to /products.
    return (
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/products" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                همه محصولات
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/products" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              همه محصولات
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        {tree.slice(0, 6).map((cat) => (
          <NavigationMenuItem key={cat.id}>
            <CategoryMegaMenu category={cat} />
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function CategoryMegaMenu({ category }: { category: Category }) {
  const children = category.children ?? [];

  if (children.length === 0) {
    return (
      <Link href={`/categories/${category.slug}`} legacyBehavior passHref>
        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
          {category.name}
        </NavigationMenuLink>
      </Link>
    );
  }

  return (
    <>
      <NavigationMenuTrigger className="text-sm">
        <Link
          href={`/categories/${category.slug}`}
          className="text-foreground hover:text-primary"
        >
          {category.name}
        </Link>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-1 p-2 md:w-[500px] md:grid-cols-2">
          {children.map((child) => (
            <li key={child.id}>
              <MegaMenuLink category={child} />
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </>
  );
}

function MegaMenuLink({ category }: { category: Category }) {
  const sub = category.children ?? [];
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      )}
    >
      <div className="flex items-center justify-between text-sm font-medium leading-none text-foreground">
        {category.name}
        {sub.length > 0 && (
          <ChevronLeft className="size-3.5 text-muted-foreground" />
        )}
      </div>
      {sub.length > 0 && (
        <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
          {sub.slice(0, 4).map((s) => s.name).join("، ")}
          {sub.length > 4 ? ` و ${sub.length - 4} مورد دیگر` : ""}
        </p>
      )}
    </Link>
  );
}

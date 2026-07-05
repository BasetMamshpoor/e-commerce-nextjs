"use client";

import { useQuery } from "@tanstack/react-query";

import { categoriesService } from "@/services";
import type { Category } from "@/types/domain";

/** Flat list of categories (for admin / simple listings). */
export function useCategoriesFlat(params?: { includeInactive?: boolean }) {
  return useQuery<Category[]>({
    queryKey: ["categories", "flat", params?.includeInactive ?? false],
    queryFn: () => categoriesService.list(params),
    staleTime: 5 * 60 * 1000,
  });
}

/** Single category by slug. */
export function useCategoryBySlug(slug: string | undefined) {
  return useQuery<Category>({
    queryKey: ["categories", "bySlug", slug],
    queryFn: () => categoriesService.bySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/** Attributes attached to a category (for shop filters). */
export function useCategoryAttributes(id: number | undefined) {
  return useQuery({
    queryKey: ["categories", "attributes", id],
    queryFn: () => categoriesService.attributes(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

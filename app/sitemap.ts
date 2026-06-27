import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/constants/app";
import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { PaginatedData, Product, Category, Brand } from "@/types/domain";

/**
 * Native Next.js sitemap.
 * Fetches all published products + active categories + brands from backend.
 * Falls back to just the homepage if backend is unreachable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = APP_CONFIG.publicSiteUrl.replace(/\/$/, "");
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${site}/products`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${site}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${site}/brands`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${site}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site}/cart`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site}/checkout`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    // Fetch products, categories, brands in parallel.
    const [productsRes, categoriesRes, brandsRes] = await Promise.all([
      http.get<PaginatedData<Product>>(ENDPOINTS.products.list, { limit: 1000 }),
      http.get<Category[]>(ENDPOINTS.categories.tree),
      http.get<Brand[]>(ENDPOINTS.brands.list),
    ]);

    const productUrls: MetadataRoute.Sitemap = (productsRes.items ?? []).map((p) => ({
      url: `${site}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const flattenCategories = (cats: Category[]): Category[] => {
      const result: Category[] = [];
      for (const c of cats) {
        result.push(c);
        if (c.children) result.push(...flattenCategories(c.children));
      }
      return result;
    };

    const categoryUrls: MetadataRoute.Sitemap = flattenCategories(categoriesRes ?? []).map((c) => ({
      url: `${site}/categories/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(c.createdAt),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const brandUrls: MetadataRoute.Sitemap = (brandsRes ?? []).map((b) => ({
      url: `${site}/brands/${b.slug}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticUrls, ...productUrls, ...categoryUrls, ...brandUrls];
  } catch {
    // Backend unreachable — return just static URLs.
    return staticUrls;
  }
}

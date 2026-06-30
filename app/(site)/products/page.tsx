import type { Metadata } from "next";
import { productsService, categoriesService } from "@/services";
import { ProductsClient } from "@/components/site/products-client";
import type { ProductListQuery, ProductSortOption, PaginatedData, Product, Category } from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";
import { absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "همه محصولات",
  description: "خرید آنلاین محصولات با بهترین قیمت و تحویل سریع",
  alternates: { canonical: absUrl("/products") },
  openGraph: {
    title: "همه محصولات | فروشگاه اینترنتی",
    description: "خرید آنلاین محصولات با بهترین قیمت",
    url: absUrl("/products"),
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  // Parse query params from URL (server-side)
  const query: ProductListQuery = {
    page: 1,
    limit: APP_CONFIG.defaultPageSize,
    categorySlug: typeof sp.categorySlug === "string" ? sp.categorySlug : undefined,
    brandIds: typeof sp.brandIds === "string" ? sp.brandIds : undefined,
    attributeValueIds: typeof sp.attributeValueIds === "string" ? sp.attributeValueIds : undefined,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    inStock: sp.inStock === "true" || undefined,
    hasDiscount: sp.hasDiscount === "true" || undefined,
    isFeatured: sp.isFeatured === "true" || undefined,
    search: typeof sp.search === "string" ? sp.search : undefined,
    sort: (sp.sort as ProductSortOption) ?? "newest",
  };

  // Fetch initial data on the server
  let initialProducts: PaginatedData<Product> | null = null;
  let category: Category | null = null;

  try {
    const [products, cat] = await Promise.all([
      productsService.list(query),
      query.categorySlug
        ? categoriesService.bySlug(query.categorySlug).catch(() => null)
        : Promise.resolve(null),
    ]);
    initialProducts = products;
    category = cat;
  } catch {
    // Backend might be unreachable — client component will handle retry
  }

  return (
    <ProductsClient
      initialQuery={query}
      initialProducts={initialProducts}
      category={category}
    />
  );
}

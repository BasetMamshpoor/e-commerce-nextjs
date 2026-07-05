import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { productsService } from "@/services";
import { productJsonLd, JsonLd, absUrl } from "@/lib/seo";
import { ProductDetailClient } from "@/components/site/product-detail-client";
import type { Product } from "@/types/domain";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  let product: Product | null = null;
  try {
    product = await productsService.bySlug(slug);
  } catch {
    return { title: "محصول پیدا نشد" };
  }

  if (!product) return { title: "محصول پیدا نشد" };

  const title = `${product.name} | فروشگاه اینترنتی`;
  const description = product.shortDescription ?? `خرید ${product.name} با بهترین قیمت`;

  return {
    title: product.name,
    description,
    alternates: { canonical: absUrl(`/products/${product.slug}`) },
    openGraph: {
      title,
      description,
      url: absUrl(`/products/${product.slug}`),
      type: "website",
      locale: "fa_IR",
      images: product.images?.[0]
        ? [{ url: product.images[0].media?.url ?? product.images[0].url ?? "" }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let product: Product;
  try {
    product = await productsService.bySlug(slug);
  } catch {
    notFound();
  }

  // Track view (fire and forget, no await needed)

  return (
    <>
      <ProductDetailClient product={product} />
      <JsonLd data={productJsonLd(product)} />
    </>
  );
}

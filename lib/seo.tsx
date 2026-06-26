/**
 * SEO utilities
 *   - JSON-LD structured data builders (Schema.org)
 *   - OpenGraph / Twitter helpers
 *   - Canonical URL helpers
 *   - Pagination SEO helpers (prev/next)
 *
 * All builders return plain JS objects to be embedded via <script type="application/ld+json">.
 */

import { APP_CONFIG, APP_NAME, APP_DESCRIPTION } from "@/constants/app";
import type {
  Banner,
  Brand,
  Category,
  CommentRatingSummary,
  Product,
} from "@/types/domain";

const SITE_URL = APP_CONFIG.publicSiteUrl.replace(/\/$/, "");

/** Build an absolute URL from a path. */
export function absUrl(path: string = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Organization (site-wide, in root layout)
   ────────────────────────────────────────────────────────────────────────── */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: APP_NAME,
    url: SITE_URL,
    description: APP_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.svg`,
    },
    sameAs: [
      // Populate from /settings later; placeholders for now
      "https://instagram.com/",
      "https://t.me/",
    ],
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   WebSite (site-wide, in root layout)
   ────────────────────────────────────────────────────────────────────────── */

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: APP_NAME,
    description: APP_DESCRIPTION,
    inLanguage: "fa-IR",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   BreadcrumbList (per route)
   ────────────────────────────────────────────────────────────────────────── */

export interface BreadcrumbItem {
  name: string;
  url: string;
  /** First item is the homepage; shown without a link in UI but always linked in JSON-LD. */
  hideInUi?: boolean;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absUrl(item.url),
    })),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Product (per product detail page)
   ────────────────────────────────────────────────────────────────────────── */

export function productJsonLd(
  product: Product,
  ratingSummary?: CommentRatingSummary,
) {
  const image = product.images?.find((i) => i.isMain)?.url
    ?? product.images?.[0]?.url
    ?? `${SITE_URL}/logo.svg`;

  const offers = (product.variants ?? []).map((v) => ({
    "@type": "Offer",
    sku: v.sku,
    price: String(v.effectivePrice ?? v.price),
    priceCurrency: "IRR",
    availability: v.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    url: absUrl(`/products/${product.slug}`),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absUrl(`/products/${product.slug}#product`),
    name: product.name,
    description: product.shortDescription ?? undefined,
    sku: product.variants?.[0]?.sku,
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand.name,
        }
      : undefined,
    category: product.categories?.[0]?.name,
    image: [image],
    offers: offers.length === 1 ? offers[0] : offers,
    aggregateRating:
      ratingSummary && ratingSummary.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: ratingSummary.average.toFixed(1),
            reviewCount: ratingSummary.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    url: absUrl(`/products/${product.slug}`),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Category / Brand collection pages
   ────────────────────────────────────────────────────────────────────────── */

export function collectionPageJsonLd(args: {
  type: "category" | "brand";
  name: string;
  url: string;
  description?: string;
  imageUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absUrl(`${args.url}#collection`),
    name: args.name,
    description: args.description,
    url: absUrl(args.url),
    inLanguage: "fa-IR",
    image: args.imageUrl ? [absUrl(args.imageUrl)] : undefined,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   ItemList (for product listing pages — top items)
   ────────────────────────────────────────────────────────────────────────── */

export function itemListJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absUrl(item.url),
    })),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Article (blog post — placeholder schema for when blog is implemented)
   ────────────────────────────────────────────────────────────────────────── */

export function articleJsonLd(args: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.title,
    description: args.description,
    image: args.imageUrl ? [absUrl(args.imageUrl)] : undefined,
    datePublished: args.publishedAt,
    dateModified: args.publishedAt,
    author: args.authorName
      ? { "@type": "Person", name: args.authorName }
      : { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absUrl(args.url),
    },
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   FAQ (for FAQ page — uses our settings-driven content)
   ────────────────────────────────────────────────────────────────────────── */

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Render helper: <script type="application/ld+json"> tag(s)
   ────────────────────────────────────────────────────────────────────────── */

interface JsonLdProps {
  data: unknown | unknown[];
}

/**
 * Render one or more JSON-LD <script> tags.
 * Use this in any server component to embed structured data.
 */
export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify is safe here — we control the input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Pagination SEO — generate prev/next alternates for listing pages
   ────────────────────────────────────────────────────────────────────────── */

export function paginationAlternates(
  currentPath: string,
  page: number,
  totalPages: number,
) {
  const buildUrl = (p: number) => {
    const url = new URL(absUrl(currentPath));
    url.searchParams.set("page", String(p));
    return url.pathname + url.search;
  };

  const alternates: { canonical?: string; prev?: string; next?: string } = {
    canonical: buildUrl(page),
  };
  if (page > 1) alternates.prev = buildUrl(page - 1);
  if (page < totalPages) alternates.next = buildUrl(page + 1);
  return alternates;
}

/* ──────────────────────────────────────────────────────────────────────────
   Helpers for building metadata objects
   ────────────────────────────────────────────────────────────────────────── */

export function buildOgImages(imageUrl?: string) {
  const finalUrl = imageUrl ? absUrl(imageUrl) : absUrl("/og-default.png");
  return {
    openGraph: {
      images: [{ url: finalUrl, width: 1200, height: 630, alt: APP_NAME }],
    },
    twitter: {
      card: "summary_large_image" as const,
      images: [finalUrl],
    },
  };
}

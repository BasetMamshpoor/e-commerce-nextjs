import type { Metadata } from "next";

import { HomeLandingSections } from "@/components/site/home-landing-sections";
import { PopupDisplay } from "@/components/site/popup-display";
import { itemListJsonLd, JsonLd, absUrl } from "@/lib/seo";
import { APP_NAME, APP_DESCRIPTION } from "@/constants/app";

export const metadata: Metadata = {
  title: `${APP_NAME} | فروشگاه اینترنتی`,
  description: APP_DESCRIPTION,
  alternates: { canonical: absUrl("/") },
  openGraph: {
    title: `${APP_NAME} | فروشگاه اینترنتی`,
    description: APP_DESCRIPTION,
    url: absUrl("/"),
    type: "website",
    locale: "fa_IR",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    <div className="container-site py-6">
      {/* Unified landing page renderer — fetches /landing endpoint.
          Sections (banners, stories, categories, products, brands, blog)
          are rendered in the order returned by the backend. */}
      <HomeLandingSections />

      {/* Active promotional popups — global overlay (fetches /popups) */}
      <PopupDisplay />

      {/* SEO: ItemList structured data */}
      <JsonLd
        data={itemListJsonLd([
          { name: "محصولات", url: "/products" },
          { name: "دسته‌بندی‌ها", url: "/categories" },
          { name: "برندها", url: "/brands" },
          { name: "تخفیف‌دارها", url: "/products?hasDiscount=true" },
        ])}
      />
    </div>
  );
}

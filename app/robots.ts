import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/constants/app";

/**
 * robots.txt
 * Next.js will serve this at /robots.txt.
 * We delegate sitemap discovery to the backend's /sitemap.xml (proxied via next.config.ts rewrites).
 */
export default function robots(): MetadataRoute.Robots {
  const site = APP_CONFIG.publicSiteUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/cart", "/checkout", "/wishlist", "/comparison"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}

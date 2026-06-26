import type { NextConfig } from "next";

const backendRoot = process.env.NEXT_PUBLIC_BACKEND_ROOT_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Proxy backend-served paths so media URLs work seamlessly.
  // /robots.txt is served natively by Next.js (see app/robots.ts).
  // /sitemap.xml is delegated to the backend (which knows all product/category/brand slugs).
  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: `${backendRoot}/sitemap.xml` },
      { source: "/uploads/:path*", destination: `${backendRoot}/uploads/:path*` },
    ];
  },
};

export default nextConfig;

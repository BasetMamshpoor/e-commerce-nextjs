import type { NextConfig } from "next";

const backendRoot = process.env.NEXT_PUBLIC_BACKEND_ROOT_URL ?? "http://localhost:4000";

// Parse hostname from backend root URL for image remotePatterns.
let backendHost = "localhost";
let backendPort: string | undefined = "4000";
try {
  const u = new URL(backendRoot);
  backendHost = u.hostname;
  backendPort = u.port || undefined;
} catch {
  // ignore parse errors
}

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized:true,
    remotePatterns: [
      // Backend (uploads + media URLs)
      {
        protocol: "http",
        hostname: backendHost,
        port: backendPort,
      },
      {
        protocol: "https",
        hostname: backendHost,
        port: backendPort,
      },
      // Allow any HTTPS image (for external CDNs / OG images)
      {
        protocol: "https",
        hostname: "**",
      },
      // Allow localhost for development
      {
        protocol: "http",
        hostname: "localhost",
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

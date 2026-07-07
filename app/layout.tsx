import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Providers as SessionProviders } from "@/providers/session-provider";
import { CartProvider } from "@/providers/cart-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { APP_CONFIG, APP_NAME, APP_DESCRIPTION } from "@/constants/app";

// Vazirmatn — variable Persian font, self-hosted from app/fonts.
const vazirmatn = localFont({
  src: "./fonts/Vazirmatn[wght].woff2",
  variable: "--font-vazirmatn",
  display: "swap",
  weight: "100 900",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.publicSiteUrl),
  title: {
    default: `${APP_NAME} | فروشگاه اینترنتی`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "فروشگاه آنلاین",
    "خرید اینترنتی",
    "تجارت الکترونیک",
    APP_NAME,
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: APP_CONFIG.publicSiteUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} | فروشگاه اینترنتی`,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <SessionProviders>
              <CartProvider>
                <TooltipProvider delayDuration={200}>
                  {children}
                </TooltipProvider>
                <Toaster position="top-center" richColors closeButton />
              </CartProvider>
            </SessionProviders>
          </QueryProvider>
        </ThemeProvider>
        {/* Site-wide structured data */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}

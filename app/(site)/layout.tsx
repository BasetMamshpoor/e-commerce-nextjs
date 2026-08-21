import type { Metadata } from "next";

import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ChatWidget } from "@/components/site/chat-widget";
import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "فروشگاه اینترنتی",
  description: "خرید آنلاین با بهترین قیمت و تحویل سریع",
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <Header />
      {/* pb reserves space above the fixed mobile bottom nav so page
          content (and the footer) never renders underneath it. */}
      <main id="main" className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}

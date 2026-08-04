import type { Metadata } from "next";

import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ChatWidget } from "@/components/site/chat-widget";

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
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

import type { Metadata } from "next";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "پنل مدیریت",
  description: "پنل مدیریت فروشگاه",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Full-screen admin shell. Site header/footer NOT included. */}
      {/* Will be filled out in Phase 8 with sidebar + topbar. */}
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="size-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">پنل مدیریت</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            این بخش در فاز ۸ پیاده‌سازی خواهد شد.
          </p>
        </div>
      </div>
      {/* Children rendered separately so individual admin routes can override this default */}
      <div className="sr-only">{children}</div>
    </div>
  );
}

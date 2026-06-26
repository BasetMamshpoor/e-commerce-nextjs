import Link from "next/link";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-7xl font-bold text-primary">۴۰۴</div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">صفحه پیدا نشد</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          صفحه‌ای که دنبال آن می‌گردید وجود ندارد یا جابجا شده است.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Home className="size-4" />
          بازگشت به خانه
        </Link>
      </Button>
    </div>
  );
}

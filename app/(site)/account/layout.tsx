"use client";

import * as React from "react";

import { AuthGuard } from "@/components/common/auth-guard";
import { AccountSidebar, AccountSidebarSkeleton } from "@/features/account/components/account-sidebar";
import { useUserMe } from "@/features/account/hooks";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AccountLayoutContent>{children}</AccountLayoutContent>
    </AuthGuard>
  );
}

function AccountLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useUserMe();

  return (
    <div className="container-site py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          {/* Mobile: horizontal scroll nav; Desktop: sticky sidebar */}
          <div className="lg:sticky lg:top-32">
            {isLoading ? <AccountSidebarSkeleton /> : <AccountSidebar />}
          </div>
        </div>
        <div className="lg:col-span-3 min-w-0">{children}</div>
      </div>
    </div>
  );
}

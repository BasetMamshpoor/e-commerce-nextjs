"use client";

import * as React from "react";

import { AuthGuard } from "@/components/common/auth-guard";
import { AdminSidebar, AdminTopbar } from "@/features/admin/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <AuthGuard requireRole={["ADMIN", "EDITOR", "SUPPORT"]} redirectTo="/login">
      <div className="min-h-screen bg-muted/30">
        <AdminSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

        {/* Main content — shifted left to account for fixed sidebar on lg+ */}
        <div className="lg:pr-72">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="container-admin py-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

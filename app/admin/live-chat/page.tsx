"use client";

import { Headphones } from "lucide-react";

import { LiveChatConsole } from "@/features/admin/components/live-chat-console";

export default function AdminLiveChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <Headphones className="size-5 text-primary" />
          چت زنده پشتیبانی
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          پاسخگویی لحظه‌ای به مشتریانی که از ویجت چت سایت به اپراتور ارجاع شده‌اند
        </p>
      </div>

      <LiveChatConsole />
    </div>
  );
}

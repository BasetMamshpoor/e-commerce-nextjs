"use client";

import * as React from "react";
import { Plus } from "lucide-react";

const SAMPLE_STORIES = [
  { id: "1", title: "تخفیف‌های ویژه", color: "from-red-500 to-orange-500" },
  { id: "2", title: "جدیدترین کفش‌ها", color: "from-blue-500 to-purple-500" },
  { id: "3", title: "پوشاک تابستانه", color: "from-green-500 to-teal-500" },
  { id: "4", title: "اکسسوری‌ها", color: "from-pink-500 to-rose-500" },
  { id: "5", title: "پرفروش‌ترین‌ها", color: "from-amber-500 to-yellow-500" },
  { id: "6", title: "نقد و بررسی", color: "from-indigo-500 to-blue-500" },
];

export function HomeStories() {
  return (
    <section className="mb-6" aria-label="استوری‌ها">
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {SAMPLE_STORIES.map((story) => (
          <button key={story.id} className="group flex flex-col items-center gap-1.5">
            <div className="relative">
              <div className={`flex size-16 items-center justify-center rounded-full bg-gradient-to-tr ${story.color} p-0.5 transition-transform group-hover:scale-105`}>
                <div className="flex size-full items-center justify-center rounded-full bg-card text-xs font-bold text-foreground">
                  {story.title.slice(0, 2)}
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="size-3" />
              </div>
            </div>
            <span className="max-w-[64px] truncate text-[10px] text-muted-foreground">{story.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

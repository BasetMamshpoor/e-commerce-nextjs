"use client";

import * as React from "react";
import { X, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Story } from "@/types/domain";

const STORY_DURATION_MS = 8000; // 8s per story (images); videos auto-detect duration.

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

/**
 * Full-screen Instagram-style story viewer.
 *
 * Features:
 *   - Horizontal swipe / click left=prev, click right=next
 *   - Progress bars at top (one per story, fills over duration)
 *   - Auto-advance after duration (images: 8s, videos: actual duration)
 *   - Tap to pause/resume
 *   - Close button (X) + Escape key
 *   - Story title overlay
 *   - Related products (if any) shown at bottom
 */
export function StoryViewer({ stories, initialIndex, open, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [progress, setProgress] = React.useState(0); // 0-100 for current story
  const [paused, setPaused] = React.useState(false);
  const [videoDuration, setVideoDuration] = React.useState<number | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number>(0);
  const elapsedRef = React.useRef<number>(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Reset when opened or index changes.
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setPaused(false);
      setVideoDuration(null);
      elapsedRef.current = 0;
    }
  }, [open, initialIndex]);

  const goNext = React.useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = React.useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  // Close on Escape / arrow navigation.
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev, onClose]);

  const currentStory = stories[currentIndex];
  const duration = videoDuration ?? STORY_DURATION_MS;

  // Progress animation via requestAnimationFrame.
  React.useEffect(() => {
    if (!open || paused) return;

    startRef.current = performance.now() - elapsedRef.current;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      elapsedRef.current = elapsed;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct >= 100) {
        // Auto-advance
        if (currentIndex < stories.length - 1) {
          setCurrentIndex((i) => i + 1);
          setProgress(0);
          setVideoDuration(null);
          elapsedRef.current = 0;
        } else {
          onClose();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, paused, currentIndex, duration, stories.length, onClose]);

  // Reset progress when story changes.
  React.useEffect(() => {
    setProgress(0);
    setVideoDuration(null);
    elapsedRef.current = 0;
  }, [currentIndex]);

  if (!open || !currentStory) return null;

  const videoUrl = currentStory.video?.url ?? currentStory.videoUrl;
  const coverUrl = currentStory.coverImage?.url ?? currentStory.coverImageUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="بستن"
      >
        <X className="size-6" />
      </button>

      {/* Story counter */}
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 text-sm font-medium text-white/80 nums-fa">
        {currentIndex + 1} / {stories.length}
      </div>

      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-3">
        {stories.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
          >
            <div
              className="h-full bg-white transition-[width] duration-100 ease-linear"
              style={{
                width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Previous button (right side in RTL) */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute right-2 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="قبلی"
        >
          <ChevronRight className="size-7" />
        </button>
      )}

      {/* Next button (left side in RTL) */}
      <button
        onClick={goNext}
        className="absolute left-2 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="بعدی"
      >
        <ChevronLeft className="size-7" />
      </button>

      {/* Story content */}
      <div
        className="relative flex h-full w-full max-w-md flex-col items-center justify-center"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={coverUrl ?? undefined}
            className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain"
            autoPlay
            playsInline
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.duration && isFinite(v.duration)) {
                setVideoDuration(v.duration * 1000);
              }
            }}
            onEnded={goNext}
          />
        ) : coverUrl ? (
          <img
            src={coverUrl}
            alt={currentStory.title}
            className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain"
          />
        ) : (
          <div className="flex h-96 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
            <ShoppingBag className="size-16" />
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
          <p className="text-sm font-bold text-white">{currentStory.title}</p>
          {/* Related products */}
          {currentStory.products && currentStory.products.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {currentStory.products.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  onClick={onClose}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-white/10 px-2 py-1.5 backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <span className="text-xs font-medium text-white">{p.name}</span>
                  <ChevronLeft className="size-3 text-white/70" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pause indicator */}
      {paused && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 px-4 py-2 text-sm text-white">
            متوقف شد
          </div>
        </div>
      )}
    </div>
  );
}

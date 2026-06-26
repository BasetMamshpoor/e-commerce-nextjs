"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBanners } from "@/features/catalog/hooks/use-banners";
import type { Banner } from "@/types/domain";

/**
 * Home page hero slider — uses banners with position="HOME_MAIN".
 * Falls back to a static promotional slide if no banners are loaded.
 */
export function HomeHeroSlider() {
  const { data: banners, isLoading } = useBanners("HOME_MAIN");

  // Always have at least one slide (the fallback) so the carousel renders consistently.
  const slides: HeroSlide[] = React.useMemo(() => {
    if (isLoading || !banners || banners.length === 0) {
      return [FALLBACK_SLIDE];
    }
    return banners.map((b) => ({
      id: b.id,
      title: b.title,
      imageUrl: b.imageUrl,
      link: b.link ?? "/products",
      isFallback: false,
    }));
  }, [banners, isLoading]);

  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section className="mb-8" aria-label="اسلایدر اصلی">
      <Carousel
        opts={{ align: "start", loop: slides.length > 1 }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide, i) => (
            <CarouselItem key={slide.id} className="sm:basis-full">
              <HeroSlideView slide={slide} isLoading={isLoading && i === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="right-2 left-auto bg-background/80 backdrop-blur" />
            <CarouselNext className="left-2 right-auto bg-background/80 backdrop-blur" />
          </>
        )}
      </Carousel>
      {/* Dots */}
      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              aria-label={`اسلاید ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface HeroSlide {
  id: string;
  title: string;
  imageUrl?: string;
  link: string;
  isFallback?: boolean;
}

const FALLBACK_SLIDE: HeroSlide = {
  id: "fallback",
  title: "خریدی آسان، با تحویل سریع و پرداخت امن",
  imageUrl: undefined,
  link: "/products",
  isFallback: true,
};

function HeroSlideView({ slide, isLoading }: { slide: HeroSlide; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="aspect-[2/1] w-full rounded-2xl sm:aspect-[3/1]" />;
  }

  if (slide.isFallback || !slide.imageUrl) {
    // Gradient fallback slide
    return (
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-red-700 px-6 py-10 text-primary-foreground shadow-lg sm:aspect-[3/1] sm:px-12 sm:py-16">
        <div className="relative z-10 max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            جشنواره تابستانه
          </span>
          <h2 className="mb-4 text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {slide.title}
          </h2>
          <p className="mb-6 text-sm text-primary-foreground/90 sm:text-lg">
            از جدیدترین محصولات با بهترین قیمت‌ها خرید کنید. ارسال رایگان برای
            سفارش‌های بالای ۵۰۰٬۰۰۰ تومان.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href={slide.link}>
              مشاهده محصولات
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 size-96 rounded-full bg-white/5 blur-3xl" />
      </div>
    );
  }

  return (
    <Link
      href={slide.link}
      className="relative block aspect-[2/1] w-full overflow-hidden rounded-2xl bg-muted shadow-lg sm:aspect-[3/1]"
      aria-label={slide.title}
    >
      <Image
        src={slide.imageUrl}
        alt={slide.title}
        fill
        priority={slide.id === "fallback"}
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center px-6 sm:px-12">
        <h2 className="max-w-md text-xl font-bold text-white drop-shadow-md sm:text-3xl">
          {slide.title}
        </h2>
      </div>
    </Link>
  );
}

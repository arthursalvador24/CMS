"use client";

import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Slide } from "@/lib/cms/types";
import { ctaHref, isExternal } from "@/lib/templates/utils";

const INTERVAL_MS = 7000;
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const two = (n: number) => String(n).padStart(2, "0");
const controlClass =
  "grid size-10 place-items-center rounded-full border border-(--fo-rule) text-(--fo-ink) transition-colors hover:border-(--fo-ink) hover:bg-(--fo-mat)";

/**
 * A quiet framed slideshow: a matted photograph with its caption column beside it.
 * Slow crossfade, pauses on hover, focus or the pause button, never auto-rotates under reduced motion.
 */
export function Carousel({ slides, basePath }: { slides: Slide[]; basePath: string }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  // The server snapshot says "reduced" so nothing rotates before hydration.
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => true);
  const rotating = count > 1 && !reduced && !paused && !hovered && !focused;

  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [rotating, index, count]);

  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured rooms"
      className="grid gap-x-14 gap-y-7 lg:grid-cols-12 lg:grid-rows-[1fr_auto]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      {/* The plate. Photographs are decorative (alt=""); each slide's words live in the caption column. */}
      <div className="fo-mat p-2 sm:p-3 lg:col-span-7 lg:row-span-2">
        <div className="relative aspect-[4/3] overflow-hidden bg-(--fo-paper-deep)">
          {slides.map((slide, i) => (
            <Image
              key={slide.id}
              src={slide.imageUrl}
              alt=""
              fill
              sizes="(min-width: 1200px) 660px, (min-width: 1024px) 56vw, 100vw"
              preload={i === 0}
              className={`object-cover transition-opacity duration-1000 ease-out motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
      </div>

      <div className="grid *:min-w-0 lg:col-span-5 lg:self-end" aria-live={rotating ? "off" : "polite"}>
        {slides.map((slide, i) => {
          const active = i === index;
          const link = slide.ctaLabel.trim() ? ctaHref(slide.ctaUrl, basePath) : null;
          const ctaClass =
            "fo-label mt-7 inline-block max-w-md text-(--fo-clay) underline decoration-(--fo-rule) underline-offset-[7px] wrap-anywhere hover:decoration-(--fo-clay)";
          const Arrow = link && isExternal(link) ? ArrowUpRight : ArrowRight;
          const ctaBody = (
            <>
              {slide.ctaLabel}
              <Arrow aria-hidden size={15} className="ml-2 inline align-[-2px]" />
            </>
          );
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`col-start-1 row-start-1 self-end transition-opacity duration-500 ease-out motion-reduce:transition-none ${active ? "opacity-100" : "opacity-0"}`}
            >
              {slide.heading && (
                <h2 className={`fo-display wrap-break-word ${slide.heading.length > 60 ? "text-[1.75rem] md:text-[2rem]" : "text-[2rem] md:text-[2.75rem]"}`}>
                  {slide.heading}
                </h2>
              )}
              {slide.caption && (
                <p className={`text-lg leading-relaxed text-(--fo-ink-soft) italic wrap-break-word ${slide.heading ? "mt-4" : ""}`}>{slide.caption}</p>
              )}
              {link &&
                (link.startsWith("/") ? (
                  <Link href={link} className={ctaClass}>
                    {ctaBody}
                  </Link>
                ) : (
                  <a href={link} className={ctaClass}>
                    {ctaBody}
                  </a>
                ))}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="flex items-center gap-3 border-t border-(--fo-rule) pt-5 lg:col-span-5 lg:self-end">
          <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className={controlClass}>
            <ChevronLeft aria-hidden size={18} />
          </button>
          <p aria-hidden className="min-w-[4.5rem] text-center text-sm tracking-[0.12em] tabular-nums">
            {two(index + 1)} <span className="text-(--fo-ink-soft)">/ {two(count)}</span>
          </p>
          <button type="button" onClick={() => go(1)} aria-label="Next slide" className={controlClass}>
            <ChevronRight aria-hidden size={18} />
          </button>
          {!reduced && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              className={`${controlClass} ml-auto`}
            >
              {paused ? <Play aria-hidden size={16} /> : <Pause aria-hidden size={16} />}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Monitor, Smartphone } from "lucide-react";
import { fitFrame, type Device } from "./preview-fit";
import { focusRing } from "./ui";

export type { Device };

/**
 * A page rendered at a real device width (1440 or 390 px) and scaled down to fit its box, never up.
 * Switching device resizes the same iframe, so the page reflows without reloading.
 */
export function PreviewFrame({
  src,
  device,
  title,
  interactive = false,
  className = "",
}: {
  src: string;
  device: Device;
  title: string;
  /** false: a picture only (no focus, no pointer). true: the full-screen preview people can scroll and click. */
  interactive?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const frame = size ? fitFrame(device, size) : null;

  return (
    <div ref={box} className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {frame ? (
        <div
          className={device === "phone" ? "absolute overflow-hidden rounded-[22px] bg-white shadow-md ring-1 ring-stone-300" : "absolute bg-white"}
          style={{ left: frame.left, top: frame.top, width: frame.width * frame.scale, height: frame.height * frame.scale }}
        >
          <iframe
            src={src}
            title={title}
            loading="lazy"
            tabIndex={interactive ? undefined : -1}
            aria-hidden={interactive ? undefined : true}
            onLoad={() => setLoaded(true)}
            className={`block origin-top-left border-0 bg-white transition-opacity duration-300 motion-reduce:transition-none ${
              loaded ? "opacity-100" : "opacity-0"
            } ${interactive ? "" : "pointer-events-none"}`}
            style={{ width: frame.width, height: frame.height, transform: `scale(${frame.scale})` }}
          />
        </div>
      ) : null}
      {!loaded ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex items-center gap-2 text-sm text-stone-500">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            Loading preview…
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function DeviceToggle({ value, onChange, label }: { value: Device; onChange: (d: Device) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
      {(
        [
          ["desktop", "Desktop", Monitor],
          ["phone", "Phone", Smartphone],
        ] as const
      ).map(([key, text, Icon]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm transition-colors motion-reduce:transition-none ${focusRing} ${
            value === key ? "bg-white font-medium text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <Icon aria-hidden="true" className="size-4" />
          {text}
        </button>
      ))}
    </div>
  );
}

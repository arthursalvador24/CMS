export type Device = "desktop" | "phone";
export type FrameBox = { width: number; height: number; scale: number; left: number; top: number };

export const DEVICE = { desktop: { w: 1440, h: 900 }, phone: { w: 390, h: 844 } } as const;
const PHONE_GAP = 16;

/**
 * Where a page rendered at a real device width sits inside a box of `box.w` x `box.h` px.
 * Desktop fills the box width (scaled down, never up) and as much height as fits;
 * phone keeps a 390 x 844 screen, scaled to fit with a 16 px gap and centered.
 */
export function fitFrame(device: Device, box: { w: number; h: number }): FrameBox | null {
  if (box.w <= 0 || box.h <= 0) return null;
  const d = DEVICE[device];
  if (device === "desktop") {
    const scale = Math.min(1, box.w / d.w);
    return { width: d.w, height: box.h / scale, scale, left: 0, top: 0 };
  }
  const scale = Math.max(0.05, Math.min(1, (box.h - PHONE_GAP * 2) / d.h, (box.w - PHONE_GAP * 2) / d.w));
  return { width: d.w, height: d.h, scale, left: (box.w - d.w * scale) / 2, top: PHONE_GAP };
}

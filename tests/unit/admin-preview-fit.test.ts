import { describe, expect, it } from "vitest";
import { fitFrame } from "@/components/admin/preview-fit";

describe("admin template preview sizing", () => {
  it("renders desktop at 1440 px, scaled to the box width and filling its height", () => {
    const f = fitFrame("desktop", { w: 720, h: 450 })!;
    expect(f.scale).toBe(0.5);
    expect(f.width * f.scale).toBe(720);
    expect(f.height * f.scale).toBe(450);
  });

  it("never scales up past the real size", () => {
    expect(fitFrame("desktop", { w: 1920, h: 1000 })!.scale).toBe(1);
    expect(fitFrame("phone", { w: 1200, h: 2000 })!.scale).toBe(1);
  });

  it("fits the phone screen inside the box, centered, with a 16 px gap", () => {
    const f = fitFrame("phone", { w: 600, h: 454 })!;
    expect(f.scale).toBeCloseTo((454 - 32) / 844);
    expect(f.top).toBe(16);
    expect(f.left * 2 + 390 * f.scale).toBeCloseTo(600);
  });

  it("waits for a measured box", () => {
    expect(fitFrame("desktop", { w: 0, h: 300 })).toBeNull();
  });
});

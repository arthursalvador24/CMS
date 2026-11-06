/** Page container used by every Onyx section. */
export const WRAP = "mx-auto w-full max-w-[90rem] px-5 md:px-10";

/** Pick a type size step by text length, so display type never overflows. */
export function fit(text: string, [short, medium, long]: [string, string, string], limits: [number, number] = [26, 60]): string {
  return text.length <= limits[0] ? short : text.length <= limits[1] ? medium : long;
}

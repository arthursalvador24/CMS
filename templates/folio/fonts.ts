import { Newsreader } from "next/font/google";

/** Folio is set in one serif family; the opsz axis gives display cuts at large sizes. */
export const folioFont = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-folio",
  display: "swap",
});

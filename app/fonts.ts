import { DM_Sans, Inter, JetBrains_Mono, Lora, Merriweather, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-ed-inter", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-ed-dm-sans", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-ed-lora", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-ed-playfair", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-ed-merriweather", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-ed-jetbrains", display: "swap" });

/** Apply on <html> so editor fonts work everywhere. */
export const editorFontVariables = [inter, dmSans, lora, playfair, merriweather, jetbrains]
  .map((font) => font.variable)
  .join(" ");

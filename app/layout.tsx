import type { Metadata } from "next";
import { editorFontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple CMS",
  description: "Company website with a simple admin.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${editorFontVariables} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

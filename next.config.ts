import type { NextConfig } from "next";

const securityHeaders = [
  // Only this site may frame its pages (the admin template previews are same-origin iframes).
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [new URL("https://ptftqwrzofadosnxzwek.supabase.co/storage/v1/object/public/**")],
  },
  experimental: {
    // Images up to 4 MB (lib/cms/upload.ts) go through server actions, plus form overhead.
    serverActions: { bodySizeLimit: "5mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

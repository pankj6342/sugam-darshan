import type { NextConfig } from "next";

/**
 * GitHub Pages build: `PAGES_BASE_PATH=/sugam-darshan npm run build` produces a fully static
 * site in ./out. Local `npm run dev` / `npm run build` are unaffected.
 */
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(basePath
    ? { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } }
    : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
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

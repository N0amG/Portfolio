import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF en priorité (≈ 30–50 % plus léger que WebP), WebP en repli.
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // CSS injecté dans le HTML : plus de requête CSS bloquante au premier rendu.
    inlineCss: true,
  },
};

export default nextConfig;

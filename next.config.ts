import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF en priorité (≈ 30–50 % plus léger que WebP), WebP en repli.
    formats: ["image/avif", "image/webp"],
  },
  // Le site tient sur une page : les anciennes adresses mènent à leur section.
  async redirects() {
    return [
      { source: "/about", destination: "/#a-propos", permanent: true },
      { source: "/contact", destination: "/#contact", permanent: true },
      { source: "/projects", destination: "/#realisations", permanent: true },
    ];
  },
  experimental: {
    // CSS injecté dans le HTML : plus de requête CSS bloquante au premier rendu.
    inlineCss: true,
  },
};

export default nextConfig;

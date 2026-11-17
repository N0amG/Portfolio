import type { MetadataRoute } from "next";
import { projects } from "@/data/portfolio/projects";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
  ];
  const projectPages: MetadataRoute.Sitemap = projects.map((p) => ({
    url: absoluteUrl(`/projects/${p.slug}`),
    lastModified: new Date(`${p.date}-01`),
    changeFrequency: "yearly",
    priority: 0.5,
    images: p.thumbnail ? [absoluteUrl(p.thumbnail)] : undefined,
  }));
  return [...pages, ...projectPages];
}

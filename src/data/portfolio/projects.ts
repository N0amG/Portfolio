import generatedProjects from "./projects.gen.json";

export interface Project {
  slug: string;
  title: string;
  categories: string[];
  categoryLabel: string;
  description: string;
  thumbnail: string;
  tags: string[];
  date: string; // format "YYYY-MM"
  overview?: string[];
  role?: string;
  challenges?: { title: string; description: string }[];
  screenshots: string[];
  liveUrl?: string;
  codeUrl?: string;
}

interface RawProject extends Omit<Project, "thumbnail" | "screenshots"> {
  imgCount: number;
}

export const projects: Project[] = (generatedProjects as RawProject[]).map((p) => {
  const screenshots: string[] = [];
  for (let i = 0; i < p.imgCount; i++) {
    screenshots.push(`/img/${p.slug}/${i}.webp`);
  }
  return {
    ...p,
    thumbnail: screenshots[0] ?? "",
    screenshots,
  };
});

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Réalisations mises en avant (parlantes pour un commerçant), dans l'ordre d'affichage. */
const featuredSlugs = ["sophie-bluel", "nina-carducci", "booki", "kasa", "pixelguessr", "portfolio"];

export const featuredProjects: Project[] = featuredSlugs
  .map((slug) => projects.find((p) => p.slug === slug))
  .filter((p): p is Project => Boolean(p));

/** Exercices et projets de formation plus techniques, du plus récent au plus ancien. */
export const otherProjects: Project[] = [...projects]
  .filter((p) => !featuredSlugs.includes(p.slug))
  .sort((a, b) => b.date.localeCompare(a.date));

/** Ordre de navigation entre fiches : sélection d'abord, puis les autres travaux. */
const browseOrder = [...featuredProjects, ...otherProjects];

export function getAdjacentProjects(slug: string) {
  const index = browseOrder.findIndex((p) => p.slug === slug);
  const last = browseOrder.length - 1;
  return {
    prev: index > 0 ? browseOrder[index - 1] : browseOrder[last],
    next: index < last ? browseOrder[index + 1] : browseOrder[0],
  };
}

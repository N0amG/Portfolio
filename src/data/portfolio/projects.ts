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

/** Ordre chronologique (le plus ancien = n°01) : sert de numérotation stable. */
const chronological = [...projects].sort((a, b) => a.date.localeCompare(b.date));

export function getProjectNumber(slug: string): number {
  return chronological.findIndex((p) => p.slug === slug) + 1;
}

/** Projets du plus récent au plus ancien. */
export const latestProjects: Project[] = [...chronological].reverse();

export function formatProjectDate(date: string): string {
  const [y, m] = date.split("-");
  return `${m}.${y}`;
}

export const allCategories = ["Frontend", "Backend", "Fullstack", "Python", "Gestion de projet"] as const;

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAdjacentProjects(slug: string) {
  const index = projects.findIndex((p) => p.slug === slug);
  return {
    prev: index > 0 ? projects[index - 1] : projects[projects.length - 1],
    next: index < projects.length - 1 ? projects[index + 1] : projects[0],
  };
}

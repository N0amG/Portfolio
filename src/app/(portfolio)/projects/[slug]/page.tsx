import { notFound } from "next/navigation";
import { projects, getProjectBySlug, getAdjacentProjects } from "@/data/portfolio/projects";
import ProjectDetailClient from "./ProjectDetailClient";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Projet non trouvé" };
  return {
    title: `${project.title} | Noam Guez`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { prev, next } = getAdjacentProjects(slug);
  return <ProjectDetailClient project={project} prev={prev} next={next} />;
}

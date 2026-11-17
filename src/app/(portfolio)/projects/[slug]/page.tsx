import { notFound } from "next/navigation";
import { projects, getProjectBySlug, getAdjacentProjects } from "@/data/portfolio/projects";
import ProjectDetailClient from "./ProjectDetailClient";
import JsonLd, { breadcrumb, schemaIds } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Projet non trouvé", robots: { index: false } };
  const title = `${project.title} : ${project.categoryLabel.toLowerCase()}`;
  return {
    title,
    description: `${project.description} Réalisation de Noam Guez, développeur web freelance à Lyon.`,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      url: `/projects/${project.slug}`,
      title,
      description: project.description,
      images: project.thumbnail ? [{ url: project.thumbnail, alt: `${project.title}, capture du projet` }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description: project.description },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { prev, next } = getAdjacentProjects(slug);
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Réalisations", path: "/projects" },
            { name: project.title, path: `/projects/${project.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: project.description,
            url: absoluteUrl(`/projects/${project.slug}`),
            image: project.thumbnail ? absoluteUrl(project.thumbnail) : undefined,
            dateCreated: project.date,
            genre: project.categoryLabel,
            keywords: project.tags.join(", "),
            inLanguage: "fr-FR",
            creator: { "@id": schemaIds.person },
          },
        ]}
      />
      <ProjectDetailClient project={project} prev={prev} next={next} />
    </>
  );
}

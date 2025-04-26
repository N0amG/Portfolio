// Page dynamique pour chaque projet
import { notFound } from 'next/navigation';
import projects from '@/data/projects';

export default function ProjectDetail({ params }) {
  const { slug } = params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) return notFound();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold text-indigo-400 mb-4">{project.title}</h1>
      <img src={project.img} alt={project.title} className="w-full max-w-md rounded-xl mb-6" />
      <p className="text-slate-300 text-lg mb-4">{project.description}</p>
      <div className="flex gap-2 mb-4">
        {project.tags.map((tag) => (
          <span key={tag} className="bg-slate-800 text-slate-200 px-3 py-1 rounded-full text-sm">{tag}</span>
        ))}
      </div>
    </div>
  );
}
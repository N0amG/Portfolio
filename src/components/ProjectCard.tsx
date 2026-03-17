"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Project } from "@/data/projects";

interface Props {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12}}
      whileHover={{ y: -8 }}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group glass-card overflow-hidden rounded-2xl flex flex-col h-full block"
      >
        <div className="aspect-video overflow-hidden relative bg-base-200">
          <div className="absolute top-4 right-4 z-10 badge badge-primary font-bold">
            {project.category}
          </div>
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-base-200 to-base-300 transition-transform duration-700 group-hover:scale-110" />
          )}
        </div>
        <div className="p-8 flex-1 flex flex-col">
          <span className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
            {project.categoryLabel}
          </span>
          <h4 className="text-2xl font-bold text-base-content mb-4 group-hover:text-primary transition-colors">
            {project.title}
          </h4>
          <p className="text-base-content/60 text-sm leading-relaxed mb-6">
            {project.description}
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-base-content/5 px-2 py-1 text-[10px] text-base-content/50 uppercase tracking-wider font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

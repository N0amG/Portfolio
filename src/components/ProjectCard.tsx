"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Project } from "@/data/portfolio/projects";
import { ease } from "@/lib/site";

/** Carte de réalisation : capture, type, titre, bénéfice en une phrase. */
export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.8, delay: Math.min(index, 6) * 0.07, ease }}
      className="h-full"
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-card bg-card shadow-card transition-[transform,box-shadow] duration-500 ease-[var(--ease-expo)] hover:-translate-y-1.5 hover:shadow-card-hover"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
          {project.thumbnail && (
            <Image
              src={project.thumbnail}
              alt=""
              fill
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
              className="object-cover object-top transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-[1.04]"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="f-label text-accent-ink">{project.categoryLabel}</p>
          <h3 className="f-display mt-2 text-[1.5rem] [--wght:500]">{project.title}</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{project.description}</p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-semibold text-accent-ink">
            Voir le projet
            <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

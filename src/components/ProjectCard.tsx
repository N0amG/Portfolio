"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Project, formatProjectDate } from "@/data/portfolio/projects";
import { ease } from "@/lib/site";

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.7, delay: Math.min(index, 8) * 0.04, ease }}
    >
      <Link href={`/projects/${project.slug}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
          {project.thumbnail && (
            <img
              src={project.thumbnail}
              alt={project.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-[1.06]"
            />
          )}
          {/* volet signal qui balaie au survol */}
          <span
            aria-hidden
            className="opal-fire absolute inset-0 origin-left scale-x-0 opacity-80 mix-blend-color transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-x-100"
          />
          <span className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-3 place-items-center bg-ink text-paper opacity-0 transition-all duration-500 ease-[var(--ease-expo)] group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRightIcon size={20} weight="bold" />
          </span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4 border-t border-line pt-3">
          <div className="min-w-0">
            <h3
              className="f-display text-[clamp(1.6rem,2.4vw,2.4rem)] uppercase transition-[font-variation-settings] duration-700 ease-[var(--ease-expo)] [--wdth:92] group-hover:[--wdth:125]"
              style={{ "--wght": 760 } as React.CSSProperties}
            >
              {project.title}
            </h3>
            <p className="mt-2 text-[15px] text-muted">{project.categoryLabel}</p>
          </div>
          <span className="f-label shrink-0 pt-1 text-muted">{formatProjectDate(project.date)}</span>
        </div>
        <p className="f-label mt-3 text-muted">{project.tags.slice(0, 4).join(" / ")}</p>
      </Link>
    </motion.article>
  );
}

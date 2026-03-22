"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import Lightbox from "@/components/Lightbox";
import { Project } from "@/data/portfolio/projects";

interface Props {
  project: Project;
  prev: Project;
  next: Project;
}

export default function ProjectDetailClient({ project, prev, next }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="pt-20">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-8">
        {/* Hero Banner */}
        <AnimatedSection className="mb-12">
          <div
            className="relative group overflow-hidden rounded-xl aspect-[21/9] bg-base-200 shadow-2xl cursor-pointer"
            onClick={() => setLightboxIndex(0)}
          >
            {project.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div
                className="absolute inset-0 bg-gradient-to-br from-base-200 via-base-300 to-base-100 transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-base-100/90 via-base-100/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                  {project.categoryLabel}
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-base-content leading-tight mb-4 tracking-tight">
                  {project.title}
                </h1>
                <p className="text-base-content/70 text-lg md:text-xl max-w-xl font-light leading-relaxed">
                  {project.description}
                </p>
              </div>
              <div className="flex gap-4">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-primary shadow-lg shadow-primary/20"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    Voir le site
                  </a>
                )}
                {project.codeUrl && (
                  <a
                    href={project.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="btn bg-base-200 text-base-content hover:bg-base-300"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                    Voir le code
                  </a>
                )}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-8 space-y-12">
            {/* Overview */}
            {project.overview && project.overview.length > 0 && (
              <AnimatedSection animation="fade-right">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-base-content">
                  <span className="w-8 h-1 bg-primary rounded-full" />
                  Aperçu du projet
                </h2>
                <div className="space-y-4 text-lg leading-relaxed text-base-content/60">
                  {project.overview.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </AnimatedSection>
            )}

            {/* Challenges */}
            {project.challenges && project.challenges.length > 0 && (
              <AnimatedSection delay={0.1} animation="fade-left">
                <div className="bg-base-200/50 p-8 rounded-xl border border-base-content/10">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-base-content">
                    <span className="w-8 h-1 bg-primary rounded-full" />
                    Défis rencontrés
                  </h2>
                  <div className="space-y-6">
                    {project.challenges.map((ch, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="flex gap-4"
                      >
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-base-content mb-1">{ch.title}</h3>
                          <p className="text-base-content/60">{ch.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <AnimatedSection delay={0.2} animation="fade-left">
              <div className="bg-base-200/30 rounded-xl p-6 border border-base-content/10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-base-content/40 mb-6">
                  Détails du projet
                </h3>
                <div className="space-y-6">
                  {project.role && (
                    <div className="flex flex-col gap-1 pb-4 border-b border-base-content/10">
                      <span className="text-base-content/40 text-xs font-semibold">RÔLE</span>
                      <span className="text-base-content font-medium">{project.role}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 pb-4 border-b border-base-content/10">
                    <span className="text-base-content/40 text-xs font-semibold">TECHNOLOGIES</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="badge badge-ghost text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3} animation="scale">
              <div className="p-6 rounded-xl bg-primary text-primary-content flex flex-col items-center text-center">
                <svg className="h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                <h4 className="font-bold text-lg mb-2">Un projet similaire ?</h4>
                <p className="text-primary-content/80 text-sm mb-4">
                  Contactez moi pour en discuter
                </p>
                <Link
                  href="/contact"
                  className="btn btn-sm w-full bg-white text-primary hover:bg-base-200 border-none"
                >
                  Discutons
                </Link>
              </div>
            </AnimatedSection>
          </aside>
        </div>

        {/* Screenshots */}
        {project.screenshots && project.screenshots.length > 0 && (
          <AnimatedSection className="mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-base-content mb-8">
              Screenshots & Design System
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.screenshots.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-base-200 border border-base-content/10 cursor-pointer"
                  onClick={() => setLightboxIndex(i)}
                >
                  <img
                    src={src}
                    alt={`${project.title} - screenshot ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIndex !== null && project.screenshots && (
            <Lightbox
              images={project.screenshots}
              initialIndex={lightboxIndex}
              alt={project.title}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </AnimatePresence>

        {/* Navigation between projects */}
        <div className="border-t border-base-content/10 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <Link
            href={`/projects/${prev.slug}`}
            className="group flex flex-col items-start gap-2"
          >
            <span className="text-base-content/40 text-xs font-bold uppercase tracking-widest">
              Projet précédent
            </span>
            <span className="text-base-content text-xl font-bold group-hover:text-primary transition-colors flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {prev.title}
            </span>
          </Link>
          <div className="hidden md:block h-12 w-px bg-base-content/10" />
          <Link
            href={`/projects/${next.slug}`}
            className="group flex flex-col items-end gap-2"
          >
            <span className="text-base-content/40 text-xs font-bold uppercase tracking-widest">
              Projet suivant
            </span>
            <span className="text-base-content text-xl font-bold group-hover:text-primary transition-colors flex items-center gap-2">
              {next.title}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "@/components/ProjectCard";
import AnimatedSection from "@/components/AnimatedSection";
import { projects } from "@/data/projects";
import Link from "next/link";

const categories = ["Tous", "Frontend", "Backend", "Fullstack", "Python", "Gestion de projet"];

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState("Tous");

  const filteredProjects =
    activeFilter === "Tous"
      ? projects
      : projects.filter((p) => p.category === activeFilter);

  return (
    <div className="pt-24">
      <div className="w-full max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <AnimatedSection className="mb-16" animation="blur">
          <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-base-content">
            Projects <span className="text-accent">Gallery</span>
          </h2>
          <p className="text-base-content/50 text-lg max-w-2xl leading-relaxed">
            Une sélection de mes réalisations en développement web, mobile et
            open-source. Focus sur la performance, la scalabilité et
            l&apos;expérience utilisateur.
          </p>
        </AnimatedSection>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-12 border-b border-base-content/10 pb-8">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -2 }}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeFilter === cat
                  ? "btn-primary bg-primary text-primary-content shadow-lg shadow-primary/20"
                  : "bg-base-200 text-base-content/60 hover:bg-base-300"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Projects Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredProjects.map((project, i) => (
              <ProjectCard key={project.slug} project={project} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <AnimatedSection className="mt-24 mb-12" animation="scale">
          <div className="p-12 rounded-2xl bg-secondary/5 border border-secondary/20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-3xl font-black mb-4 tracking-tight text-base-content">
                Un projet unique en tête ?
              </h3>
              <p className="text-base-content/50 text-base leading-relaxed">
                Je suis toujours à la recherche de collaborateurs ambitieux et de
                défis innovants. Construisons quelque chose qui fait la
                différence.
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/contact"
                className="flex items-center gap-3 btn btn-secondary py-4 px-8 rounded-xl font-bold shadow-xl shadow-secondary/30"
              >
                Démarrer une conversation
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

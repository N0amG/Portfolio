"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const letterPull = {
  hidden: { opacity: 0, y: 80, rotateX: 40 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Home() {
  const featuredProjects = projects.slice(0, 3);
  const nameParts = ["N", "o", "a", "m", "\u00A0", "G", "u", "e", "z"];

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          <motion.div
            className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[120px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-secondary/10 blur-[150px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto" style={{ perspective: "800px" }}>
          <motion.span
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary uppercase mb-8"
          >
            Disponible pour de nouveaux défis
          </motion.span>

          <motion.h1
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-base-content mb-6 flex justify-center flex-wrap"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {nameParts.map((char, i) => (
              <motion.span key={i} variants={letterPull} className="inline-block">
                {char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 1 }}
            className="text-xl md:text-3xl font-light text-base-content/50 max-w-2xl mx-auto leading-relaxed"
          >
            Développeur Web passionné par la création d&apos;applications
            modernes et d&apos;architectures robustes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/projects"
                className="group flex items-center gap-2 btn btn-primary rounded-full px-8 py-4 text-lg font-bold"
              >
                Voir mes projets
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/contact"
                className="btn btn-ghost rounded-full border border-base-content/10 px-8 py-4 text-lg font-bold"
              >
                Me contacter
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-40"
        >
          <svg className="h-8 w-8 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ─── About Section ─── */}
      <section className="py-24 px-6 bg-base-200/50" id="about">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection animation="fade-right">
              <motion.div
                className="relative aspect-square overflow-hidden rounded-2xl bg-base-200"
                whileHover={{ scale: 1.03, rotate: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <motion.img
                  src="/img/selfie.jpeg"
                  alt="Noam Guez"
                  className="h-full w-full object-cover"
                  initial={{ scale: 1.15 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.2} animation="fade-left">
              <h2 className="text-primary text-sm font-bold tracking-widest uppercase mb-4">
                À propos
              </h2>
              <h3 className="text-4xl md:text-5xl font-bold text-base-content mb-8 leading-tight">
                Transformer les idées complexes en expériences numériques intuitives.
              </h3>
              <div className="space-y-6 text-lg text-base-content/60 leading-relaxed">
                <p>
                  Développeur Web basé à Lyon, je me spécialise dans la
                  construction d&apos;applications web modernes de bout en bout. Mon
                  approche combine une attention méticuleuse au design UI/UX avec
                  une rigueur technique backend.
                </p>
                <p>
                  Formé chez OpenClassrooms et passé par l&apos;École 42 et un stage
                  de 6 mois en agence web, je maîtrise React, Next.js, TypeScript,
                  Python, Django et NestJS.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-xl">
                  <svg className="h-6 w-6 text-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <h4 className="text-base-content font-bold">Stack Frontend</h4>
                  <p className="text-sm text-base-content/40 mt-2">React, Next.js, Tailwind CSS, TypeScript</p>
                </div>
                <div className="glass-card p-6 rounded-xl">
                  <svg className="h-6 w-6 text-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                  <h4 className="text-base-content font-bold">Stack Backend</h4>
                  <p className="text-sm text-base-content/40 mt-2">Python, Django, NestJS, PostgreSQL, MongoDB</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── Projects Section ─── */}
      <section className="py-24 px-6" id="projects">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <AnimatedSection>
              <h2 className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Portfolio</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-base-content leading-tight">Projets Sélectionnés</h3>
            </AnimatedSection>
            <AnimatedSection delay={0.2} animation="fade-left">
              <p className="text-base-content/50 max-w-md">
                Une sélection de mes travaux récents, allant des plateformes SaaS aux applications mobiles innovantes.
              </p>
            </AnimatedSection>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project, i) => (
              <ProjectCard key={project.slug} project={project} index={i} />
            ))}
          </div>

          <AnimatedSection className="text-center mt-12" animation="scale">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 btn btn-ghost rounded-full border border-base-content/10 px-8 py-4 text-lg font-bold"
              >
                Voir tous les projets
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Contact CTA Section ─── */}
      <section className="py-24 px-6 bg-base-200/50 border-t border-base-content/5" id="contact">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="text-center mb-16" animation="blur">
            <h2 className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Contact</h2>
            <h3 className="text-4xl md:text-6xl font-black text-base-content mb-6">Parlons de votre projet</h3>
            <p className="text-base-content/50 text-lg max-w-2xl mx-auto">
              Je suis toujours ouvert à discuter de nouvelles opportunités ou de collaborations intéressantes.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="glass-card p-10 rounded-3xl grid md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-xl font-bold text-base-content mb-8">Informations de contact</h4>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/40 uppercase font-bold tracking-wider">Email</p>
                      <p className="text-base-content font-medium">noamguez0@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/40 uppercase font-bold tracking-wider">Localisation</p>
                      <p className="text-base-content font-medium">Lyon, France</p>
                    </div>
                  </div>
                </div>
                <div className="mt-12">
                  <h4 className="text-base-content font-bold mb-4">Suivez-moi</h4>
                  <div className="flex gap-4">
                    <motion.a whileHover={{ scale: 1.15, rotate: 5 }} className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-content/5 text-base-content hover:bg-primary hover:text-white transition-colors" href="#" aria-label="GitHub">
                      <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </motion.a>
                    <motion.a whileHover={{ scale: 1.15, rotate: -5 }} className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-content/5 text-base-content hover:bg-primary hover:text-white transition-colors" href="#" aria-label="LinkedIn">
                      <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </motion.a>
                  </div>
                </div>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-base-content/50 mb-2">Nom</label>
                  <input className="input input-bordered w-full bg-base-content/5" placeholder="Votre nom" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content/50 mb-2">Email</label>
                  <input className="input input-bordered w-full bg-base-content/5" placeholder="votre@email.com" type="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content/50 mb-2">Message</label>
                  <textarea className="textarea textarea-bordered w-full bg-base-content/5 resize-none" placeholder="Votre projet en quelques mots..." rows={4} />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary w-full" type="button">
                  Envoyer le message
                </motion.button>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}

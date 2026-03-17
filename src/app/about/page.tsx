"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import GithubActivity from "@/components/GithubActivity";

const skills = [
  { name: "React & Next.js", icon: "code" },
  { name: "TypeScript", icon: "code" },
  { name: "Python & Django", icon: "python" },
  { name: "PostgreSQL & MongoDB", icon: "database" },
  { name: "Docker & CI/CD", icon: "cloud" },
  { name: "Tailwind CSS", icon: "palette" },
  { name: "NestJS & Node.js", icon: "hub" },
  { name: "Git & Tests", icon: "security" },
];

const experiences = [
  {
    period: "2025 — 2026",
    title: "Développeur Web (Bac +3)",
    company: "Formation OpenClassrooms • Python / Django",
    description:
      "Formation diplômante de niveau Bac +3 axée sur le développement backend avec Python et Django, incluant la réalisation de projets professionnalisants.",
    active: true,
  },
  {
    period: "2025",
    title: "Développeur Fullstack — Stage (6 mois)",
    company: "JVAIS Agence Web",
    description:
      "Développement d'applications fullstack avec React Native, Tailwind, TypeScript et NestJS. Intégration d'APIs d'intelligence artificielle.",
    active: true,
  },
  {
    period: "2024 — 2025",
    title: "Développeur Web (Bac +2)",
    company: "Formation OpenClassrooms • React / Node.js",
    description:
      "Formation diplômante de niveau Bac +2 axée sur le développement frontend et backend avec React et Node.js.",
    active: false,
  },
  {
    period: "Juillet 2024",
    title: "Piscine de Développement",
    company: "École 42 Lyon",
    description:
      "1 mois d'immersion intensive pour apprendre le langage C, avec des rushs en équipe et des projets sous pression.",
    active: false,
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24">
      <div className="max-w-[1000px] w-full mx-auto px-6 md:px-10 py-12 flex flex-col gap-16">
        {/* Profile Hero */}
        <AnimatedSection animation="blur">
          <section className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <img
                src="/img/selfie.jpeg"
                alt="Noam Guez"
                className="relative h-48 w-48 rounded-full object-cover border-4 border-primary/10"
              />
            </motion.div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-base-content mb-2">
                Noam Guez
              </h1>
              <p className="text-primary text-xl font-semibold mb-4">
                Développeur Web Fullstack
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                <div className="flex items-center gap-2 text-base-content/50">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="text-sm">Lyon, France</span>
                </div>
                <div className="flex items-center gap-2 text-base-content/50">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-sm">noamguez0@gmail.com</span>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* About Me */}
        <AnimatedSection animation="fade-left">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold text-base-content">À propos de moi</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base-content/70 leading-relaxed">
              <p>
                Développeur Web passionné de 20 ans, ayant terminé ma formation
                Bac +3 chez OpenClassrooms (Python / Django). Fort d&apos;un stage
                de 6 mois en agence web, je maîtrise aussi bien le frontend (React,
                Next.js, TypeScript) que le backend (Node.js, NestJS, Django).
              </p>
              <p>
                Curieux et autodidacte, je m&apos;intéresse à l&apos;intelligence
                artificielle, à la cybersécurité et au développement applicatif.
                Sociable et dynamique, j&apos;aime le travail d&apos;équipe et
                les défis techniques. En dehors du code, je suis passionné par
                la culture japonaise, les jeux vidéo et la physique.
              </p>
            </div>
          </section>
        </AnimatedSection>

        {/* Technical Skills */}
        <AnimatedSection>
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold text-base-content">Expertise Technique</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {skills.map((skill, i) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, y: 30, rotate: -3 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  className="flex flex-col items-center p-6 rounded-xl bg-base-200/50 border border-base-content/10 transition-colors group"
                >
                  {skill.icon === "python" ? (
                    <svg className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" viewBox="0 0 256 255" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" />
                      <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.519 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z" />
                    </svg>
                  ) : (
                  <svg className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {skill.icon === "code" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />}
                    {skill.icon === "database" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />}
                    {skill.icon === "cloud" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />}
                    {skill.icon === "palette" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />}
                    {skill.icon === "hub" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-1.06a4.5 4.5 0 00-6.364-6.364L6.34 6.514a4.5 4.5 0 001.242 7.244" />}
                    {skill.icon === "security" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />}
                  </svg>
                  )}
                  <span className="font-semibold text-sm text-center text-base-content">{skill.name}</span>
                </motion.div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* Experience */}
        <AnimatedSection>
          <section>
            <div className="flex items-center gap-3 mb-10">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold text-base-content">Expérience</h2>
            </div>
            <div className="relative border-l-2 border-primary/20 ml-4 space-y-12">
              {experiences.map((exp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="relative pl-10"
                >
                  <motion.div
                    className={`absolute -left-[11px] top-0 h-5 w-5 rounded-full border-4 border-base-100 shadow-md ${
                      exp.active ? "bg-primary" : "bg-base-300"
                    }`}
                    whileInView={exp.active ? { scale: [1, 1.4, 1] } : {}}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.12 + 0.3 }}
                  />
                  <span className="text-primary font-bold text-sm tracking-widest uppercase mb-1 block">
                    {exp.period}
                  </span>
                  <h3 className="text-xl font-bold text-base-content">{exp.title}</h3>
                  <p className="text-base-content/50 font-medium mb-3">{exp.company}</p>
                  <p className="text-base-content/70 max-w-2xl leading-relaxed">{exp.description}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* GitHub Activity */}
        <AnimatedSection animation="fade-right">
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold text-base-content">Activité GitHub récente</h2>
            </div>
            <GithubActivity />
          </section>
        </AnimatedSection>

        {/* Education & Certifications */}
        <AnimatedSection animation="scale">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold text-base-content">Éducation</h2>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Bac +3 Développeur Web", sub: "OpenClassrooms • Python / Django", date: "2025 — 2026" },
                  { title: "Bac +2 Développeur Web", sub: "OpenClassrooms • React / Node.js", date: "2024 — 2025" },
                  { title: "Baccalauréat — Mention Bien", sub: "Lycée Déborde Lyon • Spé Maths / NSI", date: "2021 — 2023" },
                ].map((edu, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 rounded-xl bg-base-200/50 border border-base-content/10"
                  >
                    <h4 className="text-lg font-bold text-base-content">{edu.title}</h4>
                    <p className="text-base-content/50">{edu.sub}</p>
                    <p className="text-primary text-sm font-semibold mt-1">{edu.date}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold text-base-content">Certifications</h2>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Python Essentials 1", sub: "Cisco NetAcad" },
                  { title: "Piscine 42 Lyon", sub: "École 42 • Juillet 2024" },
                ].map((cert, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-base-content/10"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-base-content">{cert.title}</p>
                      <p className="text-xs text-base-content/40">{cert.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      </div>
    </div>
  );
}

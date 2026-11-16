import type { Metadata } from "next";
import GithubActivity from "@/components/GithubActivity";
import { FadeIn, MaskLines, SectionHead } from "@/components/Reveal";
import AboutPortrait from "@/components/about/AboutPortrait";

export const metadata: Metadata = {
  title: "Profil | Noam Guez",
  description: "Parcours, compétences et activité de Noam Guez, développeur web fullstack à Lyon.",
};

const experiences = [
  {
    period: "2025 — 2026",
    title: "Développeur Web (Bac +3)",
    company: "OpenClassrooms — Python / Django",
    description:
      "Formation diplômante de niveau Bac +3 axée sur le développement backend avec Python et Django, incluant la réalisation de projets professionnalisants.",
  },
  {
    period: "2025",
    title: "Développeur Fullstack — Stage (6 mois)",
    company: "JVAIS Agence Web",
    description:
      "Développement d'applications fullstack avec React Native, Tailwind, TypeScript et NestJS. Intégration d'APIs d'intelligence artificielle.",
  },
  {
    period: "2024 — 2025",
    title: "Développeur Web (Bac +2)",
    company: "OpenClassrooms — React / Node.js",
    description: "Formation diplômante de niveau Bac +2 axée sur le développement frontend et backend avec React et Node.js.",
  },
  {
    period: "Juil. 2024",
    title: "Piscine de Développement",
    company: "École 42 Lyon",
    description: "1 mois d'immersion intensive pour apprendre le langage C, avec des rushs en équipe et des projets sous pression.",
  },
];

const stack = [
  { domain: "Interface", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "React Native"] },
  { domain: "Serveur", items: ["Node.js", "NestJS", "Express", "Python", "Django"] },
  { domain: "Données", items: ["PostgreSQL", "MongoDB", "SQLite", "SQLAlchemy"] },
  { domain: "Outillage", items: ["Git", "Docker", "CI/CD", "Tests", "Sentry"] },
];

const education = [
  { title: "Bac +3 Développeur Web", sub: "OpenClassrooms — Python / Django", date: "2025 — 2026" },
  { title: "Bac +2 Développeur Web", sub: "OpenClassrooms — React / Node.js", date: "2024 — 2025" },
  { title: "Baccalauréat, mention Bien", sub: "Lycée Déborde, Lyon — Spé Maths / NSI", date: "2021 — 2023" },
];

const certifications = [
  { title: "Python Essentials 1", sub: "Cisco NetAcad" },
  { title: "Piscine 42 Lyon", sub: "École 42 — juillet 2024" },
];

const interests = ["Intelligence artificielle", "Cybersécurité", "Culture japonaise", "Jeux vidéo", "Physique"];

export default function AboutPage() {
  return (
    <div className="pb-24 pt-28 md:pb-36 md:pt-40">
      {/* En-tête */}
      <section className="shell">
        <p className="f-label mb-6 text-muted">
          <span className="text-signal">(Profil)</span>&nbsp;&nbsp;Noam Guez, 20 ans
        </p>
        <div className="grid-12 gap-y-10">
          <MaskLines
            as="h1"
            className="f-display col-span-4 text-[clamp(3rem,9.4vw,10rem)] uppercase md:col-span-9"
            lineClassName="[--wght:860]"
            lines={[
              <span key="1" style={{ "--wdth": 130 } as React.CSSProperties} className="f-display">
                Du pixel
              </span>,
              <span key="2" style={{ "--wdth": 70 } as React.CSSProperties} className="f-display">
                à la base
              </span>,
              <span key="3" style={{ "--wdth": 130 } as React.CSSProperties} className="f-display text-signal">
                de données.
              </span>,
            ]}
          />
          <AboutPortrait />
        </div>

        <div className="grid-12 mt-16 gap-y-8 md:mt-24">
          <FadeIn className="col-span-4 md:col-span-5 md:col-start-5">
            <p className="text-pretty text-[clamp(1.25rem,1.9vw,1.6rem)] leading-[1.3]">
              Développeur web de 20 ans, j&apos;ai terminé ma formation Bac +3 chez OpenClassrooms (Python / Django). Fort
              d&apos;un stage de 6 mois en agence web, je travaille aussi bien le frontend (React, Next.js, TypeScript) que le
              backend (Node.js, NestJS, Django).
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="col-span-4 md:col-span-3">
            <p className="text-[17px] leading-relaxed text-muted">
              Curieux et autodidacte, je m&apos;intéresse à l&apos;IA, à la cybersécurité et au développement applicatif.
              Sociable, j&apos;aime le travail d&apos;équipe et les défis techniques.
            </p>
            <ul className="mt-6 flex flex-wrap gap-1.5">
              {interests.map((it) => (
                <li key={it} className="f-label border border-line px-2 py-1">
                  {it}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* 01 Parcours */}
      <section className="shell mt-28 md:mt-40">
        <SectionHead index="01" title="Parcours" meta="2024 → aujourd'hui" />
        <ol>
          {experiences.map((e, i) => (
            <FadeIn key={e.title} delay={i * 0.05}>
              <li className="grid-12 group gap-y-2 border-b border-line py-8 md:py-10">
                <span className="f-label col-span-4 text-signal md:col-span-2">{e.period}</span>
                <div className="col-span-4 md:col-span-5">
                  <h3
                    className="f-display text-[clamp(1.8rem,3vw,3rem)] uppercase transition-[font-variation-settings] duration-700 ease-[var(--ease-expo)] [--wdth:84] [--wght:720] group-hover:[--wdth:110]"
                  >
                    {e.title}
                  </h3>
                  <p className="f-label mt-3 text-muted">{e.company}</p>
                </div>
                <p className="col-span-4 text-[17px] leading-relaxed text-muted md:col-span-4 md:col-start-9">{e.description}</p>
              </li>
            </FadeIn>
          ))}
        </ol>
      </section>

      {/* 02 Outils */}
      <section className="shell mt-28 md:mt-40">
        <SectionHead index="02" title="Outils" meta="Ce que j'utilise au quotidien" />
        <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
          {stack.map((s, i) => (
            <FadeIn key={s.domain} delay={i * 0.07} className="bg-paper py-8 pr-4 md:px-6 md:first:pl-0">
              <p className="f-label text-muted">
                {String(i + 1).padStart(2, "0")} — {s.domain}
              </p>
              <ul className="mt-6 space-y-1">
                {s.items.map((it) => (
                  <li key={it} className="f-display text-[clamp(1.4rem,2.2vw,2.1rem)] uppercase [--wdth:78] [--wght:640]">
                    {it}
                  </li>
                ))}
              </ul>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 03 Activité */}
      <section className="shell mt-28 md:mt-40">
        <SectionHead index="03" title="Activité GitHub" meta="Derniers commits" />
        <div className="grid-12 mt-10">
          <FadeIn className="col-span-4 md:col-span-10 md:col-start-3">
            <GithubActivity />
          </FadeIn>
        </div>
      </section>

      {/* 04 Formation */}
      <section className="shell mt-28 md:mt-40">
        <SectionHead index="04" title="Formation & certifications" />
        <div className="grid-12 gap-y-12 pt-4">
          <div className="col-span-4 md:col-span-7">
            {education.map((e, i) => (
              <FadeIn key={e.title} delay={i * 0.05}>
                <div className="flex items-baseline justify-between gap-6 border-b border-line py-6">
                  <div>
                    <p className="text-xl font-medium md:text-2xl">{e.title}</p>
                    <p className="mt-1 text-[15px] text-muted">{e.sub}</p>
                  </div>
                  <span className="f-label shrink-0 text-muted">{e.date}</span>
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="col-span-4 md:col-span-4 md:col-start-9">
            <p className="f-label pt-6 text-muted">Certifications</p>
            {certifications.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.05}>
                <div className="mt-4 flex items-start gap-3 border border-line p-4">
                  <span className="mt-1.5 block h-2 w-2 shrink-0 bg-signal" />
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="f-label mt-1 text-muted">{c.sub}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

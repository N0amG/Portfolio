import type { Metadata } from "next";
import GithubActivity from "@/components/GithubActivity";
import { FadeIn, MaskLines, SectionHead } from "@/components/Reveal";
import AboutPortrait from "@/components/about/AboutPortrait";

export const metadata: Metadata = {
  title: "À propos | Noam Guez",
  description:
    "Noam Guez, développeur web freelance à Lyon : parcours en entreprise, Master DevOps à l'EPSI, outils et activité GitHub.",
};

const experiences = [
  {
    period: "2026 — aujourd'hui",
    title: "Développeur web",
    company: "Elissar",
    description: "Migration complète vers React et Node.js d'un logiciel commercialisé auprès de clients.",
  },
  {
    period: "2026 — aujourd'hui",
    title: "Master DevOps (Bac +5)",
    company: "EPSI",
    description: "Infrastructure, conteneurisation, CI/CD et automatisation des déploiements.",
  },
  {
    period: "Aujourd'hui",
    title: "Développeur web freelance",
    company: "Indépendant",
    description: "Sites, applications et API pour particuliers et entreprises.",
  },
  {
    period: "2025",
    title: "Développeur fullstack",
    company: "JVAIS Agence Web",
    description:
      "Développement d'applications fullstack au sein de l'équipe technique : React Native, Tailwind, TypeScript et NestJS, intégration d'APIs d'IA.",
  },
  {
    period: "2025 — 2026",
    title: "Développeur Web (Bac +3)",
    company: "OpenClassrooms — Python / Django",
    description:
      "Formation diplômante axée sur le développement backend avec Python et Django, à travers des projets professionnalisants.",
  },
  {
    period: "2024 — 2025",
    title: "Développeur Web (Bac +2)",
    company: "OpenClassrooms — React / Node.js",
    description: "Formation diplômante axée sur le développement frontend et backend avec React et Node.js.",
  },
  {
    period: "Juil. 2024",
    title: "Piscine de développement",
    company: "École 42 Lyon",
    description: "Un mois d'immersion intensive en langage C, avec des rushs en équipe et des projets sous pression.",
  },
];

const stack = [
  { domain: "Interface", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "React Native"] },
  { domain: "Serveur", items: ["Node.js", "NestJS", "Express", "Python", "Django"] },
  { domain: "Données", items: ["PostgreSQL", "MongoDB", "SQLite", "SQLAlchemy"] },
  { domain: "Outillage", items: ["Git", "Docker", "CI/CD", "Tests", "Sentry"] },
];

const education = [
  { title: "Master DevOps (Bac +5)", sub: "EPSI", date: "2026 — 2028", current: true },
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
              <span key="3" style={{ "--wdth": 130 } as React.CSSProperties} className="f-display opal-text">
                de données.
              </span>,
            ]}
          />
          <AboutPortrait />
        </div>

        <div className="grid-12 mt-16 gap-y-8 md:mt-24">
          <FadeIn className="col-span-4 md:col-span-5 md:col-start-5">
            <p className="text-pretty text-[clamp(1.25rem,1.9vw,1.6rem)] leading-[1.3]">
              Je suis Noam, développeur web freelance à Lyon. Je conçois des sites et des applications web complets, de
              l&apos;interface au serveur. Je ne pars pas de zéro : chez Elissar, je mène la migration complète vers React
              et Node.js d&apos;un logiciel vendu à des clients. Avant ça, j&apos;ai travaillé en équipe chez JVAIS, une
              agence web, sur des projets fullstack (React Native, NestJS, intégration d&apos;IA). Côté formation : un Bac
              +3 Développeur web, et un Master DevOps (Bac +5) en cours à l&apos;EPSI.
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="col-span-4 md:col-span-3">
            <p className="text-[17px] leading-relaxed text-muted">
              Ce qui m&apos;intéresse : les interfaces soignées, les architectures simples à maintenir, et l&apos;IA quand
              elle sert vraiment le produit. Hors code : culture japonaise, jeux vidéo, physique.
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

      {/* Parcours */}
      <section className="shell mt-28 md:mt-40">
        <SectionHead title="Parcours" meta="2024 → aujourd'hui" />
        <ol>
          {experiences.map((e, i) => (
            <li key={e.title} className="group border-b border-line py-8 md:py-10">
              <FadeIn delay={Math.min(i, 3) * 0.05} className="grid-12 gap-y-2">
                <span className="f-label col-span-4 text-signal md:col-span-2">{e.period}</span>
                <div className="col-span-4 md:col-span-5">
                  <h3 className="f-display text-[clamp(1.8rem,3vw,3rem)] uppercase transition-[font-variation-settings] duration-700 ease-[var(--ease-expo)] [--wdth:84] [--wght:720] group-hover:[--wdth:110]">
                    {e.title}
                  </h3>
                  <p className="f-label mt-3 text-muted">{e.company}</p>
                </div>
                <p className="col-span-4 text-[17px] leading-relaxed text-muted md:col-span-4 md:col-start-9">
                  {e.description}
                </p>
              </FadeIn>
            </li>
          ))}
        </ol>
      </section>

      {/* Outils */}
      <section className="shell mt-28 md:mt-40">
        <SectionHead title="Outils" meta="Au quotidien" />
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stack.map((s, i) => (
            <FadeIn
              key={s.domain}
              delay={i * 0.07}
              className={`border-b border-line py-8 pr-4 md:border-b-0 md:px-6 ${i > 0 ? "md:border-l" : "md:pl-0"}`}
            >
              <p className="f-label text-muted">{s.domain}</p>
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

      {/* Activité */}
      <section className="shell mt-28 md:mt-40">
        <SectionHead title="Activité GitHub" meta="Derniers commits" />
        <div className="grid-12 mt-10">
          <FadeIn className="col-span-4 md:col-span-10 md:col-start-3">
            <GithubActivity />
          </FadeIn>
        </div>
      </section>

      {/* Formation */}
      <section className="shell mt-28 md:mt-40">
        <SectionHead title="Formation & certifications" />
        <div className="grid-12 gap-y-12 pt-4">
          <div className="col-span-4 md:col-span-7">
            {education.map((e, i) => (
              <FadeIn key={e.title} delay={i * 0.05}>
                <div className="flex items-baseline justify-between gap-6 border-b border-line py-6">
                  <div>
                    <p className="flex flex-wrap items-center gap-3 text-xl font-medium md:text-2xl">
                      {e.title}
                      {e.current && <span className="f-label opal-fill px-2 py-1 text-on-signal">En cours</span>}
                    </p>
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
                  <span className="opal-fill mt-1.5 block h-2 w-2 shrink-0" />
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

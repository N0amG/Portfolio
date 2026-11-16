import Link from "next/link";
import HeroName from "@/components/home/HeroName";
import HeroPortrait from "@/components/home/HeroPortrait";
import VelocityMarquee from "@/components/home/VelocityMarquee";
import ScrollStatement from "@/components/home/ScrollStatement";
import ProjectIndex from "@/components/ProjectIndex";
import LocalTime from "@/components/LocalTime";
import { FadeIn, SectionHead } from "@/components/Reveal";
import { latestProjects } from "@/data/portfolio/projects";

const stack = ["React", "Next.js", "TypeScript", "Node.js", "NestJS", "Python", "Django", "PostgreSQL", "Tailwind", "Docker"];

const services = [
  {
    title: "Sites vitrines",
    text: "Pour présenter votre activité : un site rapide, bien placé sur Google, que vous pouvez faire évoluer.",
  },
  {
    title: "Applications web",
    text: "Espace client, outil de gestion, plateforme de réservation : une application conçue pour votre activité.",
  },
  {
    title: "Coulisses & données",
    text: "Comptes utilisateurs, base de données, connexion à vos outils existants : tout ce qui fait tourner le site, hébergé et mis à jour sans effort.",
  },
  {
    title: "Amélioration d'un site existant",
    text: "Un site plus rapide, mieux référencé sur Google et facile à utiliser pour tous.",
  },
];

const steps = [
  {
    title: "1. On en parle",
    text: "On définit ensemble votre besoin, ce qui est inclus et le délai. Vous recevez un devis clair.",
  },
  {
    title: "2. Je le construis",
    text: "Vous suivez l'avancement sur une version en ligne, mise à jour au fil du projet, et vous donnez votre avis.",
  },
  {
    title: "3. Mise en ligne",
    text: "Votre site est publié, je vous transmets tous les accès, et je reste joignable après.",
  },
];

export default function Home() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="shell relative flex min-h-[84svh] flex-col pb-6 pt-24 md:min-h-svh md:pt-28">
        <div className="f-label hero-up grid-12 gap-y-2 text-muted" style={{ animationDelay: "0.15s" }}>
          <span className="col-span-2 md:col-span-3">
            Indépendant
            <br />
            Particuliers & entreprises
          </span>
          <span className="col-span-2 md:col-span-3">
            Sites internet
            <br />
            Applications web
          </span>
          <span className="col-span-2 hidden md:col-span-3 md:block">{"Lyon, France"}</span>
          <span className="col-span-2 hidden text-right md:col-span-3 md:block">
            Heure locale
            <br />
            <LocalTime className="text-ink" />
          </span>
        </div>

        <div className="hero-name relative mt-auto pt-10 text-[19vw]">
          <HeroName lines={["Noam", "Guez"]} />
          <HeroPortrait />
        </div>

        <div className="grid-12 mt-8 items-end gap-y-6 md:mt-10">
          <div className="hero-up col-span-4 md:col-span-6" style={{ animationDelay: "0.2s" }}>
            <p className="text-pretty max-w-[40ch] text-lg leading-snug md:text-[1.375rem]">
              Je crée votre site ou votre application web, de la première maquette à la mise en ligne. Un seul
              interlocuteur, un travail soigné, et un site qui s&apos;affiche vite, même sur mobile.
            </p>
          </div>
          <div
            className="hero-up col-span-4 flex flex-wrap gap-2 md:col-span-5 md:col-start-8 md:justify-end"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="#travaux"
              className="f-label flex h-12 items-center border border-ink px-5 transition-colors hover:bg-ink hover:text-paper"
            >
              Voir les projets
            </Link>
            <Link
              href="/contact"
              className="f-label opal-fill group flex h-12 items-center gap-3 px-5 text-on-signal"
            >
              Démarrer un projet
              <span className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Bandeau stack ───────── */}
      <section className="border-y border-line py-4 md:py-6">
        <VelocityMarquee
          items={stack}
          className="f-display text-[13vw] uppercase leading-[0.9] [--wdth:62] [--wght:780] md:text-[8.5vw]"
        />
      </section>

      {/* ───────── Ce que je fais ───────── */}
      <section className="shell py-24 md:py-40">
        <div className="grid-12">
          <div className="col-span-4 md:col-span-10 md:col-start-3">
            <ScrollStatement
              className="f-display text-[clamp(2rem,4.6vw,4.6rem)] leading-[1.06] [--wdth:96] [--wght:560]"
              text="Je travaille en direct avec vous, du premier échange à la mise en ligne. Des outils modernes et éprouvés, un site rapide et sécurisé, et un travail *pensé* *pour* *durer.*"
            />
          </div>
        </div>

        <SectionHead title="Ce que je fais" meta="Sites · Applications · Améliorations" className="mt-24 md:mt-36" />
        <ul className="grid md:grid-cols-2">
          {services.map((s, i) => (
            <li
              key={s.title}
              className={`border-b border-line py-8 md:py-10 ${i % 2 === 0 ? "md:border-r md:pr-10" : "md:pl-10"}`}
            >
              <FadeIn delay={(i % 2) * 0.08}>
                <h3 className="f-display text-[clamp(1.6rem,2.6vw,2.6rem)] uppercase [--wdth:84] [--wght:700]">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-muted">{s.text}</p>
              </FadeIn>
            </li>
          ))}
        </ul>

        <SectionHead title="Comment je travaille" className="mt-24 md:mt-36" />
        <ol className="grid gap-x-[var(--gutter)] md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="border-b border-line py-8 md:border-b-0">
              <FadeIn delay={i * 0.08}>
                <span aria-hidden className="opal-fire mb-6 block h-[3px] w-full" />
                <h3 className="text-2xl font-medium">{s.title}</h3>
                <p className="mt-3 text-[17px] leading-relaxed text-muted">{s.text}</p>
              </FadeIn>
            </li>
          ))}
        </ol>

        <FadeIn className="mt-12">
          <Link href="/about" className="f-label u-link inline-flex items-center gap-2">
            En savoir plus sur moi <span className="text-signal">→</span>
          </Link>
        </FadeIn>
      </section>

      {/* ───────── Projets récents ───────── */}
      <section id="travaux" className="shell scroll-mt-24 pb-24 md:pb-40">
        <SectionHead title="Projets récents" meta={`${latestProjects.length} projets`} />
        <div className="mt-6 md:mt-8">
          <ProjectIndex projects={latestProjects.slice(0, 6)} />
        </div>
        <FadeIn className="mt-12 flex justify-end">
          <Link href="/projects" className="group flex items-baseline gap-3">
            <span
              className="f-display text-[clamp(2.4rem,6vw,6rem)] uppercase transition-[font-variation-settings] duration-700 ease-[var(--ease-expo)] [--wdth:110] group-hover:[--wdth:130]"
            >
              Tous les projets
            </span>
            <span className="f-label text-signal">({latestProjects.length})</span>
          </Link>
        </FadeIn>
      </section>
    </>
  );
}

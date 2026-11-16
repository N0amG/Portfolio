import Link from "next/link";
import HeroName from "@/components/home/HeroName";
import HeroPortrait from "@/components/home/HeroPortrait";
import VelocityMarquee from "@/components/home/VelocityMarquee";
import ScrollStatement from "@/components/home/ScrollStatement";
import ProjectIndex from "@/components/ProjectIndex";
import LocalTime from "@/components/LocalTime";
import { FadeIn, SectionHead } from "@/components/Reveal";
import { latestProjects } from "@/data/portfolio/projects";
import { site } from "@/lib/site";

const stack = ["React", "Next.js", "TypeScript", "Node.js", "NestJS", "Python", "Django", "PostgreSQL", "Tailwind", "Docker"];

const facts = [
  { k: "Formation", v: "Bac +3 Développeur web", d: "OpenClassrooms — Python / Django, 2026" },
  { k: "Terrain", v: "6 mois en agence", d: "JVAIS — React Native, NestJS, APIs IA" },
  { k: "Origine", v: "Piscine École 42", d: "Lyon, juillet 2024 — C, rushs en équipe" },
];

export default function Home() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="shell relative flex min-h-[84svh] flex-col pb-6 pt-24 md:min-h-svh md:pt-28">
        <FadeIn delay={0.9} y={0} className="f-label grid-12 gap-y-2 text-muted">
          <span className="col-span-2 md:col-span-3">
            (Portfolio)
            <br />
            Édition {new Date().getFullYear()}
          </span>
          <span className="col-span-2 md:col-span-3">
            {site.role}
            <br />
            Front · Back · Données
          </span>
          <span className="col-span-2 hidden md:col-span-3 md:block">
            {site.city}
            <br />
            {site.coords}
          </span>
          <span className="col-span-2 hidden text-right md:col-span-3 md:block">
            Heure locale
            <br />
            <LocalTime className="text-ink" />
          </span>
        </FadeIn>

        <div className="relative mt-auto pt-10 text-[19vw]">
          <HeroName lines={["Noam", "Guez"]} />
          <HeroPortrait />
        </div>

        <div className="grid-12 mt-8 items-end gap-y-6 md:mt-10">
          <FadeIn delay={1.1} className="col-span-4 md:col-span-5">
            <p className="text-pretty max-w-[34ch] text-lg leading-snug md:text-[1.375rem]">
              Je conçois et développe des applications web de bout en bout — de l&apos;interface au serveur — avec une
              attention maniaque au détail.
            </p>
          </FadeIn>
          <FadeIn delay={1.2} className="f-label col-span-2 md:col-span-3 md:col-start-7">
            <span className="flex items-center gap-2.5">
              <span className="live-dot" />
              {site.status}
            </span>
            <span className="mt-1 block text-muted">Réponse habituelle sous 24 h</span>
          </FadeIn>
          <FadeIn delay={1.3} className="col-span-2 flex justify-end md:col-span-3 md:col-start-10">
            <Link
              href="#travaux"
              className="f-label group flex items-center gap-3 border border-ink px-4 py-3 transition-colors hover:bg-ink hover:text-paper"
            >
              Voir les travaux
              <span className="relative block h-3 w-px overflow-hidden bg-current">
                <span className="absolute inset-x-0 top-0 h-full -translate-y-full bg-signal transition-transform duration-500 group-hover:translate-y-full" />
              </span>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ───────── Bandeau stack ───────── */}
      <section className="border-y border-line py-4 md:py-6">
        <VelocityMarquee
          items={stack}
          className="f-display text-[13vw] uppercase leading-[0.9] [--wdth:62] [--wght:780] md:text-[8.5vw]"
        />
      </section>

      {/* ───────── 01 Profil ───────── */}
      <section className="shell py-24 md:py-40">
        <SectionHead index="01" title="Profil" meta="Lyon — depuis 2024" />
        <div className="grid-12 mt-10 gap-y-14 md:mt-16">
          <div className="col-span-4 md:col-span-10 md:col-start-3">
            <ScrollStatement
              className="f-display text-[clamp(2rem,4.6vw,4.6rem)] leading-[1.06] [--wdth:96] [--wght:560]"
              text="Développeur web basé à Lyon, je construis des produits complets, du pixel à la base de données. React et Next.js côté client, Python, Django et NestJS côté serveur — avec une *obsession* *du* *détail* qui se voit dans le rendu final."
            />
          </div>

          <div className="col-span-4 grid gap-px bg-line md:col-span-10 md:col-start-3 md:grid-cols-3">
            {facts.map((f, i) => (
              <FadeIn key={f.k} delay={i * 0.08} className="bg-paper py-6 md:px-6 md:first:pl-0">
                <p className="f-label text-muted">{f.k}</p>
                <p className="mt-4 text-xl font-medium md:text-2xl">{f.v}</p>
                <p className="mt-1 text-[15px] text-muted">{f.d}</p>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="col-span-4 md:col-span-10 md:col-start-3">
            <Link href="/about" className="f-label u-link inline-flex items-center gap-2">
              Parcours complet <span className="text-signal">→</span>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ───────── 02 Travaux ───────── */}
      <section id="travaux" className="shell scroll-mt-24 pb-24 md:pb-40">
        <SectionHead index="02" title="Travaux récents" meta={`${latestProjects.length} projets au total`} />
        <div className="mt-10 md:mt-14">
          <ProjectIndex projects={latestProjects.slice(0, 6)} />
        </div>
        <FadeIn className="mt-12 flex justify-end">
          <Link href="/projects" className="group flex items-baseline gap-4">
            <span className="f-label text-muted">Index complet</span>
            <span
              className="f-display text-[clamp(2.4rem,6vw,6rem)] uppercase transition-colors group-hover:text-signal"
              style={{ "--wdth": 120 } as React.CSSProperties}
            >
              Tous les projets
              <sup className="f-label ml-1 align-top text-signal">({latestProjects.length})</sup>
            </span>
          </Link>
        </FadeIn>
      </section>
    </>
  );
}

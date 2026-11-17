import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Assemble from "@/components/scroll/Assemble";
import SectionIntro from "@/components/SectionIntro";
import { FadeIn } from "@/components/Reveal";
import { featuredProjects, otherProjects } from "@/data/portfolio/projects";

export const metadata: Metadata = {
  title: "Réalisations | Noam Guez",
  description:
    "Sites vitrines, réservation en ligne, applications web : une sélection de réalisations de Noam Guez, creative developer.",
};

export default function ProjectsPage() {
  return (
    <div className="pb-16 pt-28 md:pb-24 md:pt-36">
      {/* En-tête */}
      <header className="shell">
        <h1 className="f-display text-[clamp(2.75rem,6.6vw,6.25rem)] leading-[1.02] tracking-[-0.025em] [--wght:390]">
          {[
            <>Ce que j&apos;ai déjà</>,
            <>
              <em className="text-accent">construit.</em>
            </>,
          ].map((line, i) => (
            <span key={i} className="-my-[0.1em] block overflow-hidden py-[0.1em]">
              <span className="hero-rise block" style={{ animationDelay: `${0.06 + i * 0.09}s` }}>
                {line}
              </span>
              {i === 0 && " "}
            </span>
          ))}
        </h1>
        <p className="hero-up mt-8 max-w-[52ch] text-lg leading-relaxed text-muted md:text-[1.25rem]" style={{ animationDelay: "0.3s" }}>
          Une sélection de projets réalisés en agence, en formation et pour moi. Chaque fiche explique le besoin et ce
          qui a été fait.
        </p>
      </header>

      {/* Sélection : lignes alternées, l'image vient s'emboîter au scroll */}
      <ol className="shell mt-14 space-y-16 md:mt-20 md:space-y-24">
        {featuredProjects.map((p, i) => {
          const flip = i % 2 === 1;
          return (
            <li key={p.slug}>
              <Link href={`/projects/${p.slug}`} className="group grid items-center gap-8 md:grid-cols-12 md:gap-12">
                <Assemble
                  from={{ x: flip ? 160 : -160, rotate: flip ? 3 : -3, opacity: 0.2 }}
                  end="start 0.45"
                  className={`md:col-span-6 ${flip ? "md:order-2" : ""}`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-surface shadow-float">
                    {p.thumbnail && (
                      <Image
                        src={p.thumbnail}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 600px, 100vw"
                        className="object-cover object-top transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.05]"
                      />
                    )}
                    <span className="absolute right-4 top-4 grid h-12 w-12 scale-75 place-items-center rounded-full bg-paper text-ink opacity-0 transition-all duration-500 ease-[var(--ease-expo)] group-hover:scale-100 group-hover:opacity-100">
                      <ArrowUpRightIcon size={20} weight="bold" />
                    </span>
                  </div>
                </Assemble>
                <FadeIn className={`md:col-span-6 ${flip ? "md:order-1" : ""}`}>
                  <p className="f-label text-accent-ink">{p.categoryLabel}</p>
                  <h2 className="f-display mt-2 text-[clamp(2.2rem,4vw,3.5rem)] leading-[1.02] [--wght:420]">{p.title}</h2>
                  <p className="mt-4 max-w-[44ch] text-lg leading-relaxed text-muted">{p.description}</p>
                  <span className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-accent-ink">
                    Voir le projet
                    <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
                  </span>
                </FadeIn>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Autres travaux : liste compacte */}
      {otherProjects.length > 0 && (
        <section className="shell mt-24 md:mt-32">
          <SectionIntro
            title="Exercices et projets de formation"
            intro="Des projets plus techniques, réalisés pendant mes formations : programmes, outils de gestion, parties serveur."
          />
          <ul className="mt-8 border-t border-line">
            {otherProjects.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-line py-5 md:grid-cols-[1.2fr_1fr_auto]"
                >
                  <span className="f-display text-[1.5rem] transition-colors duration-300 [--wght:430] group-hover:text-accent-ink">
                    {p.title}
                  </span>
                  <span className="flex items-center gap-3 text-sm text-muted md:order-last">
                    {p.date.slice(0, 4)}
                    <ArrowRightIcon size={14} weight="bold" className="transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                  <span className="col-span-2 text-[0.9375rem] text-muted md:col-span-1">{p.categoryLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

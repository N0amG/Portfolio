import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import AboutPortrait from "@/components/about/AboutPortrait";
import Assemble from "@/components/scroll/Assemble";
import SectionIntro from "@/components/SectionIntro";
import { FadeIn } from "@/components/Reveal";
import { ctaClass } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "À propos | Noam Guez",
  description:
    "Noam Guez, développeur web freelance à Lyon : des sites simples et soignés pour les commerçants, une expérience en entreprise et en agence.",
};

const milestones = [
  {
    when: "Depuis 2026",
    title: "Développeur web chez Elissar",
    text: "Je participe à la modernisation d'un logiciel professionnel vendu à des entreprises.",
  },
  {
    when: "2025",
    title: "Agence web JVAIS",
    text: "Des applications web et mobiles construites en équipe pour des clients, dont des fonctionnalités d'intelligence artificielle.",
  },
  {
    when: "2024 à 2028",
    title: "Bac +3, Master en cours",
    text: "Diplômé développeur web (Bac +3), en Master à l'EPSI, orienté hébergement et mise en ligne.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-24 pt-32 md:pb-36 md:pt-40">
      {/* En-tête */}
      <section className="shell grid items-center gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
        <div>
          <h1 className="f-display text-[clamp(3rem,7.4vw,7rem)] leading-[1] tracking-[-0.03em] [--wght:390]">
            {[
              <>Un site</>,
              <>à votre</>,
              <em key="i" className="text-accent">
                image.
              </em>,
            ].map((line, i) => (
              <span key={i} className={`-my-[0.1em] block overflow-hidden py-[0.1em] ${i === 1 ? "pl-[12%]" : ""}`}>
                <span className="hero-rise block" style={{ animationDelay: `${0.06 + i * 0.09}s` }}>
                  {line}
                </span>
                {i < 2 && " "}
              </span>
            ))}
          </h1>
          <div className="hero-up mt-10 max-w-[48ch] space-y-5" style={{ animationDelay: "0.3s" }}>
            <p className="text-pretty text-[clamp(1.2rem,1.7vw,1.45rem)] leading-[1.45]">
              Je suis Noam, développeur web freelance à Lyon. Je crée des sites et des applications web de A à Z : ce que
              vous voyez à l&apos;écran comme ce qui tourne en coulisses.
            </p>
            <p className="leading-relaxed text-muted">
              Je travaille surtout pour des commerçants et des indépendants. Je m&apos;occupe de tout, de la maquette à
              l&apos;hébergement, et c&apos;est moi qui vous réponds du début à la fin.
            </p>
          </div>
        </div>
        <AboutPortrait />
      </section>

      {/* Repères */}
      <section className="shell mt-28 md:mt-40">
        <SectionIntro title="Mon parcours" />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {milestones.map((m, i) => (
            <li key={m.title}>
              <Assemble from={{ y: 120, rotate: i === 1 ? 0 : i === 0 ? -3 : 3, opacity: 0.1 }} end="start 0.55" className="h-full">
                <div className="flex h-full flex-col rounded-card bg-card p-7 shadow-card md:p-8">
                  <span className="f-display text-[1.375rem] italic text-accent [--wght:360]">{m.when}</span>
                  <h3 className="f-display mt-6 text-[clamp(1.6rem,2.3vw,2rem)] leading-[1.1] [--wght:460]">{m.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{m.text}</p>
                </div>
              </Assemble>
            </li>
          ))}
        </ol>
      </section>

      {/* Hors travail + appel */}
      <section className="shell mt-28 md:mt-40">
        <div className="grid items-end gap-10 border-t border-line pt-12 md:grid-cols-[1.4fr_1fr]">
          <FadeIn>
            <p className="f-label text-muted">En dehors du travail</p>
            <p className="f-display mt-4 max-w-[26ch] text-[clamp(1.6rem,2.8vw,2.4rem)] leading-[1.2] [--wght:400]">
              Culture japonaise, jeux vidéo, physique, et <em className="text-accent">beaucoup de curiosité.</em>
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="md:justify-self-end">
            <Link href="/projects" className={ctaClass}>
              Voir mes réalisations
              <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import AboutPortrait from "@/components/about/AboutPortrait";
import Assemble from "@/components/scroll/Assemble";
import SectionIntro from "@/components/SectionIntro";
import { FadeIn } from "@/components/Reveal";
import { ctaClass } from "@/lib/ui";

export const metadata: Metadata = {
  title: "À propos | Noam Guez",
  description:
    "Noam Guez, creative developer : bachelor et master en développement, plusieurs années d'expérience en entreprise.",
};

const milestones = [
  {
    when: "Formation",
    title: "Bachelor & Master",
    text: "En développement web, de l'interface jusqu'à l'hébergement.",
  },
  {
    when: "Expérience",
    title: "Plusieurs années en entreprise",
    text: "En agence et en entreprise, sur des applications web et mobiles livrées à de vrais clients.",
  },
  {
    when: "Méthode",
    title: "Du design au déploiement",
    text: "Maquette, développement, mise en ligne : je m'occupe de tout, avec un seul interlocuteur.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-16 pt-28 md:pb-24 md:pt-36">
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
              Je suis Noam, creative developer. Je conçois et développe des sites et des applications web de A à Z.
            </p>
            <p className="leading-relaxed text-muted">
              J&apos;analyse votre besoin, je comprends votre activité, et je construis ce qui vous correspond.
            </p>
          </div>
        </div>
        <AboutPortrait />
      </section>

      {/* Repères */}
      <section className="shell mt-20 md:mt-28">
        <SectionIntro title="En bref" />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
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
      <section className="shell mt-20 md:mt-28">
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

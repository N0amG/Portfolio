import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, ArrowUpRightIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import HeroTitle from "@/components/home/HeroTitle";
import ProcessTimeline, { type Step } from "@/components/home/ProcessTimeline";
import AboutPortrait from "@/components/about/AboutPortrait";
import Assemble from "@/components/scroll/Assemble";
import CollageAssemble from "@/components/scroll/CollageAssemble";
import SectionIntro from "@/components/SectionIntro";
import EmailActions from "@/components/EmailActions";
import { FadeIn } from "@/components/Reveal";
import JsonLd, { faqPage } from "@/components/JsonLd";
import { ctaLargeClass } from "@/lib/ui";
import { featuredProjects, otherProjects, type Project } from "@/data/portfolio/projects";
import { site } from "@/lib/site";
import { defaultDescription, defaultTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: defaultTitle },
  description: defaultDescription,
  alternates: { canonical: "/" },
};

const offers = [
  { title: "Analyse du besoin", text: "Votre activité, vos clients, vos contraintes." },
  { title: "Compréhension du projet", text: "Site vitrine, réservation en ligne ou outil sur mesure : la bonne solution." },
  { title: "Conception créative", text: "Un site rapide, clair, bien référencé, prêt à évoluer." },
];

const steps: Step[] = [
  { title: "Brief", text: "Votre projet, vos objectifs." },
  { title: "Proposition", text: "Une solution et un devis clair." },
  { title: "Accompagnement personnalisé", text: "Vous suivez et validez chaque étape." },
  { title: "Livrable", text: "Mise en ligne, accès transmis, suivi sur le long terme." },
];

const faq = [
  { q: "Combien coûte un site ?", a: "Selon le projet : un site vitrine coûte moins qu'une application. Devis détaillé, sans engagement." },
  { q: "En combien de temps ?", a: "Environ 14 jours pour un site vitrine, 1 mois pour une application web." },
  { q: "Pourrai-je le modifier ?", a: "Oui, avec un espace simple pour vos textes, horaires et photos." },
  { q: "Hébergement et nom de domaine ?", a: "La mise en ligne est prise en charge et tous les accès vous sont transmis." },
];

const facts = [
  { title: "Bachelor et master", text: "En développement web, de l'interface à l'hébergement." },
  { title: "Expérience en entreprise", text: "Applications web et mobiles conçues et mises en production pour des clients." },
  { title: "Un seul interlocuteur", text: "Maquette, développement, mise en ligne." },
];

/** Chaque tuile arrive d'un côté différent avant de s'emboîter dans la grille. */
const tileFrom = [
  { x: -120, y: 60, rotate: -4, opacity: 0.2 },
  { x: 0, y: 120, rotate: 2, opacity: 0.2 },
  { x: 120, y: 60, rotate: 4, opacity: 0.2 },
];

function Tile({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-surface shadow-card">
        {project.thumbnail && (
          <Image
            src={project.thumbnail}
            alt={`${project.title}, ${project.categoryLabel.toLowerCase()}`}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.05]"
          />
        )}
        <span className="absolute right-3 top-3 grid h-10 w-10 scale-75 place-items-center rounded-full bg-paper text-ink opacity-0 transition-all duration-500 ease-[var(--ease-expo)] group-hover:scale-100 group-hover:opacity-100">
          <ArrowUpRightIcon size={18} weight="bold" />
        </span>
      </div>
      <h3 className="f-display mt-4 text-[1.4rem] [--wght:450]">{project.title}</h3>
      <p className="mt-1 text-[0.9375rem] text-muted">{project.categoryLabel}</p>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={faqPage(faq)} />

      {/* ───────── Hero ───────── */}
      <section className="shell pb-14 pt-28 md:pb-20 md:pt-36">
        <h1 className="hero-up f-label text-muted" style={{ animationDelay: "0.05s" }}>
          {site.name} · Développeur web freelance à Lyon · {site.role}
        </h1>
        <div className="mt-8">
          <HeroTitle />
        </div>
        <div className="mt-10 border-t border-line pt-8 md:mt-12">
          <div className="hero-up flex flex-col gap-8 md:flex-row md:items-end md:justify-between" style={{ animationDelay: "0.35s" }}>
            <p className="max-w-[36ch] text-lg leading-relaxed md:text-[1.25rem]">
              Sites et applications web sur mesure, de la maquette à la mise en ligne.
            </p>
            <Link href="#contact" className={`${ctaLargeClass} w-full justify-center sm:w-auto`}>
              Demander un devis
              <ArrowRightIcon size={20} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Services ───────── */}
      <section id="services" className="shell scroll-mt-20 py-16 md:py-24">
        <SectionIntro title="Mon expertise" />
        <ol className="mt-8 border-b border-line">
          {offers.map((o, i) => (
            <li key={o.title}>
              <Assemble from={{ x: i % 2 === 0 ? -160 : 160, opacity: 0.15 }} end="start 0.55">
                <div className="group relative overflow-hidden border-t border-line">
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-bottom scale-y-0 bg-accent-ink transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-y-100"
                  />
                  <div className="relative grid gap-2 px-1 py-6 transition-colors duration-500 group-hover:text-on-accent md:grid-cols-[1fr_1.15fr] md:items-baseline md:gap-10 md:px-6 md:py-7">
                    <h3 className="f-display text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.02] [--wght:420]">{o.title}</h3>
                    <p className="text-lg leading-relaxed">{o.text}</p>
                  </div>
                </div>
              </Assemble>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── Méthode ───────── */}
      <section id="methode" className="shell scroll-mt-20 pb-16 md:pb-24">
        <SectionIntro title="Notre collaboration" />
        <ProcessTimeline steps={steps} />
      </section>

      {/* ───────── Réalisations : captures qui s'assemblent, puis la grille ───────── */}
      <div id="realisations" className="scroll-mt-20">
        <CollageAssemble title="Des projets menés de A à Z." caption="Touchez une capture pour voir le projet." />
      </div>
      <section className="shell pb-16 md:pb-24" aria-labelledby="realisations-titre">
        <h2 id="realisations-titre" className="sr-only">
          Réalisations
        </h2>
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((p, i) => (
            <Assemble key={p.slug} from={tileFrom[i % 3]} end="start 0.6">
              <Tile project={p} />
            </Assemble>
          ))}
        </div>
        {otherProjects.length > 0 && (
          <FadeIn className="mt-12 border-t border-line pt-6">
            <p className="f-label text-muted">Projets de formation</p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {otherProjects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="u-link inline-flex min-h-11 items-center">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </FadeIn>
        )}
      </section>

      {/* ───────── À propos ───────── */}
      <section id="a-propos" className="scroll-mt-20 bg-alt py-16 md:py-24">
        <div className="shell grid items-center gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
          <div>
            <SectionIntro title="À propos" />
            <FadeIn delay={0.1}>
              <p className="mt-5 max-w-[42ch] text-[clamp(1.15rem,1.6vw,1.35rem)] leading-relaxed">
                Noam, creative developer à Lyon. Conception et développement de sites et d'applications web, de A à Z.
              </p>
            </FadeIn>
            <ul className="mt-8 border-t border-line">
              {facts.map((f, i) => (
                <li key={f.title} className="border-b border-line">
                  <Assemble from={{ x: -80, opacity: 0.1 }} end="start 0.7" className="py-4">
                    <p className="f-display text-[1.3rem] [--wght:470]">
                      <span className="mr-3 italic text-accent">0{i + 1}</span>
                      {f.title}
                    </p>
                    <p className="mt-1 text-muted">{f.text}</p>
                  </Assemble>
                </li>
              ))}
            </ul>
          </div>
          <AboutPortrait />
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="shell scroll-mt-20 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <SectionIntro title="Questions fréquentes" />
          <FadeIn>
            <div className="border-t border-line">
              {faq.map((f) => (
                <details key={f.q} className="group border-b border-line [&_summary::-webkit-details-marker]:hidden">
                  <summary className="f-display flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.3rem] [--wght:450]">
                    {f.q}
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line transition-[transform,background-color,color] duration-500 ease-[var(--ease-expo)] group-open:rotate-45 group-open:bg-accent-ink group-open:text-on-accent">
                      <PlusIcon size={16} weight="bold" />
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-6 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="shell scroll-mt-20 pb-16 md:pb-24">
        <div className="rounded-[28px] bg-alt px-6 py-10 md:px-12 md:py-14">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <h2 className="f-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[1] tracking-[-0.03em] [--wght:400]">
                Écrivez-<em className="text-accent">moi.</em>
              </h2>
              <p className="mt-4 max-w-[38ch] text-lg text-muted">Quelques lignes suffisent. Devis sans engagement.</p>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {site.socials.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="u-link inline-flex min-h-11 items-center gap-1 font-medium">
                      {s.label} <ArrowUpRightIcon size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <EmailActions align="end" />
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, ArrowUpRightIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import HeroTitle from "@/components/home/HeroTitle";
import ScrollStatement from "@/components/home/ScrollStatement";
import ProcessTimeline, { type Step } from "@/components/home/ProcessTimeline";
import Assemble from "@/components/scroll/Assemble";
import RevealBand from "@/components/scroll/RevealBand";
import CollageAssemble from "@/components/scroll/CollageAssemble";
import SectionIntro from "@/components/SectionIntro";
import { FadeIn } from "@/components/Reveal";
import { ctaLargeClass } from "@/lib/ui";
import { getProjectBySlug, type Project } from "@/data/portfolio/projects";
import { site } from "@/lib/site";
import { defaultDescription, defaultTitle } from "@/lib/seo";
import JsonLd, { faqPage } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: { absolute: defaultTitle },
  description: defaultDescription,
  alternates: { canonical: "/" },
};

const offers = [
  {
    title: "J'analyse",
    text: "Votre activité, vos clients, vos contraintes : je pars de votre besoin réel, pas d'un modèle tout fait.",
  },
  {
    title: "Je comprends",
    text: "Je traduis ce besoin en solution concrète : site, application web, outil sur mesure.",
  },
  {
    title: "Je crée",
    text: "Je conçois et développe une solution adaptée, rapide, claire et prête à évoluer avec vous.",
  },
];

const steps: Step[] = [
  { title: "On échange", text: "Votre activité, vos clients et vos objectifs." },
  { title: "Je propose", text: "Une solution concrète et un devis clair." },
  { title: "Je construis", text: "Vous suivez l'avancement en ligne et validez chaque étape." },
  { title: "Je livre", text: "Mise en ligne, accès transmis, et je reste disponible après." },
];

const faq = [
  {
    q: "Combien coûte un site ?",
    a: "Le prix dépend du projet : un site vitrine ne coûte pas le prix d'une application complète. Vous recevez un devis détaillé et sans engagement.",
  },
  {
    q: "En combien de temps est-il prêt ?",
    a: "Environ 10 jours pour un site vitrine, 1 mois pour une application web. Le délai exact figure dans le devis.",
  },
  {
    q: "Pourrai-je modifier mon site moi-même ?",
    a: "Oui : je peux prévoir un espace simple pour changer vos textes, horaires ou photos.",
  },
  {
    q: "Et l'hébergement, le nom de domaine ?",
    a: "Je m'occupe de la mise en ligne et je vous transmets tous les accès.",
  },
];

const featured = ["sophie-bluel", "nina-carducci", "booki"]
  .map((slug) => getProjectBySlug(slug))
  .filter((p): p is Project => Boolean(p));

/** D'où arrive chaque tuile de réalisation avant de s'emboîter dans la grille. */
const tileFrom = [
  { x: -120, y: 80, rotate: -5, opacity: 0.2 },
  { x: 140, y: 60, rotate: 6, opacity: 0.2 },
  { x: 90, y: 160, rotate: -4, opacity: 0.2 },
];

function Tile({ project, big }: { project: Project; big?: boolean }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <div className={`relative overflow-hidden rounded-card bg-surface shadow-card ${big ? "aspect-[4/3]" : "aspect-[16/10]"}`}>
        {project.thumbnail && (
          <Image
            src={project.thumbnail}
            alt=""
            fill
            sizes={big ? "(min-width: 768px) 700px, 100vw" : "(min-width: 768px) 480px, 100vw"}
            className="object-cover object-top transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.05]"
          />
        )}
        <span className="absolute right-4 top-4 grid h-12 w-12 scale-75 place-items-center rounded-full bg-paper text-ink opacity-0 transition-all duration-500 ease-[var(--ease-expo)] group-hover:scale-100 group-hover:opacity-100">
          <ArrowUpRightIcon size={20} weight="bold" />
        </span>
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h3 className={`f-display [--wght:450] ${big ? "text-[clamp(1.8rem,2.6vw,2.4rem)]" : "text-[1.6rem]"}`}>{project.title}</h3>
        <span className="f-label shrink-0 text-accent-ink">{project.categoryLabel}</span>
      </div>
      <p className="mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted">{project.description}</p>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={faqPage(faq)} />
      {/* ───────── Hero : une promesse, un seul appel à l'action ───────── */}
      <section className="shell pb-14 pt-28 md:pb-20 md:pt-36">
        <h1 className="hero-up f-label text-muted" style={{ animationDelay: "0.05s" }}>
          {site.name} · Développeur web freelance à Lyon · {site.role}
        </h1>
        <div className="mt-8">
          <HeroTitle />
        </div>

        <div className="mt-10 border-t border-line pt-8 md:mt-12">
          <div className="hero-up flex flex-col gap-8 md:flex-row md:items-end md:justify-between" style={{ animationDelay: "0.35s" }}>
            <p className="max-w-[40ch] text-lg leading-relaxed md:text-[1.25rem]">
              Je conçois et développe votre site, de la maquette à la mise en ligne. Un seul interlocuteur : moi.
            </p>
            <Link href="/contact" className={`${ctaLargeClass} w-full justify-center sm:w-auto`}>
              Demander un devis
              <ArrowRightIcon size={20} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Ce que je peux faire pour vous ───────── */}
      <section className="shell py-16 md:py-24">
        <SectionIntro title="Ce que je peux faire pour vous" />
        <ol className="mt-8 border-b border-line">
          {offers.map((o, i) => (
            <li key={o.title}>
              <Assemble from={{ x: i % 2 === 0 ? -160 : 160, opacity: 0.15 }} end="start 0.55">
                <div className="group relative overflow-hidden border-t border-line">
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-bottom scale-y-0 bg-accent-ink transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-y-100"
                  />
                  <div className="relative grid gap-3 px-1 py-7 transition-colors duration-500 group-hover:text-on-accent md:grid-cols-[1fr_1.15fr] md:items-baseline md:gap-10 md:px-6 md:py-8">
                    <h3 className="f-display text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.02] [--wght:420]">{o.title}</h3>
                    <p className="text-lg leading-relaxed">{o.text}</p>
                  </div>
                </div>
              </Assemble>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── Phrase choc : bande qui s'ouvre ───────── */}
      <RevealBand className="bg-band py-20 text-on-band md:py-28">
        <div className="shell">
          <ScrollStatement
            className="f-display text-[clamp(2rem,4.6vw,4.4rem)] leading-[1.08] [--wght:380]"
            text="Vos clients vous cherchent d'abord sur leur téléphone. Faites qu'ils *vous* *y* *trouvent.*"
          />
        </div>
      </RevealBand>

      {/* ───────── Comment on travaille ensemble (avant les réalisations) ───────── */}
      <section className="shell py-16 md:py-24">
        <SectionIntro title="Comment on travaille ensemble" />
        <ProcessTimeline steps={steps} />
      </section>

      {/* ───────── Morceaux de sites qui s'assemblent (section épinglée, captures cliquables) ───────── */}
      <CollageAssemble title="Des sites que j'ai construits." caption="Touchez une capture pour voir le projet." />

      {/* ───────── Réalisations : tuiles qui s'emboîtent ───────── */}
      <section id="realisations" className="shell scroll-mt-24 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionIntro title="Quelques réalisations" />
          <Link href="/projects" className="group inline-flex min-h-11 items-center gap-2 font-semibold text-accent-ink">
            Toutes les réalisations
            <ArrowRightIcon size={16} weight="bold" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {featured.length === 3 && (
          <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-x-10">
            <Assemble from={tileFrom[0]} className="md:col-span-7">
              <Tile project={featured[0]} big />
            </Assemble>
            <div className="grid gap-10 md:col-span-5">
              <Assemble from={tileFrom[1]}>
                <Tile project={featured[1]} />
              </Assemble>
              <Assemble from={tileFrom[2]}>
                <Tile project={featured[2]} />
              </Assemble>
            </div>
          </div>
        )}
      </section>

      {/* ───────── Questions fréquentes ───────── */}
      <section className="mb-16 bg-alt py-16 md:mb-24 md:py-24">
        <div className="shell grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
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
    </>
  );
}

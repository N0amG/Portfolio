import Link from "next/link";
import Image from "next/image";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpRightIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import HeroTitle from "@/components/home/HeroTitle";
import VelocityMarquee from "@/components/home/VelocityMarquee";
import ScrollStatement from "@/components/home/ScrollStatement";
import Assemble from "@/components/scroll/Assemble";
import RevealBand from "@/components/scroll/RevealBand";
import CollageAssemble from "@/components/scroll/CollageAssemble";
import SectionIntro from "@/components/SectionIntro";
import { DrawRule, FadeIn } from "@/components/Reveal";
import { ctaClass } from "@/components/Navbar";
import { getProjectBySlug, type Project } from "@/data/portfolio/projects";

const trades = ["Restaurants", "Boutiques", "Artisans", "Salons", "Cafés", "Épiceries fines", "Fleuristes", "Boulangeries"];

const offers = [
  {
    title: "Site vitrine",
    text: "Votre commerce présenté comme il le mérite : horaires, carte ou catalogue, photos, plan d'accès, et un bouton pour vous appeler.",
    for: "Restaurants, boutiques, artisans",
  },
  {
    title: "Réservation en ligne",
    text: "Vos clients réservent ou prennent rendez-vous à toute heure, reçoivent une confirmation, et vous suivez tout simplement.",
    for: "Salons, restaurants, location",
  },
  {
    title: "Coup de neuf",
    text: "Votre site actuel, repris : plus rapide sur mobile, plus clair à lire, et mieux placé sur Google.",
    for: "Tous ceux qui ont déjà un site",
  },
];

const steps = [
  { title: "On en parle", text: "On définit ensemble votre besoin, ce qui est inclus et le délai. Vous recevez un devis clair." },
  {
    title: "Je le construis",
    text: "Vous suivez l'avancement sur une version en ligne, mise à jour au fil du projet, et vous donnez votre avis.",
  },
  { title: "Mise en ligne", text: "Votre site est publié, je vous transmets tous les accès, et je reste joignable après." },
];

const faq = [
  {
    q: "Combien coûte un site ?",
    a: "Chaque commerce a des besoins différents. Après un premier échange, je vous envoie un devis détaillé, sans engagement.",
  },
  {
    q: "En combien de temps est-il prêt ?",
    a: "Le délai dépend du projet et des contenus à préparer (textes, photos). Il est fixé ensemble dans le devis, avant de commencer.",
  },
  {
    q: "Pourrai-je modifier mon site moi-même ?",
    a: "Oui, si vous le souhaitez : je peux prévoir un espace simple pour changer vos horaires, textes ou photos, et je vous montre comment faire.",
  },
  {
    q: "Et l'hébergement, le nom de domaine ?",
    a: "Je m'occupe de la mise en ligne et je vous transmets tous les accès. Je vous explique les options d'hébergement et de nom de domaine.",
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
      {/* ───────── Hero ───────── */}
      <section className="shell pb-16 pt-32 md:pb-24 md:pt-40">
        <p className="hero-up f-label text-muted" style={{ animationDelay: "0.05s" }}>
          Noam Guez, développeur web freelance à Lyon
        </p>
        <div className="mt-8">
          <HeroTitle />
        </div>

        <div className="mt-12 border-t border-line pt-10 md:mt-16">
          <div className="hero-up" style={{ animationDelay: "0.35s" }}>
            <p className="max-w-[44ch] text-lg leading-relaxed md:text-[1.25rem]">
              Je construis le site de votre commerce, de la première maquette à la mise en ligne. Vous n&apos;avez qu&apos;un
              seul interlocuteur : moi.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/contact" className={ctaClass}>
                Demander un devis
                <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
              </Link>
              <Link
                href="#realisations"
                className="group inline-flex min-h-11 items-center gap-2 font-semibold text-accent-ink"
              >
                Voir des réalisations
                <ArrowDownIcon size={16} weight="bold" className="transition-transform duration-500 group-hover:translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Métiers (banderole) ───────── */}
      <section className="border-y border-line py-5 md:py-7" aria-label="Pour qui">
        <VelocityMarquee
          items={trades}
          className="f-display text-[clamp(2.4rem,6vw,5.5rem)] italic leading-[1.15] [--wght:340]"
        />
      </section>

      {/* ───────── Offres : lignes qui s'assemblent ───────── */}
      <section className="shell py-24 md:py-36">
        <SectionIntro title="Ce que je peux faire pour vous" />
        <ol className="mt-14 border-b border-line">
          {offers.map((o, i) => (
            <li key={o.title}>
              <Assemble from={{ x: i % 2 === 0 ? -160 : 160, opacity: 0.15 }} end="start 0.55">
                <div className="group relative overflow-hidden border-t border-line">
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-bottom scale-y-0 bg-accent-ink transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-y-100"
                  />
                  <div className="relative grid gap-4 px-1 py-10 transition-colors duration-500 group-hover:text-on-accent md:grid-cols-[1fr_1.15fr] md:items-baseline md:gap-10 md:px-6 md:py-12">
                    <h3 className="f-display text-[clamp(2.1rem,3.8vw,3.4rem)] leading-[1.02] [--wght:420]">{o.title}</h3>
                    <div>
                      <p className="text-lg leading-relaxed">{o.text}</p>
                      <p className="mt-3 text-[0.9375rem] text-muted transition-colors duration-500 group-hover:text-on-accent">
                        Idéal pour : {o.for}
                      </p>
                    </div>
                  </div>
                </div>
              </Assemble>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── Phrase choc : bande terracotta qui s'ouvre ───────── */}
      <RevealBand className="bg-band py-28 text-on-band md:py-40">
        <div className="shell">
          <ScrollStatement
            className="f-display text-[clamp(2.1rem,4.6vw,4.4rem)] leading-[1.08] [--wght:380]"
            text="Avant de pousser votre porte, vos clients vous cherchent sur leur téléphone. Autant qu'ils y trouvent *ce* *qu'ils* *cherchent.*"
          />
        </div>
      </RevealBand>

      {/* ───────── Morceaux de sites qui s'assemblent (section épinglée) ───────── */}
      <CollageAssemble
        title="Des sites que j'ai construits."
        caption="Captures de projets réalisés en agence, en formation et pour moi."
      />

      {/* ───────── Réalisations : tuiles qui s'emboîtent ───────── */}
      <section id="realisations" className="shell scroll-mt-24 py-24 md:py-36">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionIntro title="Quelques réalisations" />
          <Link href="/projects" className="group inline-flex min-h-11 items-center gap-2 font-semibold text-accent-ink">
            Toutes les réalisations
            <ArrowRightIcon size={16} weight="bold" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {featured.length === 3 && (
          <div className="mt-14 grid gap-12 md:grid-cols-12 md:gap-x-10">
            <Assemble from={tileFrom[0]} className="md:col-span-7">
              <Tile project={featured[0]} big />
            </Assemble>
            <div className="grid gap-12 md:col-span-5">
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

      {/* ───────── Étapes ───────── */}
      <section className="bg-alt py-24 md:py-36">
        <div className="shell">
          <SectionIntro title="Comment on travaille ensemble" />
          <DrawRule className="mt-14" />
          <ol className="grid md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className={`pt-10 md:pr-10 ${i > 0 ? "md:border-l md:border-line md:pl-10" : ""}`}>
                <Assemble from={{ y: 90, opacity: 0 }} end="start 0.6">
                  <span className="f-display block text-[clamp(4.5rem,8vw,7rem)] italic leading-[0.8] text-accent [--wght:300]">
                    {i + 1}
                  </span>
                  <h3 className="f-display mt-6 text-[1.75rem] [--wght:480]">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{s.text}</p>
                </Assemble>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="shell py-24 md:py-36">
        <div className="grid gap-12 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <SectionIntro title="Questions fréquentes" />
          <FadeIn>
            <div className="border-t border-line">
              {faq.map((f) => (
                <details key={f.q} className="group border-b border-line [&_summary::-webkit-details-marker]:hidden">
                  <summary className="f-display flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-6 text-[1.375rem] [--wght:450]">
                    {f.q}
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line transition-[transform,background-color,color] duration-500 ease-[var(--ease-expo)] group-open:rotate-45 group-open:bg-accent-ink group-open:text-on-accent">
                      <PlusIcon size={16} weight="bold" />
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-7 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

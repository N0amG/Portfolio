"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, ArrowsOutSimpleIcon } from "@phosphor-icons/react";

// Chargée seulement quand on ouvre une capture.
const Lightbox = dynamic(() => import("@/components/Lightbox"), { ssr: false });
import { FadeIn } from "@/components/Reveal";
import Assemble from "@/components/scroll/Assemble";
import SectionIntro from "@/components/SectionIntro";
import { ctaClass } from "@/components/Navbar";
import { Project } from "@/data/portfolio/projects";

interface Props {
  project: Project;
  prev: Project;
  next: Project;
}

/** Couverture arrondie, dévoilée par le haut, avec un parallaxe interne au scroll. */
function Cover({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className="cover-reveal group relative block aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-surface md:aspect-[21/10]"
      aria-label="Agrandir la capture principale"
    >
      {project.thumbnail && (
        <motion.div className="absolute inset-0" style={{ y, scale: 1.22 }}>
          <Image src={project.thumbnail} alt={project.title} fill preload sizes="100vw" className="object-cover object-top" />
        </motion.div>
      )}
      <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowsOutSimpleIcon size={14} /> Agrandir
      </span>
    </button>
  );
}

function Gallery({ project, onOpen }: { project: Project; onOpen: (i: number) => void }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    if (!embla) return;
    setProgress(Math.max(0, Math.min(1, embla.scrollProgress())));
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    const id = requestAnimationFrame(update);
    embla.on("scroll", update).on("reInit", update).on("select", update);
    return () => {
      cancelAnimationFrame(id);
      embla.off("scroll", update).off("reInit", update).off("select", update);
    };
  }, [embla, update]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex touch-pan-y">
          {project.screenshots.map((src, i) => (
            <div key={src} className="min-w-0 flex-[0_0_86%] pl-4 sm:flex-[0_0_62%] lg:flex-[0_0_46%]">
              <button
                type="button"
                onClick={() => onOpen(i)}
                className="group relative block aspect-[16/10] w-full overflow-hidden rounded-card bg-surface"
                aria-label={`Agrandir la capture ${i + 1}`}
              >
                <Image
                  src={src}
                  alt={`${project.title} — capture ${i + 1}`}
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 46vw, (min-width: 640px) 62vw, 86vw"
                  className="object-cover object-top transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-[1.04]"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center gap-6">
        <div className="relative h-px flex-1 bg-line">
          <span className="absolute inset-y-0 left-0 bg-accent-ink" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Précédent"
            className="grid h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-ink hover:bg-card disabled:opacity-30"
          >
            <ArrowLeftIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            aria-label="Suivant"
            className="grid h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-ink hover:bg-card disabled:opacity-30"
          >
            <ArrowRightIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailClient({ project, prev, next }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [lbReady, setLbReady] = useState(false);
  const openLightbox = (i: number) => {
    setLbReady(true);
    setLightbox(i);
  };
  const overview = project.overview ?? [];
  const note = overview.find((p) => /^\(.*\)$/.test(p.trim()));
  const paragraphs = overview.filter((p) => p !== note);
  const noteLabel = note ? (/fictif/i.test(note) ? "Projet de formation, scénario fictif" : note.replace(/[()]/g, "").trim()) : undefined;

  const facts = [
    { k: "Type", v: project.categoryLabel },
    { k: "Année", v: project.date.slice(0, 4) },
    { k: "Rôle", v: project.role ?? "Développeur web" },
  ];

  return (
    <article className="pb-16 pt-28 md:pb-24 md:pt-36">
      {/* En-tête */}
      <header className="shell">
        <Link
          href="/projects"
          className="hero-up group inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-muted hover:text-ink"
          style={{ animationDelay: "0.02s" }}
        >
          <ArrowLeftIcon size={14} className="transition-transform group-hover:-translate-x-1" /> Toutes les réalisations
        </Link>

        <div className="mt-8 grid items-end gap-10 md:grid-cols-12">
          <h1 className="f-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.98] tracking-[-0.03em] [--wght:390] md:col-span-8">
            <span className="-my-[0.1em] block overflow-hidden py-[0.1em]">
              <span className="hero-rise block" style={{ animationDelay: "0.08s" }}>
                {project.title}
              </span>
            </span>
          </h1>
          <p className="hero-up text-lg leading-relaxed text-muted md:col-span-4 md:pb-3" style={{ animationDelay: "0.25s" }}>
            {project.description}
          </p>
        </div>

        <div
          className="hero-up mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-6"
          style={{ animationDelay: "0.35s" }}
        >
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {facts.map((f) => (
              <div key={f.k}>
                <dt className="f-label text-muted">{f.k}</dt>
                <dd className="mt-1 font-medium">{f.v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3">
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={ctaClass}>
                Voir le site
                <ArrowUpRightIcon size={16} weight="bold" className="transition-transform group-hover:rotate-45" />
              </a>
            )}
            {project.codeUrl && (
              <a
                href={project.codeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-12 items-center gap-2 rounded-full border border-ink px-6 font-semibold transition-colors hover:bg-ink hover:text-paper"
              >
                Code source
                <ArrowUpRightIcon size={16} weight="bold" className="transition-transform group-hover:rotate-45" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Couverture */}
      <div className="shell mt-10">
        <Cover project={project} onOpen={() => openLightbox(0)} />
      </div>

      {/* Le projet */}
      {paragraphs.length > 0 && (
        <section className="shell mt-16 md:mt-24">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <SectionIntro title="Le besoin" />
              {noteLabel && <p className="mt-5 inline-flex rounded-full bg-alt px-4 py-2 text-sm text-muted">{noteLabel}</p>}
            </div>
            <div className="space-y-5 md:col-span-7 md:col-start-6">
              <FadeIn>
                <p className="text-pretty text-[clamp(1.3rem,2vw,1.65rem)] leading-[1.4]">{paragraphs[0]}</p>
              </FadeIn>
              {paragraphs.slice(1).map((p, i) => (
                <FadeIn key={i} delay={0.05 + i * 0.05}>
                  <p className="leading-relaxed text-muted">{p}</p>
                </FadeIn>
              ))}
              <FadeIn className="flex flex-wrap gap-2 pt-3">
                {project.tags.map((t) => (
                  <span key={t} className="rounded-full border border-line px-3.5 py-1.5 text-sm">
                    {t}
                  </span>
                ))}
              </FadeIn>
            </div>
          </div>
        </section>
      )}

      {/* Ce qui a été fait */}
      {project.challenges && project.challenges.length > 0 && (
        <section className="shell mt-16 md:mt-24">
          <SectionIntro title="Ce qui a été fait" />
          <ol className="mt-8 border-b border-line">
            {project.challenges.map((c, i) => (
              <li key={c.title}>
                <Assemble from={{ x: i % 2 === 0 ? -120 : 120, opacity: 0.15 }} end="start 0.6">
                  <div className="grid gap-3 border-t border-line py-8 md:grid-cols-[1fr_1.3fr] md:items-baseline md:gap-10">
                    <h3 className="f-display text-[clamp(1.6rem,2.6vw,2.1rem)] leading-[1.1] [--wght:450]">{c.title}</h3>
                    <p className="leading-relaxed text-muted">{c.description}</p>
                  </div>
                </Assemble>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Captures d'écran */}
      {project.screenshots.length > 1 && (
        <section className="shell mt-16 md:mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionIntro title="Captures d'écran" />
            <p className="text-sm text-muted">Glissez pour parcourir, cliquez pour agrandir.</p>
          </div>
          <div className="mt-10">
            <Gallery project={project} onOpen={openLightbox} />
          </div>
        </section>
      )}

      {/* Projet suivant */}
      <nav className="shell mt-20 md:mt-28" aria-label="Autres projets">
        <Link
          href={`/projects/${next.slug}`}
          className="group grid items-center gap-8 overflow-hidden rounded-[28px] bg-alt p-6 md:grid-cols-[1.2fr_1fr] md:p-12"
        >
          <div>
            <p className="f-label text-accent-ink">Projet suivant</p>
            <p className="f-display mt-3 text-[clamp(2.4rem,5.6vw,5rem)] leading-[1] transition-colors duration-500 [--wght:400] group-hover:text-accent-ink">
              {next.title}
            </p>
            <p className="mt-4 max-w-[40ch] text-muted">{next.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-accent-ink">
              Voir le projet
              <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
            </span>
          </div>
          {next.thumbnail && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface shadow-float">
              <Image
                src={next.thumbnail}
                alt=""
                fill
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-cover object-top transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.06]"
              />
            </div>
          )}
        </Link>
        <Link href={`/projects/${prev.slug}`} className="group mt-4 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-muted hover:text-ink">
          <ArrowLeftIcon size={14} className="transition-transform group-hover:-translate-x-1" />
          Précédent : {prev.title}
        </Link>
      </nav>

      {lbReady && (
        <Lightbox images={project.screenshots} index={lightbox} alt={project.title} onClose={() => setLightbox(null)} />
      )}
    </article>
  );
}

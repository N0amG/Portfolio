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
import { FadeIn, MaskLines, SectionHead } from "@/components/Reveal";
import { Project, projects, getProjectNumber, formatProjectDate } from "@/data/portfolio/projects";
import { pad } from "@/lib/site";

interface Props {
  project: Project;
  prev: Project;
  next: Project;
}

function Cover({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className="cover-reveal group relative block aspect-[4/3] w-full overflow-hidden bg-surface md:aspect-[21/9]"
      aria-label="Agrandir la capture principale"
    >
      {project.thumbnail && (
        <motion.div className="absolute inset-0" style={{ y, scale: 1.25 }}>
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            preload
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>
      )}
      <span className="f-label absolute bottom-0 right-0 flex items-center gap-2 bg-paper px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowsOutSimpleIcon size={12} /> Agrandir
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
                className="group relative block aspect-[16/10] w-full overflow-hidden bg-surface"
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
          <span className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Précédent"
            className="grid h-11 w-11 place-items-center border border-line transition-colors hover:border-ink disabled:opacity-30"
          >
            <ArrowLeftIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            aria-label="Suivant"
            className="grid h-11 w-11 place-items-center border border-line transition-colors hover:border-ink disabled:opacity-30"
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
  const n = pad(getProjectNumber(project.slug));
  const overview = project.overview ?? [];
  const note = overview.find((p) => /^\(.*\)$/.test(p.trim()));
  const paragraphs = overview.filter((p) => p !== note);
  const noteLabel = note
    ? /fictif/i.test(note)
      ? "Projet de formation — scénario fictif"
      : note.replace(/[()]/g, "").trim()
    : undefined;

  const spec: { k: string; v: React.ReactNode }[] = [
    { k: "Rôle", v: project.role ?? "—" },
    { k: "Date", v: formatProjectDate(project.date) },
    { k: "Type", v: project.categoryLabel },
    { k: "Catégories", v: project.categories.join(", ") },
  ];

  return (
    <article className="pb-24 pt-28 md:pb-36 md:pt-36">
      {/* En-tête */}
      <header className="shell">
        <FadeIn y={0} className="f-label flex items-center justify-between text-muted">
          <Link href="/projects" className="group flex items-center gap-2 hover:text-ink">
            <ArrowLeftIcon size={12} className="transition-transform group-hover:-translate-x-1" /> Tous les projets
          </Link>
          <span>
            <span className="text-signal">{n}</span> / {pad(projects.length)}
          </span>
        </FadeIn>

        <div className="grid-12 mt-10 items-end gap-y-8 md:mt-14">
          <MaskLines
            as="h1"
            className="f-display text-balance col-span-4 text-[clamp(3rem,10.5vw,12rem)] uppercase [--wdth:104] [--wght:860] md:col-span-12"
            lines={[project.title]}
          />
          <FadeIn delay={0.35} className="col-span-4 md:col-span-4 md:col-start-9">
            <p className="text-pretty text-lg leading-snug">{project.description}</p>
          </FadeIn>
        </div>

        {/* Fiche technique */}
        <FadeIn delay={0.45} className="mt-12 border-t border-ink md:mt-16">
          <dl className="grid grid-cols-2 md:grid-cols-6">
            {spec.map((s) => (
              <div key={s.k} className="border-b border-line py-4 pr-4 md:border-b-0">
                <dt className="f-label text-muted">{s.k}</dt>
                <dd className="mt-2 text-[15px]">{s.v}</dd>
              </div>
            ))}
            <div className="col-span-2 py-4 md:col-span-2 md:pl-4">
              <dt className="f-label text-muted">Liens</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="f-label opal-fill group flex h-9 items-center gap-2 px-3 text-on-signal"
                  >
                    Voir le site
                    <ArrowUpRightIcon size={12} weight="bold" className="transition-transform group-hover:rotate-45" />
                  </a>
                )}
                {project.codeUrl && (
                  <a
                    href={project.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="f-label group flex h-9 items-center gap-2 border border-ink px-3 transition-colors hover:bg-ink hover:text-paper"
                  >
                    Code source
                    <ArrowUpRightIcon size={12} weight="bold" className="transition-transform group-hover:rotate-45" />
                  </a>
                )}
                {!project.liveUrl && !project.codeUrl && <span className="text-muted">—</span>}
              </dd>
            </div>
          </dl>
        </FadeIn>
      </header>

      {/* Couverture */}
      <div className="shell mt-6">
        <Cover project={project} onOpen={() => openLightbox(0)} />
      </div>

      {/* Le projet */}
      {paragraphs.length > 0 && (
        <section className="shell mt-24 md:mt-36">
          <SectionHead title="Le projet" meta={noteLabel} />
          <div className="grid-12 mt-10 gap-y-8">
            <FadeIn className="col-span-4 md:col-span-8 md:col-start-5">
              <p className="text-pretty text-[clamp(1.4rem,2.3vw,2.1rem)] leading-[1.2]">{paragraphs[0]}</p>
            </FadeIn>
            {paragraphs.length > 1 && (
              <div className="col-span-4 columns-1 gap-[var(--gutter)] space-y-4 text-[17px] leading-relaxed text-muted md:col-span-8 md:col-start-5 md:columns-2">
                {paragraphs.slice(1).map((p, i) => (
                  <FadeIn key={i} delay={i * 0.06}>
                    <p className="break-inside-avoid">{p}</p>
                  </FadeIn>
                ))}
              </div>
            )}
            <FadeIn className="col-span-4 flex flex-wrap gap-2 md:col-span-8 md:col-start-5">
              {project.tags.map((t) => (
                <span key={t} className="f-label border border-line px-2.5 py-1.5">
                  {t}
                </span>
              ))}
            </FadeIn>
          </div>
        </section>
      )}

      {/* Les défis */}
      {project.challenges && project.challenges.length > 0 && (
        <section className="shell mt-24 md:mt-36">
          <SectionHead title="Les défis" />
          <ul>
            {project.challenges.map((c, i) => (
              <li key={c.title} className="border-b border-line py-8">
                <FadeIn delay={i * 0.06} className="grid-12 items-baseline gap-y-3">
                  <h3 className="col-span-4 flex items-baseline gap-4 text-2xl font-medium md:col-span-5">
                    <span aria-hidden className="opal-fill inline-block h-3 w-3 shrink-0 translate-y-[-0.1em]" />
                    {c.title}
                  </h3>
                  <p className="col-span-4 text-[17px] leading-relaxed text-muted md:col-span-7">{c.description}</p>
                </FadeIn>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Captures d'écran */}
      {project.screenshots.length > 1 && (
        <section className="shell mt-24 md:mt-36">
          <SectionHead title="Captures d'écran" meta="Glisser pour parcourir" />
          <div className="mt-10">
            <Gallery project={project} onOpen={openLightbox} />
          </div>
        </section>
      )}

      {/* Suivant / précédent */}
      <nav className="shell mt-28 md:mt-40" aria-label="Autres projets">
        <div className="border-t border-ink">
          <Link href={`/projects/${next.slug}`} className="group grid-12 items-end gap-y-4 py-10">
            <span className="f-label col-span-4 text-muted md:col-span-3">Projet suivant</span>
            <span className="col-span-4 flex items-end justify-between gap-6 md:col-span-9">
              <span
                className="f-display text-[clamp(2.6rem,9vw,9rem)] uppercase transition-[font-variation-settings] duration-700 ease-[var(--ease-expo)] [--wdth:90] group-hover:[--wdth:120]"
              >
                <span className="opal-hover">
                  {next.title}
                </span>
              </span>
              {next.thumbnail && (
                <span className="relative hidden aspect-[4/3] w-[clamp(140px,16vw,260px)] shrink-0 overflow-hidden md:block">
                  <Image
                    src={next.thumbnail}
                    alt=""
                    fill
                    sizes="260px"
                    className="scale-110 object-cover grayscale transition-all duration-700 ease-[var(--ease-expo)] group-hover:scale-100 group-hover:grayscale-0"
                  />
                </span>
              )}
            </span>
          </Link>
        </div>
        <Link
          href={`/projects/${prev.slug}`}
          className="f-label group flex items-center gap-2 border-t border-line py-4 text-muted hover:text-ink"
        >
          <ArrowLeftIcon size={12} className="transition-transform group-hover:-translate-x-1" />
          Précédent — {prev.title}
        </Link>
      </nav>

      {lbReady && (
        <Lightbox images={project.screenshots} index={lightbox} alt={project.title} onClose={() => setLightbox(null)} />
      )}
    </article>
  );
}

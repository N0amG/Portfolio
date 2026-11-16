"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, ArrowsOutSimpleIcon } from "@phosphor-icons/react";
import Lightbox from "@/components/Lightbox";
import { FadeIn, MaskLines, SectionHead } from "@/components/Reveal";
import { Project, projects, getProjectNumber, formatProjectDate } from "@/data/portfolio/projects";
import { pad, ease } from "@/lib/site";

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
    <motion.button
      ref={ref}
      type="button"
      onClick={onOpen}
      className="group relative block aspect-[4/3] w-full overflow-hidden bg-surface md:aspect-[21/9]"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 1.2, delay: 0.5, ease }}
      aria-label="Agrandir la capture principale"
    >
      {project.thumbnail && (
        <motion.img
          src={project.thumbnail}
          alt={project.title}
          style={{ y, scale: 1.25 }}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      )}
      <span className="f-label absolute bottom-0 right-0 flex items-center gap-2 bg-paper px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowsOutSimpleIcon size={12} /> Agrandir
      </span>
    </motion.button>
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
                <img
                  src={src}
                  alt={`${project.title} — capture ${i + 1}`}
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-cover object-top transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-[1.04]"
                />
                <span className="f-label absolute left-0 top-0 bg-paper px-2 py-1">{pad(i + 1)}</span>
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
  const n = pad(getProjectNumber(project.slug));
  const overview = project.overview ?? [];
  const note = overview.find((p) => /^\(.*\)$/.test(p.trim()));
  const paragraphs = overview.filter((p) => p !== note);

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
            <ArrowLeftIcon size={12} className="transition-transform group-hover:-translate-x-1" /> Index des projets
          </Link>
          <span>
            Projet <span className="text-signal">{n}</span> / {pad(projects.length)}
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
                    className="f-label group flex h-9 items-center gap-2 bg-signal px-3 text-on-signal"
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
        <Cover project={project} onOpen={() => setLightbox(0)} />
      </div>

      {/* 01 Aperçu */}
      {paragraphs.length > 0 && (
        <section className="shell mt-24 md:mt-36">
          <SectionHead index="01" title="Aperçu" meta={note?.replace(/[()]/g, "")} />
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

      {/* 02 Défis */}
      {project.challenges && project.challenges.length > 0 && (
        <section className="shell mt-24 md:mt-36">
          <SectionHead index="02" title="Défis" meta={`${pad(project.challenges.length)} points`} />
          <ol className="mt-4">
            {project.challenges.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.06}>
                <li className="grid-12 items-baseline gap-y-3 border-b border-line py-8">
                  <span
                    className="f-display col-span-1 text-[clamp(2rem,4vw,3.5rem)] text-signal [--wdth:70] md:col-span-2"
                    aria-hidden
                  >
                    {pad(i + 1)}
                  </span>
                  <h3 className="col-span-3 text-2xl font-medium md:col-span-4">{c.title}</h3>
                  <p className="col-span-4 text-[17px] leading-relaxed text-muted md:col-span-6">{c.description}</p>
                </li>
              </FadeIn>
            ))}
          </ol>
        </section>
      )}

      {/* 03 Captures */}
      {project.screenshots.length > 1 && (
        <section className="shell mt-24 md:mt-36">
          <SectionHead index="03" title="Captures" meta="Glisser pour parcourir" />
          <div className="mt-10">
            <Gallery project={project} onOpen={setLightbox} />
          </div>
        </section>
      )}

      {/* Suivant / précédent */}
      <nav className="shell mt-28 md:mt-40" aria-label="Autres projets">
        <div className="border-t border-ink">
          <Link href={`/projects/${next.slug}`} className="group grid-12 items-end gap-y-4 py-10">
            <span className="f-label col-span-4 text-muted md:col-span-3">
              <span className="text-signal">(→)</span>&nbsp;&nbsp;Projet suivant — {pad(getProjectNumber(next.slug))}
            </span>
            <span className="col-span-4 flex items-end justify-between gap-6 md:col-span-9">
              <span
                className="f-display text-[clamp(2.6rem,9vw,9rem)] uppercase transition-[font-variation-settings,color] duration-700 ease-[var(--ease-expo)] [--wdth:90] group-hover:text-signal group-hover:[--wdth:140]"
              >
                {next.title}
              </span>
              {next.thumbnail && (
                <span className="relative hidden aspect-[4/3] w-[clamp(140px,16vw,260px)] shrink-0 overflow-hidden md:block">
                  <img
                    src={next.thumbnail}
                    alt=""
                    className="h-full w-full scale-110 object-cover grayscale transition-all duration-700 ease-[var(--ease-expo)] group-hover:scale-100 group-hover:grayscale-0"
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

      <Lightbox images={project.screenshots} index={lightbox} alt={project.title} onClose={() => setLightbox(null)} />
    </article>
  );
}

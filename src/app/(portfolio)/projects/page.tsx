"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { ArrowDownIcon, RowsIcon, SquaresFourIcon } from "@phosphor-icons/react";
import ProjectCard from "@/components/ProjectCard";
import ProjectIndex from "@/components/ProjectIndex";
import { FadeIn, MaskLines, DrawRule } from "@/components/Reveal";
import { projects, allCategories, categoryName } from "@/data/portfolio/projects";
import { ease } from "@/lib/site";

const filters = ["Tous", ...allCategories] as const;
type View = "list" | "grid";

const chip =
  "f-label relative flex h-9 items-center gap-1.5 border border-line px-3 transition-colors hover:border-ink data-[state=on]:border-ink data-[state=on]:text-paper";

export default function ProjectsPage() {
  const [filter, setFilter] = useState<string>("Tous");
  const [desc, setDesc] = useState(true);
  const [view, setView] = useState<View>("list");

  const counts = useMemo(() => {
    const c: Record<string, number> = { Tous: projects.length };
    for (const cat of allCategories) c[cat] = projects.filter((p) => p.categories.includes(cat)).length;
    return c;
  }, []);

  const list = useMemo(() => {
    const out = filter === "Tous" ? [...projects] : projects.filter((p) => p.categories.includes(filter));
    out.sort((a, b) => (desc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
    return out;
  }, [filter, desc]);

  return (
    <div className="shell pb-24 pt-28 md:pb-36 md:pt-40">
      {/* En-tête */}
      <div className="grid-12 items-end gap-y-8">
        <div className="col-span-4 md:col-span-12">
          <MaskLines
            as="h1"
            className="f-display whitespace-nowrap text-[clamp(3.4rem,13.2vw,15rem)] uppercase [--wdth:128] [--wght:880]"
            lines={[
              <span key="t" className="flex items-start gap-[0.08em]">
                <span className="opal-text">Projets</span>
                <span className="f-label mt-[0.35em] text-[clamp(0.75rem,1.4vw,1rem)] text-signal">({projects.length})</span>
              </span>,
            ]}
          />
        </div>
        <FadeIn delay={0.3} className="col-span-4 md:col-span-5 md:col-start-8">
          <p className="text-pretty max-w-[42ch] text-lg leading-snug text-muted">
            Sites et applications web réalisés en agence, en formation et en projet personnel. Chaque fiche explique le
            besoin, ce qui a été fait et le résultat.
          </p>
        </FadeIn>
      </div>

      {/* Barre d'outils */}
      <div className="mt-14 md:mt-20">
        <DrawRule />
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <LayoutGroup id="filters">
            <ToggleGroup.Root
              type="single"
              value={filter}
              onValueChange={(v) => v && setFilter(v)}
              aria-label="Filtrer par catégorie"
              className="flex flex-wrap gap-2"
            >
              {filters.map((f) => (
                <ToggleGroup.Item key={f} value={f} className={chip}>
                  {filter === f && (
                    <motion.span layoutId="filter-pill" className="absolute inset-0 -z-0 bg-ink" transition={{ duration: 0.5, ease }} />
                  )}
                  <span className="relative">{categoryName(f)}</span>
                  <span className="relative opacity-50">{counts[f]}</span>
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </LayoutGroup>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDesc((v) => !v)}
              className={`${chip} gap-2`}
              aria-label={desc ? "Trier du plus ancien au plus récent" : "Trier du plus récent au plus ancien"}
            >
              {desc ? "Récents" : "Anciens"}
              <motion.span animate={{ rotate: desc ? 0 : 180 }} transition={{ duration: 0.4, ease }}>
                <ArrowDownIcon size={12} />
              </motion.span>
            </button>
            <ToggleGroup.Root
              type="single"
              value={view}
              onValueChange={(v) => v && setView(v as View)}
              aria-label="Affichage"
              className="flex"
            >
              <ToggleGroup.Item value="list" aria-label="Vue liste" className={`${chip} -mr-px data-[state=on]:bg-ink`}>
                <RowsIcon size={14} />
              </ToggleGroup.Item>
              <ToggleGroup.Item value="grid" aria-label="Vue grille" className={`${chip} data-[state=on]:bg-ink`}>
                <SquaresFourIcon size={14} />
              </ToggleGroup.Item>
            </ToggleGroup.Root>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          {view === "list" ? (
            <ProjectIndex key={`${filter}-${desc}`} projects={list} />
          ) : (
            <motion.div layout className="grid gap-x-[var(--gutter)] gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((p, i) => (
                  <ProjectCard key={p.slug} project={p} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

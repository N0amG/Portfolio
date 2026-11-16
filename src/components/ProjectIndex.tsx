"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Project } from "@/data/portfolio/projects";
import { ease } from "@/lib/site";

/**
 * Index des projets façon catalogue. Au survol (souris), une vignette suit le
 * curseur avec un ressort et la ligne se remplit de la couleur signal.
 * Sur tactile : vignette intégrée à la ligne.
 */
export default function ProjectIndex({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<number | null>(null);
  const fine = useMediaQuery("(pointer: fine)");
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });

  const onMove = (e: React.PointerEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  return (
    <div onPointerMove={onMove} onPointerLeave={() => setActive(null)} className="relative">
      <div className="f-label grid-12 hidden border-b border-line pb-3 text-muted md:grid">
        <span className="col-span-6">Projet</span>
        <span className="col-span-3">Type</span>
        <span className="col-span-2 hidden md:block">Technologies</span>
        <span className="col-span-1 text-right">Année</span>
      </div>

      <ul>
        {projects.map((p, i) => (
          <motion.li
            key={p.slug}
            layout
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, delay: Math.min(i, 6) * 0.05, ease }}
            className="border-b border-line"
          >
            <Link
              href={`/projects/${p.slug}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="group relative block overflow-hidden"
            >
              {/* remplissage signal depuis le bas */}
              <span
                aria-hidden
                className="opal-fill opal-still absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
              />
              <span className="grid-12 relative items-center py-5 transition-colors duration-300 group-hover:text-on-signal md:py-6">
                <span className="col-span-4 flex items-center gap-3 md:col-span-6 md:pl-1">
                  <span
                    className="f-display text-[clamp(1.8rem,3.9vw,4rem)] uppercase transition-[font-variation-settings] duration-700 ease-[var(--ease-expo)] [--wdth:80] group-hover:[--wdth:104]"
                    style={{ "--wght": 760 } as React.CSSProperties}
                  >
                    {p.title}
                  </span>
                  <ArrowUpRightIcon
                    weight="bold"
                    className="h-6 w-6 shrink-0 -translate-x-3 opacity-0 transition-all duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </span>
                <span className="col-span-3 hidden text-[15px] md:block">{p.categoryLabel}</span>
                <span className="f-label col-span-2 hidden truncate text-muted transition-colors group-hover:text-on-signal md:block">
                  {p.tags.slice(0, 3).join(" · ")}
                </span>
                <span className="f-label col-span-4 mt-2 flex items-center justify-between text-muted transition-colors group-hover:text-on-signal md:col-span-1 md:mt-0 md:block md:text-right">
                  <span className="md:hidden">{p.categoryLabel}</span>
                  <span>{p.date.slice(0, 4)}</span>
                </span>
              </span>
              {p.thumbnail && (
                <span className="relative mb-5 hidden aspect-[16/9] overflow-hidden pointer-coarse:block">
                  <Image src={p.thumbnail} alt="" fill sizes="100vw" className="object-cover" />
                </span>
              )}
            </Link>
          </motion.li>
        ))}
      </ul>

      {/* vignette flottante */}
      {fine && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-40 hidden md:block"
          style={{ x: sx, y: sy }}
        >
          <AnimatePresence>
            {active !== null && projects[active]?.thumbnail && (
              <motion.div
                key="frame"
                className="relative -translate-x-1/2 -translate-y-[115%] overflow-hidden border border-ink bg-surface shadow-[8px_8px_0_0_var(--ink)]"
                style={{ width: "clamp(260px, 24vw, 420px)", aspectRatio: "4 / 3" }}
                initial={{ clipPath: "inset(100% 0 0 0)", rotate: -4 }}
                animate={{ clipPath: "inset(0% 0 0 0)", rotate: 0 }}
                exit={{ clipPath: "inset(0 0 100% 0)", rotate: 3 }}
                transition={{ duration: 0.5, ease }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={projects[active].slug}
                    className="absolute inset-0"
                    initial={{ y: "100%", scale: 1.2 }}
                    animate={{ y: "0%", scale: 1 }}
                    exit={{ y: "-30%", opacity: 0 }}
                    transition={{ duration: 0.6, ease }}
                  >
                    <Image src={projects[active].thumbnail} alt="" fill sizes="420px" className="object-cover" />
                  </motion.div>
                </AnimatePresence>
                <span className="f-label absolute bottom-0 left-0 bg-ink px-2 py-1 text-paper">{projects[active].title}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

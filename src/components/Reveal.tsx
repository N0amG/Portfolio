"use client";

import { motion, useInView } from "framer-motion";
import { Fragment, useRef } from "react";
import { ease } from "@/lib/site";

/**
 * Révélation par masque : chaque ligne passée en `lines` monte depuis
 * sous sa propre ligne de base. Utilisé pour tous les gros titres.
 */
export function MaskLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  as: Tag = "h2",
  once = true,
  joiner = " ",
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  once?: boolean;
  /** Texte inséré entre les lignes (invisible : les lignes sont des blocs) pour
   *  que le titre se lise correctement (lecteurs d'écran, moteurs de recherche, copier-coller). */
  joiner?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px" });

  return (
    <Tag ref={ref as never} className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && joiner}
          <span className="-my-[0.14em] block overflow-hidden py-[0.14em]">
            <motion.span
              className={`block ${lineClassName ?? ""}`}
              initial={{ y: "105%" }}
              animate={inView ? { y: "0%" } : { y: "105%" }}
              transition={{ duration: 1.1, delay: delay + i * 0.08, ease }}
            >
              {line}
            </motion.span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}

/** Fondu + montée simple pour les blocs de contenu. */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
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
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px" });

  return (
    <Tag ref={ref as never} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="-my-[0.14em] block overflow-hidden py-[0.14em]">
          <motion.span
            className={`block ${lineClassName ?? ""}`}
            initial={{ y: "105%" }}
            animate={inView ? { y: "0%" } : { y: "105%" }}
            transition={{ duration: 1.1, delay: delay + i * 0.08, ease }}
          >
            {line}
          </motion.span>
        </span>
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

/** Trait horizontal qui se dessine de gauche à droite. */
export function DrawRule({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <div ref={ref} className={`h-px w-full overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="h-px w-full origin-left bg-line"
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.4, delay, ease }}
      />
    </div>
  );
}

/** En-tête de section : "(01) Titre ———— meta" */
export function SectionHead({
  index,
  title,
  meta,
  className,
}: {
  index: string;
  title: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="f-label flex items-baseline justify-between gap-6 pb-3 text-muted">
        <span>
          <span className="text-signal">({index})</span>&nbsp;&nbsp;{title}
        </span>
        {meta && <span className="text-right">{meta}</span>}
      </div>
      <DrawRule />
    </div>
  );
}

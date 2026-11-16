"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export type From = { x?: number; y?: number; rotate?: number; scale?: number; opacity?: number };

/**
 * Un morceau de page qui "s'assemble" au scroll : il part décalé (position, rotation,
 * échelle, opacité) et rejoint sa place à mesure qu'il entre dans l'écran.
 * Lié au scroll (pas une animation déclenchée) ; transform/opacity seulement : composé
 * sur le GPU, aucun décalage de mise en page. Rien en mouvement réduit.
 */
export default function Assemble({
  children,
  from,
  className,
  end = "start 0.4",
}: {
  children: React.ReactNode;
  from: From;
  className?: string;
  /** Moment où le morceau est en place (offset framer-motion). */
  end?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", end] as never });
  const opt = { ease: easeOut };
  const k = reduce ? 0 : 1; // mouvement réduit : amplitudes à zéro (même balisage serveur / client)
  const x = useTransform(scrollYProgress, [0, 1], [(from.x ?? 0) * k, 0], opt);
  const y = useTransform(scrollYProgress, [0, 1], [(from.y ?? 0) * k, 0], opt);
  const rotate = useTransform(scrollYProgress, [0, 1], [(from.rotate ?? 0) * k, 0], opt);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : (from.scale ?? 1), 1], opt);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [reduce ? 1 : (from.opacity ?? 1), 1]);

  return (
    <motion.div ref={ref} className={className} style={{ x, y, rotate, scale, opacity }}>
      {children}
    </motion.div>
  );
}

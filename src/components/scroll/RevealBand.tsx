"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Bande pleine largeur qui part d'un rectangle arrondi en retrait et s'ouvre
 * jusqu'aux bords à mesure qu'elle entre dans l'écran (clip-path lié au scroll).
 */
export default function RevealBand({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const side = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 7, 0]);
  const round = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 48, 0]);
  const clipPath = useMotionTemplate`inset(0 ${side}% round ${round}px)`;

  return (
    <motion.section ref={ref} className={className} style={{ clipPath }}>
      {children}
    </motion.section>
  );
}

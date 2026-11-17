"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

export type Step = { title: string; text: string };

/**
 * Étape : son numéro se remplit et son texte s'éclaire quand le rail l'atteint.
 * `at` = position de l'étape sur le rail (0 → 1).
 */
function StepItem({ step, index, at, progress, reduce }: { step: Step; index: number; at: number; progress: MotionValue<number>; reduce: boolean }) {
  // La 1re étape s'allume dès le début du rail ; les suivantes juste avant d'être atteintes.
  const range = at === 0 ? [0, 0.04] : [at - 0.08, at];
  const fill = useTransform(progress, range, [reduce ? 1 : 0, 1]);
  const textOpacity = useTransform(progress, range, [reduce ? 1 : 0.35, 1]);
  const y = useTransform(progress, range, [reduce ? 0 : 14, 0]);

  return (
    <li className="relative grid grid-cols-[3rem_1fr] gap-5 pb-10 last:pb-0 md:block md:pb-0 md:pr-6">
      {/* Pastille numérotée, posée sur le rail */}
      <span className="f-display relative z-10 grid h-12 w-12 place-items-center rounded-full border border-line bg-paper text-[1.35rem] italic leading-none [--wght:420]">
        <motion.span style={{ opacity: textOpacity }}>{index + 1}</motion.span>
        {/* Pastille remplie : son propre chiffre, contrasté sur l'accent */}
        <motion.span
          aria-hidden
          className="absolute inset-0 grid place-items-center rounded-full bg-accent-ink text-on-accent"
          style={{ scale: fill, opacity: fill }}
        >
          {index + 1}
        </motion.span>
      </span>
      <motion.div className="md:mt-7" style={{ opacity: textOpacity, y }}>
        <h3 className="f-display text-[1.5rem] leading-tight [--wght:480] md:text-[1.65rem]">{step.title}</h3>
        <p className="mt-2 max-w-[34ch] leading-relaxed text-muted">{step.text}</p>
      </motion.div>
    </li>
  );
}

/**
 * Frise « Comment on travaille ensemble » : un rail se remplit au rythme du scroll
 * (vertical sur mobile, horizontal sur desktop) et allume chaque étape au passage.
 * Lié au scroll ; transform/opacity uniquement. En mouvement réduit, tout est affiché.
 */
export default function ProcessTimeline({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] });
  const rail = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0, 1]);
  const last = Math.max(1, steps.length - 1);

  return (
    <ol ref={ref} className="relative mt-10 md:mt-14 md:grid md:grid-cols-4 md:gap-0">
      {/* Rail vertical (mobile) : de la 1re à la dernière pastille */}
      <span aria-hidden className="absolute bottom-6 left-6 top-6 w-px -translate-x-1/2 bg-line md:hidden" />
      <motion.span
        aria-hidden
        className="absolute bottom-6 left-6 top-6 w-px origin-top -translate-x-1/2 bg-accent-ink md:hidden"
        style={{ scaleY: rail }}
      />
      {/* Rail horizontal (desktop) */}
      <span aria-hidden className="absolute left-6 right-[calc(25%-1.5rem)] top-6 hidden h-px bg-line md:block" />
      <motion.span
        aria-hidden
        className="absolute left-6 right-[calc(25%-1.5rem)] top-6 hidden h-px origin-left bg-accent-ink md:block"
        style={{ scaleX: rail }}
      />
      {steps.map((s, i) => (
        <StepItem key={s.title} step={s} index={i} at={i / last} progress={rail} reduce={reduce} />
      ))}
    </ol>
  );
}

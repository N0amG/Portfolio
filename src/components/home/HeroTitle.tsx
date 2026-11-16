"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import HeroWord from "./HeroWord";

/**
 * Titre du hero : trois lignes qui montent en CSS (peintes dès le premier rendu, LCP),
 * puis s'écartent en sens opposés au début du scroll. Une pastille photo est
 * incrustée dans la phrase ; "venir" réagit au curseur (HeroWord).
 */
export default function HeroTitle() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const left = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -140]);
  const right = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 160]);
  const shifts = [left, right, left];

  const lines: React.ReactNode[] = [
    <>
      Un site qui fait
      <span
        aria-hidden
        className="relative ml-[0.22em] hidden h-[0.74em] sm:inline-block w-[1.55em] overflow-hidden rounded-full bg-surface align-[-0.04em]"
      >
        <Image src="/img/selfie.jpeg" alt="" fill preload sizes="180px" className="object-cover object-[50%_30%]" />
      </span>
    </>,
    <>
      <HeroWord text="venir" className="italic text-accent" /> des clients
    </>,
    <>dans votre commerce.</>,
  ];

  return (
    <h1 className="f-display text-[clamp(2.75rem,7.4vw,7.25rem)] leading-[1] tracking-[-0.03em] [--wght:380]">
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className={`-my-[0.1em] block overflow-hidden py-[0.1em] ${i === 1 ? "pl-[9%]" : ""} ${i === 2 ? "md:text-right" : ""}`}
          style={{ x: shifts[i] }}
        >
          <span className="hero-rise block" style={{ animationDelay: `${0.06 + i * 0.09}s` }}>
            {line}
          </span>
          {i < lines.length - 1 && " "}
        </motion.span>
      ))}
    </h1>
  );
}

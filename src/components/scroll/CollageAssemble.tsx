"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Piece = {
  src: string;
  /** Position finale (en % de l'écran) et largeur */
  left: string;
  top: string;
  width: string;
  /** Décalage de départ : éparpillé hors de l'écran, tourné */
  from: { x: number; y: number; rotate: number };
  /** Légère inclinaison finale */
  tilt: number;
};

const pieces: Piece[] = [
  { src: "/img/sophie-bluel/0.webp", left: "3%", top: "9%", width: "clamp(100px,20vw,300px)", from: { x: -520, y: -260, rotate: -24 }, tilt: -3 },
  { src: "/img/booki/0.webp", left: "33%", top: "3%", width: "clamp(96px,17vw,250px)", from: { x: 0, y: -520, rotate: 14 }, tilt: 2 },
  { src: "/img/kasa/1.webp", left: "73%", top: "8%", width: "clamp(100px,22vw,320px)", from: { x: 560, y: -300, rotate: 22 }, tilt: 3 },
  { src: "/img/nina-carducci/0.webp", left: "4%", top: "68%", width: "clamp(96px,15vw,220px)", from: { x: -560, y: 300, rotate: 18 }, tilt: 4 },
  { src: "/img/mon-vieux-grimoire/0.webp", left: "46%", top: "77%", width: "clamp(100px,18vw,260px)", from: { x: 120, y: 520, rotate: -16 }, tilt: -2 },
  { src: "/img/pixelguessr/0.webp", left: "74%", top: "66%", width: "clamp(96px,20vw,290px)", from: { x: 560, y: 320, rotate: -20 }, tilt: -4 },
];

function PieceTile({ piece, progress, k, index }: { piece: Piece; progress: MotionValue<number>; k: number; index: number }) {
  // Chaque morceau arrive avec un léger décalage dans le temps
  const start = index * 0.04;
  const range = [start, 0.62 + start * 0.5];
  const opt = { ease: easeOut };
  const x = useTransform(progress, range, [piece.from.x * k, 0], opt);
  const y = useTransform(progress, range, [piece.from.y * k, 0], opt);
  const rotate = useTransform(progress, range, [piece.from.rotate * k + piece.tilt, piece.tilt], opt);
  const scale = useTransform(progress, range, [k ? 1.25 : 1, 1], opt);

  return (
    <motion.div
      className="absolute aspect-[4/3] overflow-hidden rounded-[14px] bg-surface shadow-float"
      style={{ left: piece.left, top: piece.top, width: piece.width, x, y, rotate, scale }}
    >
      <Image src={piece.src} alt="" fill sizes="320px" className="object-cover object-top" />
    </motion.div>
  );
}

/**
 * Section épinglée : des captures de réalisations, éparpillées hors de l'écran,
 * convergent et s'assemblent autour de la phrase centrale pendant le scroll.
 * Transform/opacity seulement ; en mouvement réduit, tout est déjà en place.
 */
export default function CollageAssemble({ title, caption }: { title: string; caption: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const k = reduce ? 0 : 1;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const textOpacity = useTransform(scrollYProgress, [0.25, 0.6], [reduce ? 1 : 0, 1]);
  const textScale = useTransform(scrollYProgress, [0.25, 0.7], [reduce ? 1 : 0.92, 1]);

  return (
    <section ref={ref} className="relative h-[280vh] motion-reduce:h-auto" aria-label={title}>
      <div className="sticky top-0 h-svh overflow-hidden motion-reduce:relative motion-reduce:h-[100svh]">
        {pieces.map((p, i) => (
          <PieceTile key={p.src} piece={p} progress={scrollYProgress} k={k} index={i} />
        ))}
        <motion.div
          className="absolute inset-0 grid place-items-center px-6 text-center"
          style={{ opacity: textOpacity, scale: textScale }}
        >
          <div>
            <p className="f-display mx-auto max-w-[13ch] text-[clamp(2.4rem,5.6vw,5.25rem)] leading-[1.02] [--wght:400]">{title}</p>
            <p className="mx-auto mt-5 max-w-[36ch] text-lg text-muted">{caption}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

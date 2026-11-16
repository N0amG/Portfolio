"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** Portrait en arche : dévoilé par le bas (CSS), parallaxe interne au scroll. */
export default function AboutPortrait() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);

  return (
    <div
      ref={ref}
      className="hero-reveal relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[999px_999px_18px_18px] bg-surface md:mx-0 md:justify-self-end"
    >
      <motion.div className="absolute inset-0" style={{ y, scale: 1.16 }}>
        <Image
          src="/img/selfie.jpeg"
          alt="Portrait de Noam Guez"
          fill
          preload
          sizes="(min-width: 768px) 420px, 90vw"
          className="object-cover"
        />
      </motion.div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

function Word({
  children,
  progress,
  range,
  accent,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  accent?: boolean;
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <>
      <motion.span style={{ opacity }} className={`inline-block ${accent ? "italic" : ""}`}>
        {children}
      </motion.span>{" "}
    </>
  );
}

/**
 * Paragraphe dont chaque mot passe de l'ombre à l'encre au rythme du scroll.
 * Les mots entourés de *astérisques* passent en italique.
 */
export default function ScrollStatement({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");

  return (
    <p ref={ref} className={className} aria-label={text.replaceAll("*", "")}>
      {words.map((w, i) => {
        const accent = w.startsWith("*");
        const clean = w.replaceAll("*", "");
        const start = i / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, start + 1 / words.length]} accent={accent}>
            {clean}
          </Word>
        );
      })}
    </p>
  );
}

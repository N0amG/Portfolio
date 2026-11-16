"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "framer-motion";

/** Bandeau infini dont la vitesse et le sens suivent la vélocité du scroll. */
export default function VelocityMarquee({
  items,
  baseVelocity = -2.4,
  className,
}: {
  items: string[];
  baseVelocity?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [-1000, 0, 1000], [-4, 0, 4], { clamp: false });
  const dir = useRef(1);
  const tx = useTransform(x, (v) => `${wrap(-25, -50, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += dir.current * move * f;
    x.set(x.get() + move);
  });

  const row = (
    <>
      {items.map((it, i) => (
        <span key={i} className="flex items-center">
          <span>{it}</span>
          <span className="mx-[0.35em] inline-block h-[0.18em] w-[0.18em] translate-y-[-0.05em] bg-signal" />
        </span>
      ))}
    </>
  );

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className ?? ""}`} aria-hidden>
      <motion.div className="flex w-max" style={{ x: tx }}>
        {row}
        {row}
        {row}
        {row}
      </motion.div>
    </div>
  );
}

"use client";

import { motion, useInView, type TargetAndTransition } from "framer-motion";
import { useRef } from "react";

type AnimationType = "fade-up" | "fade-left" | "fade-right" | "scale" | "blur";

const hiddenVariants: Record<AnimationType, TargetAndTransition> = {
  "fade-up": { opacity: 0, y: 40 },
  "fade-left": { opacity: 0, x: -50 },
  "fade-right": { opacity: 0, x: 50 },
  scale: { opacity: 0, scale: 0.88 },
  blur: { opacity: 0, y: 20 },
};

const visibleVariants: Record<AnimationType, TargetAndTransition> = {
  "fade-up": { opacity: 1, y: 0 },
  "fade-left": { opacity: 1, x: 0 },
  "fade-right": { opacity: 1, x: 0 },
  scale: { opacity: 1, scale: 1 },
  blur: { opacity: 1, y: 0 },
};

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: AnimationType;
}

export default function AnimatedSection({
  children,
  className,
  delay = 0,
  animation = "fade-up",
}: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hiddenVariants[animation]}
      animate={isInView ? visibleVariants[animation] : hiddenVariants[animation]}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

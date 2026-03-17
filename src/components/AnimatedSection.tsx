"use client";

import { motion, useInView, type TargetAndTransition } from "framer-motion";
import { useRef } from "react";

type AnimationType = "fade-up" | "fade-left" | "fade-right" | "scale" | "blur";

const hiddenVariants: Record<AnimationType, TargetAndTransition> = {
  "fade-up": { opacity: 0, y: 50, filter: "blur(4px)" },
  "fade-left": { opacity: 0, x: -60 },
  "fade-right": { opacity: 0, x: 60 },
  scale: { opacity: 0, scale: 0.85 },
  blur: { opacity: 0, filter: "blur(12px)" },
};

const visibleVariants: Record<AnimationType, TargetAndTransition> = {
  "fade-up": { opacity: 1, y: 0, filter: "blur(0px)" },
  "fade-left": { opacity: 1, x: 0 },
  "fade-right": { opacity: 1, x: 0 },
  scale: { opacity: 1, scale: 1 },
  blur: { opacity: 1, filter: "blur(0px)" },
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

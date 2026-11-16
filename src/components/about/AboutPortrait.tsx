"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { easeInOut } from "@/lib/site";

export default function AboutPortrait() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.div
      ref={ref}
      className="col-span-2 col-start-3 self-end md:col-span-3 md:col-start-10"
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      transition={{ duration: 1.3, delay: 0.5, ease: easeInOut }}
    >
      <div className="opal-photo aspect-[3/4] overflow-hidden">
        <motion.img src="/img/selfie.jpeg" alt="Portrait de Noam Guez" style={{ y, scale: 1.2 }} className="h-full w-full object-cover" />
      </div>
    </motion.div>
  );
}

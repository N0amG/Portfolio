"use client";

import Image from "next/image";
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
      className="opal-halo relative col-span-2 col-start-3 self-end md:col-span-3 md:col-start-10"
      // marges négatives : le rideau ne rogne pas le halo
      initial={{ clipPath: "inset(-25% 100% -25% -25%)" }}
      animate={{ clipPath: "inset(-25% -25% -25% -25%)" }}
      transition={{ duration: 1.1, delay: 0.25, ease: easeInOut }}
    >
      <div className="opal-veil relative aspect-[3/4] overflow-hidden bg-surface">
        <motion.div className="absolute inset-0" style={{ y, scale: 1.2 }}>
          <Image
            src="/img/selfie.jpeg"
            alt="Portrait de Noam Guez"
            fill
            preload
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

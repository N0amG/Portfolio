"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

/** Portrait en arche, dévoilé par le bas (CSS), avec un léger parallaxe au scroll. */
export default function HeroPortrait() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, -60]);

  return (
    <motion.div className="mx-auto w-full max-w-[420px] md:mx-0 md:justify-self-end" style={{ y }}>
      <div className="hero-reveal relative aspect-[4/5] overflow-hidden rounded-[999px_999px_18px_18px] bg-surface">
        <Image
          src="/img/selfie.jpeg"
          alt="Portrait de Noam Guez"
          fill
          preload
          sizes="(min-width: 768px) 420px, 90vw"
          className="object-cover"
        />
      </div>
    </motion.div>
  );
}

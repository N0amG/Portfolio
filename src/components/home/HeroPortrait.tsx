"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

/** Portrait logé dans le vide à gauche de "GUEZ". */
export default function HeroPortrait() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, -120]);
  const rotate = useTransform(scrollY, [0, 800], [0, -6]);

  return (
    <motion.div className="absolute bottom-[0.1em] left-0 w-[clamp(56px,11vw,230px)]" style={{ y, rotate }}>
      <div className="hero-reveal relative aspect-[4/5] overflow-hidden bg-surface">
        <Image
          src="/img/selfie.jpeg"
          alt="Portrait de Noam Guez"
          fill
          preload
          sizes="(min-width: 2100px) 230px, (min-width: 510px) 11vw, 56px"
          className="object-cover"
        />
      </div>
    </motion.div>
  );
}

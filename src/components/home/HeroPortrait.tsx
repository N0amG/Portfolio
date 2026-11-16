"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { easeInOut } from "@/lib/site";

/** Portrait bichrome logé dans le vide à gauche de "GUEZ". */
export default function HeroPortrait() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, -120]);
  const rotate = useTransform(scrollY, [0, 800], [0, -6]);

  return (
    <motion.figure
      className="absolute bottom-[0.1em] left-0 w-[clamp(56px,11vw,230px)]"
      style={{ y, rotate }}
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      transition={{ duration: 1.3, delay: 1, ease: easeInOut }}
    >
      <div className="duotone aspect-[4/5] overflow-hidden">
        <motion.img
          src="/img/selfie.jpeg"
          alt="Portrait de Noam Guez"
          className="h-full w-full object-cover"
          initial={{ scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, delay: 1, ease: easeInOut }}
        />
      </div>
      <figcaption className="f-label absolute left-full top-0 ml-3 hidden whitespace-nowrap text-muted [writing-mode:vertical-rl] md:block">
        Fig. 01 — N.G., Lyon
      </figcaption>
    </motion.figure>
  );
}

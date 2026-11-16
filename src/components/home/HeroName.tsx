"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ease } from "@/lib/site";
import { useFitText } from "@/lib/useFitText";

const BASE_W = 138;
const BASE_G = 840;

/**
 * Le nom en Anybody variable. Chaque lettre lit la distance au curseur et
 * interpole ses axes wdth / wght : les lettres proches s'élargissent et
 * s'épaississent, les autres se resserrent. Sur écran tactile, une onde lente
 * remplace le curseur. Désactivé si l'utilisateur réduit les animations.
 */
export default function HeroName({ lines }: { lines: string[] }) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);

  // La ligne la plus large remplit exactement le conteneur.
  useFitText(rootRef, lines, `"wdth" ${BASE_W}, "wght" ${BASE_G}`);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const els = letters.current.filter(Boolean) as HTMLSpanElement[];
    const state = els.map(() => ({ w: 50, g: 300 })); // départ compressé → s'ouvre à l'entrée
    let mx = 0;
    let my = 0;
    let inside = false;
    let visible = true;
    let raf = 0;
    const start = performance.now();

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const r = root.getBoundingClientRect();
      inside = my > r.top - 140 && my < r.bottom + 140;
    };
    const onLeave = () => (inside = false);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(root);

    function tick(t: number) {
      if (!visible) {
        raf = 0;
        return;
      }
      const elapsed = t - start;
      const intro = Math.min(1, Math.max(0, (elapsed - 500) / 900)); // laisse le masque se lever
      const span = window.innerWidth * 0.3;
      // lecture groupée (pas de layout thrash)
      const centers = els.map((el) => {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      });

      els.forEach((el, i) => {
        let tw = BASE_W;
        let tg = BASE_G;
        if (fine && inside) {
          const [cx, cy] = centers[i];
          const d = Math.hypot(mx - cx, (my - cy) * 1.6);
          const k = Math.max(0, 1 - d / span);
          const e = k * k * (3 - 2 * k); // smoothstep
          tw = 92 + e * 58;
          tg = 600 + e * 300;
        } else if (!fine) {
          const s = Math.sin(elapsed / 1100 - i * 0.55);
          tw = 118 + s * 30;
          tg = BASE_G + s * 60;
        }
        tw = 50 + (tw - 50) * intro;
        tg = 300 + (tg - 300) * intro;
        const st = state[i];
        st.w += (tw - st.w) * 0.09;
        st.g += (tg - st.g) * 0.09;
        el.style.fontVariationSettings = `"wdth" ${st.w.toFixed(2)}, "wght" ${st.g.toFixed(1)}`;
      });
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  let n = 0;
  return (
    <h1 ref={rootRef} className="f-display select-none uppercase" aria-label={lines.join(" ")}>
      {lines.map((word, li) => (
        <span
          key={word}
          aria-hidden
          className={`flex overflow-hidden ${li % 2 === 1 ? "justify-end" : "justify-start"}`}
        >
          {word.split("").map((ch, ci) => {
            const idx = n++;
            return (
              <motion.span
                key={ci}
                className="inline-block"
                initial={{ y: "102%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.2, delay: 0.35 + li * 0.12 + ci * 0.045, ease }}
              >
                <span
                  ref={(el) => {
                    letters.current[idx] = el;
                  }}
                  className="inline-block"
                  style={{ fontVariationSettings: `"wdth" ${BASE_W}, "wght" ${BASE_G}` }}
                >
                  {ch}
                </span>
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

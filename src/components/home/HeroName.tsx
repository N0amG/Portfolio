"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ease } from "@/lib/site";
import { useFitText } from "@/lib/useFitText";

const BASE_W = 138;
const BASE_G = 840;

/**
 * Le nom en Anybody variable, rempli d'opale.
 *
 * — Chaque lettre lit la distance au curseur et interpole ses axes wdth / wght.
 * — Toutes les lettres partagent UN dégradé opale (taillé à la taille du titre
 *   puis décalé lettre par lettre) : la matière paraît continue d'une lettre à
 *   l'autre. Un reflet nacré suit le curseur ; sur tactile, il orbite seul.
 * — Les couleurs tournent en continu via --opal-a (animé sur :root).
 */
export default function HeroName({ lines }: { lines: string[] }) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);

  // La ligne la plus large remplit exactement le conteneur.
  useFitText(rootRef, lines, `"wdth" ${BASE_W}, "wght" ${BASE_G}`);

  useEffect(() => {
    const maybeRoot = rootRef.current;
    if (!maybeRoot) return;
    const root: HTMLHeadingElement = maybeRoot;
    const els = letters.current.filter(Boolean) as HTMLSpanElement[];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    /** Cale le dégradé de chaque lettre sur le repère du titre. */
    const placeBackgrounds = (rr: DOMRect, rects: DOMRect[]) => {
      els.forEach((el, i) => {
        const r = rects[i];
        el.style.backgroundSize = `${rr.width}px ${rr.height}px`;
        el.style.backgroundPosition = `${-(r.left - rr.left)}px ${-(r.top - rr.top)}px`;
      });
    };

    const measure = () => {
      const rr = root.getBoundingClientRect();
      placeBackgrounds(
        rr,
        els.map((el) => el.getBoundingClientRect()),
      );
    };

    if (reduce) {
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(root);
      return () => ro.disconnect();
    }

    const state = els.map(() => ({ w: 50, g: 300 })); // départ compressé → s'ouvre à l'entrée
    const sheen = { x: 0.3, y: 0.35 };
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
      const intro = Math.min(1, Math.max(0, (elapsed - 500) / 900));
      const span = window.innerWidth * 0.3;

      // lectures groupées, puis écritures (pas de layout thrash)
      const rr = root.getBoundingClientRect();
      const rects = els.map((el) => el.getBoundingClientRect());

      // reflet : suit le curseur, ou orbite lentement
      let tx: number;
      let ty: number;
      if (fine && inside) {
        tx = (mx - rr.left) / rr.width;
        ty = (my - rr.top) / rr.height;
      } else {
        tx = 0.5 + Math.cos(elapsed / 2600) * 0.38;
        ty = 0.5 + Math.sin(elapsed / 1900) * 0.32;
      }
      sheen.x += (tx - sheen.x) * 0.08;
      sheen.y += (ty - sheen.y) * 0.08;
      root.style.setProperty("--mx", `${(sheen.x * rr.width).toFixed(1)}px`);
      root.style.setProperty("--my", `${(sheen.y * rr.height).toFixed(1)}px`);

      els.forEach((el, i) => {
        let tw = BASE_W;
        let tg = BASE_G;
        if (fine && inside) {
          const r = rects[i];
          const d = Math.hypot(mx - (r.left + r.width / 2), (my - (r.top + r.height / 2)) * 1.6);
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

      placeBackgrounds(rr, rects);
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
                  className="opal-text inline-block"
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

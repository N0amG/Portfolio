"use client";

import { useEffect, useRef } from "react";

const BASE_G = 400;
const BASE_S = 100;
const BASE_FVS = `"wght" ${BASE_G}, "SOFT" ${BASE_S}`;

/**
 * Un mot en Fraunces dont chaque lettre réagit à la proximité du curseur :
 * fine et arrondie au repos (wght 400 / SOFT 100), grasse et nette sous la souris
 * (wght 800 / SOFT 0).
 *
 * — Souris uniquement (pointer: fine) ; rien sur tactile ni en mouvement réduit.
 * — Chaque frame lit toutes les positions, puis écrit les styles (pas de layout thrash).
 * — La boucle s'arrête dès que tout est stable et repart au mouvement de la souris.
 * — Le mot est seul sur sa ligne avec ses voisins : l'élargissement ne fait pas
 *   changer les retours à la ligne du titre.
 */
export default function HeroWord({ text, className }: { text: string; className?: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const letters = Array.from(root.children) as HTMLSpanElement[];
    const state = letters.map(() => ({ g: BASE_G, s: BASE_S, fvs: BASE_FVS }));
    let px = 0;
    let py = 0;
    let has = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      has = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      has = false;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    function tick() {
      raf = 0;
      // 1) lectures
      const r = root!.getBoundingClientRect();
      const near = has && py > r.top - 220 && py < r.bottom + 220;
      const rects = near ? letters.map((l) => l.getBoundingClientRect()) : null;

      // 2) écritures
      let moving = false;
      for (let i = 0; i < letters.length; i++) {
        let tg = BASE_G;
        let ts = BASE_S;
        if (rects) {
          const lr = rects[i];
          const d = Math.hypot(px - (lr.left + lr.width / 2), (py - (lr.top + lr.height / 2)) * 1.4);
          const k = Math.max(0, 1 - d / 260);
          const e = k * k * (3 - 2 * k); // smoothstep
          tg = BASE_G + e * 400;
          ts = BASE_S - e * 100;
        }
        const st = state[i];
        st.g += (tg - st.g) * 0.12;
        st.s += (ts - st.s) * 0.12;
        if (Math.abs(tg - st.g) < 0.5) st.g = tg;
        if (Math.abs(ts - st.s) < 0.2) st.s = ts;
        const fvs = `"wght" ${st.g.toFixed(1)}, "SOFT" ${st.s.toFixed(1)}`;
        if (fvs !== st.fvs) {
          st.fvs = fvs;
          letters[i].style.fontVariationSettings = fvs;
          moving = true;
        }
      }
      if (moving) raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <span ref={rootRef} className={className}>
      {text.split("").map((ch, i) => (
        <span key={i} style={{ fontVariationSettings: BASE_FVS }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

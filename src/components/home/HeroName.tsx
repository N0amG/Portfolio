"use client";

import { useEffect, useRef } from "react";

const BASE_W = 138;
const BASE_G = 840;
const BASE_FVS = `"wdth" ${BASE_W}, "wght" ${BASE_G}`;

/**
 * Le nom en Anybody variable, rempli d'opale.
 *
 * Performance :
 * — Chaque lettre occupe une boîte de largeur FIXE (glyphe invisible à l'état
 *   de base). Le glyphe visible est posé en absolu par-dessus : quand ses axes
 *   wdth / wght changent, rien ne bouge dans la mise en page (CLS = 0).
 * — La taille de police vient du CSS (.hero-name > h1, en cqw) : pas de mesure JS.
 * — Les positions des lettres sont mesurées une fois (et au redimensionnement) ;
 *   la boucle d'animation ne lit plus le DOM et s'arrête dès que tout est stable.
 * — Le reflet nacré orbite en CSS ; il ne suit la souris que pendant le survol.
 */
export default function HeroName({ lines }: { lines: string[] }) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const boxes = useRef<(HTMLSpanElement | null)[]>([]);
  const glyphs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const maybeRoot = rootRef.current;
    if (!maybeRoot) return;
    const root: HTMLHeadingElement = maybeRoot;
    const boxEls = boxes.current.filter(Boolean) as HTMLSpanElement[];
    const glyphEls = glyphs.current.filter(Boolean) as HTMLSpanElement[];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    // Centres des lettres dans le repère du titre (mis à jour au resize uniquement).
    let centers: [number, number][] = [];

    /** Cale le dégradé de chaque lettre sur le repère du titre : une seule matière continue. */
    const measure = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      centers = boxEls.map((box, i) => {
        const g = glyphEls[i];
        const x = box.offsetLeft + g.offsetLeft;
        const y = box.offsetTop + g.offsetTop;
        g.style.backgroundSize = `${w}px ${h}px`;
        g.style.backgroundPosition = `${-x}px ${-y}px`;
        return [box.offsetLeft + box.offsetWidth / 2, box.offsetTop + box.offsetHeight / 2];
      });
    };

    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    if (reduce) {
      glyphEls.forEach((g) => (g.style.fontVariationSettings = BASE_FVS));
      return () => ro.disconnect();
    }

    const state = glyphEls.map(() => ({ w: 60, g: 380 })); // départ resserré → s'ouvre à l'entrée
    const sheen = { x: 0, y: 0 };
    let px = 0; // pointeur, dans le repère du titre
    let py = 0;
    let tracking = false;
    let raf = 0;
    const start = performance.now();
    const INTRO_DELAY = 250;
    const INTRO_MS = 900;

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const inside = e.clientY > r.top - 140 && e.clientY < r.bottom + 140;
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (inside !== tracking) {
        tracking = inside;
        root.classList.toggle("is-tracking", inside);
        if (inside) {
          sheen.x = px;
          sheen.y = py;
        }
      }
      wake();
    };
    const onLeave = () => {
      if (!tracking) return;
      tracking = false;
      root.classList.remove("is-tracking");
      wake();
    };

    function wake() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick(t: number) {
      raf = 0;
      const elapsed = t - start;
      const intro = Math.min(1, Math.max(0, (elapsed - INTRO_DELAY) / INTRO_MS));
      const span = root.clientWidth * 0.32;
      let moving = intro < 1;

      if (tracking) {
        sheen.x += (px - sheen.x) * 0.12;
        sheen.y += (py - sheen.y) * 0.12;
        root.style.setProperty("--mx", `${sheen.x.toFixed(1)}px`);
        root.style.setProperty("--my", `${sheen.y.toFixed(1)}px`);
        if (Math.abs(px - sheen.x) > 0.5 || Math.abs(py - sheen.y) > 0.5) moving = true;
      }

      glyphEls.forEach((el, i) => {
        let tw = BASE_W;
        let tg = BASE_G;
        if (fine && tracking && centers[i]) {
          const [cx, cy] = centers[i];
          const d = Math.hypot(px - cx, (py - cy) * 1.6);
          const k = Math.max(0, 1 - d / span);
          const e = k * k * (3 - 2 * k); // smoothstep
          tw = 112 + e * 38; // 112 (loin) → 150 (sous le curseur)
          tg = 640 + e * 260;
        } else if (!fine) {
          // tactile : onde lente qui traverse le nom
          const s = Math.sin(elapsed / 1100 - i * 0.55);
          tw = 126 + s * 22;
          tg = BASE_G + s * 60;
          moving = true;
        }
        tw = 60 + (tw - 60) * intro;
        tg = 380 + (tg - 380) * intro;
        const st = state[i];
        st.w += (tw - st.w) * 0.12;
        st.g += (tg - st.g) * 0.12;
        if (Math.abs(tw - st.w) > 0.05 || Math.abs(tg - st.g) > 0.5) moving = true;
        el.style.fontVariationSettings = `"wdth" ${st.w.toFixed(2)}, "wght" ${st.g.toFixed(1)}`;
      });

      if (moving) raf = requestAnimationFrame(tick);
    }

    // Tactile : l'onde ne tourne que lorsque le nom est à l'écran.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) wake();
      else if (!fine) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(root);

    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  let n = 0;
  return (
    <h1 ref={rootRef} className="f-display relative select-none uppercase" aria-label={lines.join(" ")}>
      {lines.map((word, li) => (
        <span
          key={word}
          aria-hidden
          className={`flex overflow-hidden ${li % 2 === 1 ? "justify-end" : "justify-start"}`}
        >
          {word.split("").map((ch, ci) => {
            const idx = n++;
            return (
              <span
                key={ci}
                className="hero-rise inline-block"
                style={{ animationDelay: `${0.08 + li * 0.08 + ci * 0.035}s` }}
              >
                <span
                  ref={(el) => {
                    boxes.current[idx] = el;
                  }}
                  className="relative inline-block"
                >
                  {/* fixe la largeur de la boîte à l'état de base */}
                  <span className="invisible" style={{ fontVariationSettings: BASE_FVS }}>
                    {ch}
                  </span>
                  {/* glyphe visible : déborde librement sans toucher à la mise en page */}
                  <span
                    ref={(el) => {
                      glyphs.current[idx] = el;
                    }}
                    className="opal-text absolute -inset-x-[0.25em] -inset-y-[0.12em] flex items-center justify-center"
                    style={{ fontVariationSettings: BASE_FVS }}
                  >
                    {ch}
                  </span>
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

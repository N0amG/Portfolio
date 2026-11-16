"use client";

import { useEffect, useRef } from "react";

const BASE_W = 138;
const BASE_G = 840;
const BASE_FVS = `"wdth" ${BASE_W}, "wght" ${BASE_G}`;

/**
 * Le nom en Anybody variable, rempli d'opale.
 *
 * — Chaque lettre = une boîte (.hero-box) contenant un glyphe de dimensionnement
 *   invisible (.hero-sizer, à l'état de base) et le glyphe visible (.hero-glyph).
 *   • Tactile : le glyphe visible est en absolu, la boîte garde sa largeur de base,
 *     l'onde ne déplace rien dans la mise en page (CLS = 0).
 *   • Souris (CSS @media (pointer: fine)) : le glyphe repasse dans le flux, sa
 *     largeur réelle pilote la mise en page → la lettre survolée s'élargit et
 *     pousse ses voisines.
 * — Au chargement, les lettres sont déjà à l'état de base (138 / 840) et ne montent
 *   qu'en transform (.hero-rise) : aucun décalage. La taille vient du CSS (cqw).
 * — Chaque frame lit d'abord toutes les positions, puis écrit les styles.
 * — La boucle s'arrête dès que tout est stable ; elle repart au mouvement de la
 *   souris (tactile : seulement quand le nom est à l'écran).
 * — Toutes les lettres partagent un seul dégradé opale (taillé au titre, décalé
 *   lettre par lettre) ; le reflet suit la souris, sinon il orbite en CSS.
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
    const count = glyphEls.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    // Mesures, dans le repère du titre. Les offsets ignorent les transforms ; on les
    // cumule jusqu'au h1 car .hero-rise (transform conservé) est un offsetParent.
    const offsetIn = (el: HTMLElement): [number, number] => {
      let x = 0;
      let y = 0;
      let node: HTMLElement | null = el;
      while (node && node !== root) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return [x, y];
    };
    let rootW = 0;
    let rootH = 0;
    const cx = new Float64Array(count);
    const cy = new Float64Array(count);
    const gx = new Float64Array(count);
    const gy = new Float64Array(count);

    /** Lectures seulement : taille du titre, centres des lettres, origine des glyphes. */
    const read = () => {
      rootW = root.clientWidth;
      rootH = root.clientHeight;
      for (let i = 0; i < count; i++) {
        const box = boxEls[i];
        const g = glyphEls[i];
        const [bl, bt] = offsetIn(box);
        cx[i] = bl + box.offsetWidth / 2;
        cy[i] = bt + box.offsetHeight / 2;
        gx[i] = bl + g.offsetLeft;
        gy[i] = bt + g.offsetTop;
      }
    };

    /** Écritures seulement : cale le dégradé de chaque lettre sur le repère du titre. */
    const writeBackgrounds = () => {
      const size = `${rootW}px ${rootH}px`;
      for (let i = 0; i < count; i++) {
        const s = glyphEls[i].style;
        s.backgroundSize = size;
        s.backgroundPosition = `${-gx[i]}px ${-gy[i]}px`;
      }
    };

    const measure = () => {
      read();
      writeBackgrounds();
    };

    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    if (reduce) {
      glyphEls.forEach((g) => (g.style.fontVariationSettings = BASE_FVS));
      return () => ro.disconnect();
    }

    const state = glyphEls.map(() => ({ w: BASE_W, g: BASE_G, fvs: BASE_FVS }));
    const sheen = { x: 0, y: 0 };
    let clientX = 0; // pointeur, coordonnées fenêtre
    let clientY = 0;
    let hasPointer = false;
    let tracking = false;
    let visible = true;
    let raf = 0;
    const start = performance.now();

    const onMove = (e: PointerEvent) => {
      clientX = e.clientX;
      clientY = e.clientY;
      hasPointer = true;
      wake();
    };
    const onLeave = () => {
      hasPointer = false;
      wake();
    };

    function wake() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick(t: number) {
      raf = 0;
      const elapsed = t - start;

      // 1) Lectures groupées en début de frame.
      let px = 0;
      let py = 0;
      let inside = false;
      if (fine) {
        const r = root.getBoundingClientRect();
        px = clientX - r.left;
        py = clientY - r.top;
        inside = hasPointer && clientY > r.top - 140 && clientY < r.bottom + 140;
        read();
      }
      const span = window.innerWidth * 0.3;

      // 2) Écritures.
      let moving = false;

      if (inside !== tracking) {
        tracking = inside;
        root.classList.toggle("is-tracking", inside);
        if (inside) {
          sheen.x = px;
          sheen.y = py;
        }
      }
      if (tracking) {
        sheen.x += (px - sheen.x) * 0.12;
        sheen.y += (py - sheen.y) * 0.12;
        root.style.setProperty("--mx", `${sheen.x.toFixed(1)}px`);
        root.style.setProperty("--my", `${sheen.y.toFixed(1)}px`);
        if (Math.abs(px - sheen.x) > 0.5 || Math.abs(py - sheen.y) > 0.5) moving = true;
      }

      for (let i = 0; i < count; i++) {
        let tw = BASE_W;
        let tg = BASE_G;
        if (fine) {
          if (tracking) {
            const d = Math.hypot(px - cx[i], (py - cy[i]) * 1.6);
            const k = Math.max(0, 1 - d / span);
            const e = k * k * (3 - 2 * k); // smoothstep
            tw = 92 + e * 58; // 92 (loin) → 150 (sous le curseur)
            tg = 600 + e * 300; // 600 → 900
          }
        } else {
          // tactile : onde lente qui traverse le nom (dans des boîtes fixes)
          const s = Math.sin(elapsed / 1100 - i * 0.55);
          tw = 118 + s * 30;
          tg = BASE_G + s * 60;
          moving = true;
        }
        const st = state[i];
        st.w += (tw - st.w) * 0.09;
        st.g += (tg - st.g) * 0.09;
        if (Math.abs(tw - st.w) < 0.05) st.w = tw;
        if (Math.abs(tg - st.g) < 0.5) st.g = tg;
        const fvs = `"wdth" ${st.w.toFixed(2)}, "wght" ${st.g.toFixed(1)}`;
        if (fvs !== st.fvs) {
          st.fvs = fvs;
          glyphEls[i].style.fontVariationSettings = fvs;
          moving = true; // une frame de plus pour recaler le dégradé sur la mise en page finale
        }
      }

      // Souris : les lettres se déplacent, le dégradé suit (positions lues en 1).
      if (fine) writeBackgrounds();

      if (moving && (fine || visible)) raf = requestAnimationFrame(tick);
    }

    // Tactile : l'onde ne tourne que lorsque le nom est à l'écran.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (fine) return;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(root);

    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

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
                  className="hero-box"
                >
                  {/* tactile : fixe la largeur de la boîte à l'état de base */}
                  <span className="hero-sizer" style={{ fontVariationSettings: BASE_FVS }}>
                    {ch}
                  </span>
                  {/* glyphe visible (absolu sur tactile, dans le flux à la souris) */}
                  <span
                    ref={(el) => {
                      glyphs.current[idx] = el;
                    }}
                    className="hero-glyph opal-text"
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

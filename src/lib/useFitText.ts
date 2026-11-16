"use client";

import { useEffect } from "react";

/**
 * Calcule la taille de police pour que la plus longue des `lines`, rendue en
 * Anybody avec les axes `fvs`, occupe exactement la largeur de `ref`.
 */
export function useFitText(
  ref: React.RefObject<HTMLElement | null>,
  lines: readonly string[],
  fvs: string,
  ratio = 0.985,
) {
  const key = lines.join("|");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const probe = document.createElement("span");
    probe.className = "f-display";
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = `position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;white-space:nowrap;font-size:100px;text-transform:uppercase;font-variation-settings:${fvs}`;
    document.body.appendChild(probe);

    const words = key.split("|");
    const fit = () => {
      const avail = el.clientWidth;
      let widest = 0;
      for (const w of words) {
        probe.textContent = w;
        widest = Math.max(widest, probe.getBoundingClientRect().width);
      }
      if (widest > 0 && avail > 0) el.style.fontSize = `${(avail / widest) * 100 * ratio}px`;
    };

    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      ro.disconnect();
      probe.remove();
    };
  }, [ref, key, fvs, ratio]);
}

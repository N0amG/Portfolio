import { TIER_ORDER, type TierName } from "../quality";
import type { Cost, FrameParams, Layer, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   Registre : sélection des éléments actifs à chaque image et budget de performance.
   - Fenêtre : un élément n'est mis à jour et rendu que si |s − une de ses slides| < 1 (sa slide ± la transition),
     ou, s'il déclare une plage `range` (fin du parcours), que si s est dans cette plage.
   - Budget : au plus 1 élément « lourd » et 2 « moyens » actifs, les plus proches de leur slide d'abord.
   - Décor (qualité automatique) : 0 = tout, 1 = moyens coupés, 2 = légers réduits aussi.
   ─────────────────────────────────────────────────────────── */

export const BUDGET: Record<Cost, number> = { lourd: 1, moyen: 2, leger: Infinity };

export interface Entry {
  el: SceneElement;
  enabled: boolean;
  active: boolean;
  wasActive: boolean;
  /** Dans la fenêtre et autorisé (interrupteur + qualité), avant le budget et la coupe de décor. */
  candidate: boolean;
  d: number;
  slide: number;
}

export function createRegistry(elements: SceneElement[], ctx: SceneContext) {
  const entries: Entry[] = elements.map((el) => ({
    el, enabled: el.enabledByDefault ?? true, active: false, wasActive: false, candidate: false, d: 1, slide: 0,
  }));
  const sorted = entries.slice();
  let decor = 0;
  const activeLayers: Record<Layer, Entry[]> = { sky: [], back: [], front: [] };

  let inited = false;
  function init() {
    if (inited) return;
    inited = true;
    for (const e of entries) e.el.init(ctx);
  }

  /** Choisit les éléments actifs pour la position s et la qualité courante, puis appelle leur update(). */
  function update(f: FrameParams, tier: TierName) {
    const ti = TIER_ORDER.indexOf(tier);
    for (const e of entries) {
      const { slides, range } = e.el;
      if (range) { e.d = f.s >= range[0] && f.s < range[1] ? 0 : Infinity; e.slide = Math.round(f.s); }
      else if (slides === "all") { e.d = 0; e.slide = Math.round(f.s); }
      else {
        e.d = Infinity;
        for (const n of slides) {
          const d = Math.abs(f.s - n);
          if (d < e.d) { e.d = d; e.slide = n; }
        }
      }
      e.candidate = e.enabled && e.d < 1 && ti <= TIER_ORDER.indexOf(e.el.minTier);
      e.active = false;
    }
    sorted.sort((a, b) => a.d - b.d);
    const used: Record<Cost, number> = { lourd: 0, moyen: 0, leger: 0 };
    activeLayers.sky.length = activeLayers.back.length = activeLayers.front.length = 0;
    for (const e of sorted) {
      const c = e.el.cost;
      if (!e.candidate || used[c] >= BUDGET[c] || (c === "moyen" && decor >= 1)) continue;
      used[c]++;
      e.active = true;
      for (const l of e.el.layers) activeLayers[l].push(e);
      f.slide = e.slide;
      f.weight = 1 - e.d;
      f.reduced = c === "leger" && decor >= 2;
      e.el.update(f);
    }
    // éléments DOM : prévenus quand ils entrent ou sortent de la fenêtre active
    for (const e of entries) {
      if (e.active !== e.wasActive) { e.wasActive = e.active; e.el.setActive?.(e.active); }
    }
  }

  function render(layer: Layer) {
    for (const e of activeLayers[layer]) e.el.render(layer, ctx);
  }

  /**
   * Précompilation (chargement) : chaque élément allumé est mis à jour comme s'il était posé sur sa slide (ou au milieu
   * de sa plage), puis rendu une fois. Le moteur remplace alors renderer.render par une compilation asynchrone : rien
   * n'est dessiné, mais tous les programmes sont prêts avant d'entrer dans la fenêtre de l'élément.
   * @param at place la caméra et prépare `f` pour la position s
   * @param layerTarget règle la cible de rendu de la couche (les programmes dépendent de la cible)
   */
  function warmup(f: FrameParams, at: (s: number) => void, layerTarget: (layer: Layer) => void) {
    for (const e of entries) {
      if (!e.enabled) continue;
      const { slides, range } = e.el;
      const s = range ? (range[0] + range[1]) / 2 : slides === "all" ? f.s : slides[0];
      try {
        at(s);
        f.slide = Math.round(s);
        f.weight = 1;
        f.reduced = false;
        e.el.update(f);
        for (const l of e.el.layers) {
          layerTarget(l);
          e.el.render(l, ctx);
        }
      } catch (err) {
        console.warn(`[lab] précompilation de « ${e.el.id} » :`, err);
      }
    }
  }

  return {
    entries,
    init,
    update,
    render,
    warmup,
    has: (layer: Layer) => activeLayers[layer].length > 0,
    decor: {
      level: () => decor,
      set: (n: number) => { decor = Math.max(0, Math.min(2, n)); },
      /** Monter au niveau n sert-il à quelque chose ? (des moyens à couper, des légers à réduire) */
      useful: (n: number) => entries.some((e) => e.candidate && e.el.cost === (n === 1 ? "moyen" : "leger")),
    },
    dispose() {
      if (!inited) return; // moteur détruit avant start() (double montage du mode strict de React)
      inited = false;
      for (const e of entries) e.el.dispose();
    },
  };
}

export type Registry = ReturnType<typeof createRegistry>;

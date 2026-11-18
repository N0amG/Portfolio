import { TAN_HALF } from "../timeline";
import type { FrameParams, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   Effets de composition (lot V1) : pas de couche, ils écrivent dans `f.composite` (uniforms de FINAL_FRAG).
   - 12 · ondes gravitationnelles : anneaux de distorsion qui partent du trou noir à chaque changement de slide ;
   - 13 · flou de mouvement + aberration chromatique, proportionnels à la vitesse apparente de la caméra ;
   - 14 · reflets anamorphiques : traînées horizontales sur les zones très brillantes (à partir du bloom).
   ─────────────────────────────────────────────────────────── */

const noop = () => {};
const base = { slides: "all", cost: "leger", minTier: "basse", layers: [], init: noop, render: noop, dispose: noop } as const;

// ---------------------------------------------------------------------------
// 12 · Ondes gravitationnelles
// ---------------------------------------------------------------------------
interface Ring { age: number; amp: number }

export function createWaves(): SceneElement {
  const P = { amp: 1.0, speed: 0.95, life: 3.2, onArrival: true };
  const rings: Ring[] = [];
  let prevS = 0, moving = false, lastT = -1;

  const spawn = (amp: number) => {
    rings.push({ age: 0, amp });
    if (rings.length > 4) rings.shift();
  };

  return {
    ...base,
    id: "ondes",
    label: "12 · Ondes gravitationnelles",
    update(f: FrameParams) {
      // élément resté inactif un moment (interrupteur, fenêtre) : on repart d'un état propre
      if (lastT < 0 || f.time - lastT > 0.25) { prevS = f.s; moving = false; rings.length = 0; }
      lastT = f.time;
      const now = Math.abs(f.s - prevS) > 1e-5;
      if (now && !moving) spawn(1); // départ d'une transition : onde principale
      if (!now && moving && P.onArrival) spawn(0.55); // arrivée sur la slide : onde plus discrète
      moving = now;
      prevS = f.s;
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].age += f.dt;
        if (rings[i].age > P.life) rings.splice(i, 1);
      }
      const k = f.reduced ? 0.6 : 1;
      rings.forEach((r, i) => {
        const t = r.age / P.life;
        const fade = Math.pow(1 - t, 1.6) * Math.min(1, r.age / 0.12); // attaque courte, extinction lente
        f.composite.waves[i].set(f.bhNdc.x, f.bhNdc.y, f.rhNdc * 0.8 + r.age * P.speed, r.amp * P.amp * fade * k);
      });
    },
    gui(folder) {
      folder.add(P, "amp", 0, 3, 0.05).name("Amplitude");
      folder.add(P, "speed", 0.3, 3, 0.05).name("Vitesse (NDC/s)");
      folder.add(P, "life", 1, 6, 0.1).name("Durée de vie (s)");
      folder.add(P, "onArrival").name("Onde à l'arrivée");
    },
  };
}

// ---------------------------------------------------------------------------
// 13 · Flou de mouvement + aberration chromatique
// ---------------------------------------------------------------------------
export function createMotion(): SceneElement {
  const P = { blur: 1.0, chroma: 0.4, shutter: 0.02 };
  const prevF = { x: 0, y: 0, z: 0 };
  let prevBhX = 0, prevBhY = 0, vx = 0, vy = 0, lastT = -1;

  return {
    ...base,
    id: "mouvement",
    label: "13 · Flou de mouvement + chromatique",
    update(f: FrameParams) {
      const dt = Math.max(f.dt, 1e-3);
      if (lastT < 0 || f.time - lastT > 0.25) {
        prevF.x = f.camF.x; prevF.y = f.camF.y; prevF.z = f.camF.z; prevBhX = f.bhNdc.x; prevBhY = f.bhNdc.y; vx = vy = 0;
      }
      lastT = f.time;
      const aspect = f.width / f.height;
      // déplacement apparent du fond lointain (rotation de la visée) et du trou noir, en NDC/s
      const dx = f.camF.x - prevF.x, dy = f.camF.y - prevF.y, dz = f.camF.z - prevF.z;
      const sx = -(dx * f.camR.x + dy * f.camR.y + dz * f.camR.z) / (TAN_HALF * aspect) / dt;
      const sy = -(dx * f.camU.x + dy * f.camU.y + dz * f.camU.z) / TAN_HALF / dt;
      const bx = (f.bhNdc.x - prevBhX) / dt, by = (f.bhNdc.y - prevBhY) / dt;
      prevF.x = f.camF.x; prevF.y = f.camF.y; prevF.z = f.camF.z; prevBhX = f.bhNdc.x; prevBhY = f.bhNdc.y;
      const k = 1 - Math.exp(-dt * 10);
      vx += (sx + bx * 0.5 - vx) * k;
      vy += (sy + by * 0.5 - vy) * k;
      const sp = Math.min(Math.hypot(vx * aspect, vy), 4); // NDC/s (unités verticales)
      const k2 = f.reduced ? 0.6 : 1;
      if (sp < 0.02) return; // quasi immobile : le shader garde son chemin rapide
      f.composite.motion.set(vx * P.shutter * P.blur * k2, vy * P.shutter * P.blur * k2);
      f.composite.chroma = sp * 0.006 * P.chroma * k2;
    },
    gui(folder) {
      folder.add(P, "blur", 0, 3, 0.05).name("Flou de mouvement");
      folder.add(P, "chroma", 0, 3, 0.05).name("Aberration chromatique");
      folder.add(P, "shutter", 0.01, 0.15, 0.005).name("Obturation (s)");
    },
  };
}

// ---------------------------------------------------------------------------
// 14 · Reflets anamorphiques
// ---------------------------------------------------------------------------
export function createFlare(): SceneElement {
  const P = { intensity: 0.12 };
  return {
    ...base,
    id: "reflets",
    label: "14 · Reflets anamorphiques",
    update(f: FrameParams) {
      f.composite.flare = P.intensity * (f.reduced ? 0.6 : 1);
    },
    gui(folder) {
      folder.add(P, "intensity", 0, 2.5, 0.05).name("Intensité");
    },
  };
}

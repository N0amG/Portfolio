import * as THREE from "three";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";

/* ───────────────────────────────────────────────────────────
   Timeline : keyframes (slides), caméra sur trajectoire et navigation par gestes.
   Une seule valeur animée : cam.s, la position de la caméra en slides (0 = slide 1, 1 = slide 2…).
   Tout le reste (texte, étoiles, lentille) se déduit de cam.s et de la pose de la caméra.
   Unités de scène : rayon de Schwarzschild = 1.
   ─────────────────────────────────────────────────────────── */

export const CAM_DIST = 22.0;
export const TAN_HALF = 0.42; // demi-champ vertical
const SHADOW_B = 2.598; // paramètre d'impact critique (3√3/2)
/** Rayon apparent de l'ombre, en unités NDC verticales. */
export const shadowNdc = (d: number) => Math.tan(Math.asin((SHADOW_B * Math.sqrt(1 - 1 / d)) / d)) / TAN_HALF;

/** Ease de la transition : 0.5 − 0.5·cos(πt), identique au prototype. */
export const TRANSITION_EASE = "sine.inOut";
/** Un nouveau geste commence après au moins GESTURE_GAP ms sans événement molette. */
export const GESTURE_GAP = 220;

// Trajectoire de la caméra (schéma de Noam) : un arrêt par slide, positions sur une sphère autour du trou noir.
//   az = tour horizontal (négatif = à gauche), el = hauteur par rapport au plan du disque (négatif = en dessous),
//   dist = distance au trou noir, look = décalage de la visée vers la droite/gauche (unités de scène).
export const KEYS = [
  { az: 0.0, el: 0.13, dist: 22, look: 0 }, // 1 : vue de base, au-dessus du disque
  { az: -0.6, el: -0.32, dist: 22, look: -2 }, // 2 : dessous, à gauche (le trou noir est à droite du cadre)
  { az: 0.45, el: 0.3, dist: 21, look: 1.5 }, // 3 : dessus, à droite (le trou noir est à gauche du cadre)
  { az: 0.1, el: -0.38, dist: 22, look: 0 }, // 4 : dessous, regard vers le haut
  { az: 0.0, el: 0.13, dist: 22, look: 0 }, // 5 : retour à la vue de base (la planète traversera ici, lot V5)
  // Parcours v2 (SPEC 5 bis) : slides vides pour l'instant, mises en scène par les lots suivants.
  { az: -0.3, el: -0.2, dist: 15, look: 0 }, // 6 : approche, dessous ; le trou noir seul et grand
  { az: 0.25, el: 0.22, dist: 12, look: 0 }, // 7 : plongée, dessus (lot V7)
  { az: -0.15, el: -0.16, dist: 12, look: 0 }, // 8 : point blanc, dessous (lot V7)
  { az: 0.0, el: 0.13, dist: 22, look: 0 }, // 9 : trou blanc, dessus, dézoom (lot V7)
] as const;
/** Index 0-based d'une slide du parcours : S(1) = 0 … S(9) = 8. */
export const S = (n: number) => n - 1;
/** Index de la dernière slide. */
export const LAST_SLIDE = KEYS.length - 1;
const BULGE = 0.9; // ampleur des boucles vers l'extérieur entre deux arrêts
const DEZOOM = 0.32; // recul de la caméra au milieu d'une boucle
const ROLL = 0.14; // inclinaison de la caméra dans les virages (rad)
/** Profondeur des plans de texte devant la caméra (le trou noir est à 22) : forte parallaxe. */
export const TEXT_DEPTH = 7;

const UP = new THREE.Vector3(0, 1, 0);

export interface Pose {
  pos: THREE.Vector3;
  f: THREE.Vector3;
  r: THREE.Vector3;
  u: THREE.Vector3;
  target: THREE.Vector3;
  roll: number;
}
export const makePose = (): Pose => ({
  pos: new THREE.Vector3(),
  f: new THREE.Vector3(),
  r: new THREE.Vector3(),
  u: new THREE.Vector3(),
  target: new THREE.Vector3(),
  roll: 0,
});

/**
 * Pose de la caméra pour une position s (en slides) : interpolation entre deux arrêts, avec une boucle
 * qui s'écarte du trou noir (perpendiculaire au trajet, côté extérieur) et un recul au milieu.
 */
export function cameraPose(s: number, parAz: number, parEl: number, out: Pose): Pose {
  const n = KEYS.length - 1;
  const sc = Math.min(Math.max(s, 0), n);
  const i = Math.min(Math.floor(sc), n - 1),
    t = sc - i;
  const A = KEYS[i],
    B = KEYS[i + 1];
  const bump = Math.sin(Math.PI * t); // 0 aux arrêts, 1 au milieu de la boucle
  const ca = B.az - A.az,
    ce = B.el - A.el,
    len = Math.hypot(ca, ce) || 1;
  let na = -ce / len,
    ne = ca / len;
  if (na * (A.az + B.az) + ne * (A.el + B.el) < 0) {
    na = -na;
    ne = -ne;
  } // toujours vers l'extérieur
  const az = A.az + ca * t + na * BULGE * len * bump + parAz;
  const el = Math.max(-1.2, Math.min(1.2, A.el + ce * t + ne * BULGE * len * bump + parEl));
  const dist = (A.dist + (B.dist - A.dist) * t) * (1 + DEZOOM * bump);
  const look = A.look + (B.look - A.look) * t;
  // la caméra s'incline dans le sens du virage, comme un travelling en courbe
  out.roll = ROLL * bump * Math.sign(ca || 1);
  out.pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist);
  out.f.copy(out.pos).negate().normalize();
  out.r.crossVectors(out.f, UP).normalize();
  out.u.crossVectors(out.r, out.f);
  out.target.copy(out.r).multiplyScalar(look); // visée décalée (le trou noir n'est pas forcément centré)
  out.f.copy(out.target).sub(out.pos).normalize();
  out.r.crossVectors(out.f, UP).normalize();
  out.u.crossVectors(out.r, out.f);
  return out;
}

// ---------------------------------------------------------------------------
// Navigation : un geste (molette, trackpad, clavier) = une slide, quelle que soit son amplitude.
// Les animations se jouent dans le temps ; les gestes pendant une transition sont perdus (pas de file d'attente).
// ---------------------------------------------------------------------------
gsap.registerPlugin(Observer);

export interface NavOptions {
  cam: { s: number };
  /** Index de la dernière slide (les slides vont de 0 à last). */
  last: number;
  duration: () => number;
  onChange: (slide: number, busy: boolean) => void;
}

export function createNavigation({ cam, last, duration, onChange }: NavOptions) {
  let slide = 0,
    busy = false;

  const go = (dir: number) => {
    const next = slide + dir;
    if (busy || next < 0 || next > last) return;
    busy = true;
    onChange(slide, busy);
    // une seule valeur animée : la caméra tourne autour du trou noir ; le texte glisse, se désintègre sur le côté
    // et s'enroule autour de l'horizon ; le bloc suivant arrive par l'autre côté. Le retour est l'exact inverse.
    gsap.to(cam, {
      s: next,
      duration: duration(),
      ease: TRANSITION_EASE,
      onComplete: () => {
        slide = next;
        busy = false;
        onChange(slide, busy);
      },
    });
  };

  // Détection de geste : tant que les événements molette s'enchaînent (scroll long, inertie du trackpad),
  // c'est le même geste : une seule slide.
  let lastWheel = -1e9,
    armed = true;
  const observer = Observer.create({
    target: window,
    type: "wheel",
    preventDefault: true,
    ignore: ".lil-gui",
    onChange: (self) => {
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      const delta = Math.abs(self.deltaX) > Math.abs(self.deltaY) ? self.deltaX : self.deltaY; // molette ou glissé horizontal
      if (Math.abs(delta) < 1) return;
      if (gap > GESTURE_GAP) armed = true;
      if (!armed) return;
      armed = false; // ce geste est consommé, même s'il tombe pendant une transition
      if (!busy) go(delta > 0 ? 1 : -1);
    },
  });

  const onKey = (e: KeyboardEvent) => {
    const t = e.target as Element | null;
    if (e.repeat || t?.closest?.("input, select, textarea, .lil-gui")) return;
    if (["ArrowDown", "ArrowRight", "PageDown", " ", "Spacebar"].includes(e.key)) {
      e.preventDefault();
      go(1);
    } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault();
      go(-1);
    }
  };
  window.addEventListener("keydown", onKey);

  return {
    go,
    state: () => ({ slide, busy }),
    destroy() {
      observer.kill();
      window.removeEventListener("keydown", onKey);
      gsap.killTweensOf(cam);
    },
  };
}

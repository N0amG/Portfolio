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

// Trajectoire de la caméra : un arrêt par slide. Chaque arrêt orbite autour d'un point focal `c` (le trou noir à
//   l'origine par défaut) : az = tour horizontal, el = hauteur par rapport au plan du disque (négatif = en dessous),
//   dist = distance au point focal, look = décalage de la visée vers la droite/gauche (unités de scène).
/** Pas d'azimut entre deux slides (rad) : la caméra tourne toujours dans le même sens. */
const STEP = 2.6;
type Vec3 = readonly [number, number, number];
const sph = (az: number, el: number, d: number): Vec3 => [Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d];
/** 4 · Centre de la nébuleuse (monde) : à 100 du trou noir, point focal de S4. */
export const NEBULA_POS = sph(6.1, 0.35, 100);
/** 6 · Position du pulsar (monde) : à 50 du trou noir, point focal de S4. */
export const PULSAR_POS = sph(4.8, 0.4, 50);
/** Magnétar (monde) : à 65 du trou noir, point focal de S6 (arrivée de la traversée de la nébuleuse). */
export const MAGNETAR_POS = sph(8.0, -0.25, 65);
/** 4 · Point de passage de la traversée de la nébuleuse (S5 → S6) : son centre. */
export const NEBULA_VIA: Vec3 = NEBULA_POS;
/** Traversée : part de la visée donnée à la direction du mouvement, roulis. */
const VIA_LOOK = 0.92, VIA_ROLL = 0.35;
/**
 * Rythme de la traversée (vitesses en unités de scène par seconde, la durée en découle) :
 * départ en douceur sur START, approche à APP, gaz à GAS (lent, constant jusqu'à la sortie), puis accélération
 * progressive jusqu'à EXIT sur RAMP unités, et freinage progressif sur les BRAKE dernières unités.
 * TURN : une rotation de visée d'un radian « compte » comme TURN unités de trajet (le virage final n'est pas brusqué).
 */
const VIA = { START: 18, APP: 26, GAS: 15, EXIT: 52, RAMP: 90, BRAKE: 58, TURN: 32, SPEED: 1.15 }; // SPEED : × toutes les vitesses (+15 %, retour de Noam)
/** Durée de base d'une transition (s), celle de P.absorbDur dans engine.ts. */
const BASE_DUR = 3.2;
/** 4 · Rayon de la sphère englobante de la nébuleuse (défaut du réglage « Rayon » de nebula.ts). */
export const NEBULA_R = 34;
/** Début de l'arrivée en orbite autour de l'objet suivant (fraction de la transition ; la caméra est encore dans le gaz). */
const VIA_ARRIVE = 0.4;
const O: Vec3 = [0, 0, 0];
interface Key { c: Vec3; az: number; el: number; dist: number; look: number; /** la transition vers l'arrêt suivant passe par ce point (monde) */ via?: Vec3 }
export const KEYS: readonly Key[] = [
  // Parcours du 19/11/2026 (retour de Noam sur V4) : trois plans sur le trou noir, puis la nébuleuse au centre (trou noir
  // au loin dans le cadre), puis le pulsar au centre (trou noir au loin), puis retour au trou noir, caméra posée sur le
  // disque juste devant l'horizon. Trajectoire vérifiée : la caméra reste à plus de 40 du centre de la nébuleuse (rayon 34).
  { c: O, az: 0 * STEP, el: 0.13, dist: 22, look: 0 }, // 1 : vue de base, au-dessus du disque
  { c: O, az: 1 * STEP, el: -0.34, dist: 22, look: -2 }, // 2 : dessous (le trou noir est à droite du cadre) ; étoile compagne
  { c: O, az: 2 * STEP, el: 0.32, dist: 21, look: 1.5 }, // 3 : dessus (le trou noir est à gauche du cadre) ; jets
  { c: PULSAR_POS, az: 5.213, el: 0.247, dist: 13, look: 0 }, // 4 : le pulsar au centre ; trou noir à ≈ 19° de l'axe, à 62 (au fond)
  { c: NEBULA_POS, az: 6.939, el: 0.349, dist: 78, look: 0, via: NEBULA_VIA }, // 5 : la nébuleuse au centre ; trou noir à ≈ 25° de l'axe, à 165 (au fond). Vers S6 : traversée de la nébuleuse
  { c: MAGNETAR_POS, az: 8.455, el: -0.268, dist: 14, look: 0 }, // 6 : le magnétar au centre ; trou noir à ≈ 21° de l'axe, à 78 (au fond)
  { c: O, az: 9.255, el: 0.05, dist: 7.5, look: 0 }, // 7 (dernière) : posé sur le disque, juste devant l'horizon : l'ombre fait ≈ 80 % de la hauteur
  // Les slides 7 à 9 (plongée, point blanc, trou blanc) sont retirées depuis le 19/11/2026 (décision de Noam).
];
/** Index 0-based d'une slide du parcours : S(1) = 0 … S(7) = 6. */
export const S = (n: number) => n - 1;
/** Index de la dernière slide. */
export const LAST_SLIDE = KEYS.length - 1;
const BULGE = 0.9; // ampleur des boucles vers l'extérieur entre deux arrêts (× la longueur du trajet)
const BULGE_MAX = 0.75; // plafond (rad) : avec des trajets plus longs, la boucle garde la même amplitude qu'avant
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
/** Durée relative de la transition entre deux slides voisines (la traversée de la nébuleuse est plus longue). */
export const transitionScale = (a: number, b: number) => {
  const i = Math.min(a, b);
  return KEYS[i]?.via ? viaLut(i).T / BASE_DUR : 1;
};
/** Traversée : fraction du temps réel à laquelle la caméra entre dans la nébuleuse (le texte doit avoir disparu avant). */
export const viaEntry = (i: number) => (KEYS[i]?.via ? viaLut(i).entry : 1);

const _pA = new THREE.Vector3(), _pB = new THREE.Vector3(), _tA = new THREE.Vector3(), _tB = new THREE.Vector3();
const _c = new THREE.Vector3(), _v = new THREE.Vector3(), _d = new THREE.Vector3();
const _o = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _qi = new THREE.Quaternion();
/** Pose d'arrêt (sans boucle) : position et point visé. */
function keyPose(K: Key, parAz: number, parEl: number, pos: THREE.Vector3, target: THREE.Vector3) {
  const az = K.az + parAz, el = K.el + parEl;
  pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(K.dist);
  _d.copy(pos).negate().normalize();
  target.crossVectors(_d, UP).normalize().multiplyScalar(K.look).add(_v.set(...K.c));
  pos.add(_v);
}

/** Traversée (arrêt avec `via`) : pose au paramètre géométrique t (0..1) de la courbe. */
function viaPose(A: Key, B: Key, t: number, parAz: number, parEl: number, out: Pose): Pose {
  const via = A.via as Vec3;
  // Traversée : 1re moitié, courbe de Bézier quadratique jusqu'au point `via` ; la caméra regarde progressivement dans
  // le sens du mouvement (elle plonge dans la nébuleuse), avec un roulis de virage.
  // Arrivée (à partir de VIA_ARRIVE) : la caméra garde l'objet d'arrivée en visée et tourne autour de lui en se
  // rapprochant (orbite jusqu'à la pose de l'arrêt suivant, distance en échelle log : rapide puis très lente).
  // Sans ça, la pose du pulsar demandait un demi-tour de 164° en fin de course.
  keyPose(A, parAz, parEl, _pA, _tA);
  keyPose(B, parAz, parEl, _pB, _tB);
  _c.set(...via).multiplyScalar(2).addScaledVector(_pA, -0.5).addScaledVector(_pB, -0.5);
  const u = 1 - t;
  out.pos.copy(_pA).multiplyScalar(u * u).addScaledVector(_c, 2 * t * u).addScaledVector(_pB, t * t);
  _v.copy(_c).sub(_pA).multiplyScalar(2 * u).addScaledVector(_d.copy(_pB).sub(_c), 2 * t).normalize();
  const e = t * t * (3 - 2 * t);
  _d.copy(_tA).lerp(_tB, e).sub(out.pos).normalize();
  const w = VIA_LOOK * Math.pow(Math.sin(Math.PI * t), 0.6);
  out.f.copy(_d).multiplyScalar(1 - w).addScaledVector(_v, w).normalize();
  if (t > VIA_ARRIVE) {
    const k = (t - VIA_ARRIVE) / (1 - VIA_ARRIVE), t0 = VIA_ARRIVE, u0 = 1 - t0;
    _o.set(...B.c);
    // point de départ de l'orbite : la position sur la courbe à t0
    _a.copy(_pA).multiplyScalar(u0 * u0).addScaledVector(_c, 2 * t0 * u0).addScaledVector(_pB, t0 * t0).sub(_o);
    const d0 = _a.length();
    _a.divideScalar(d0);
    _b.copy(_pB).sub(_o);
    const d1 = _b.length();
    _b.divideScalar(d1);
    _q.setFromUnitVectors(_a, _b);
    _qi.identity().slerp(_q, k * k * (3 - 2 * k));
    _a.applyQuaternion(_qi).multiplyScalar(d0 * Math.pow(d1 / d0, 1 - (1 - k) * (1 - k))).add(_o);
    const m = THREE.MathUtils.smoothstep(t, t0, t0 + 0.15);
    out.pos.lerp(_a, m);
    // visée : du sens du mouvement vers l'objet d'arrivée, qui reste ensuite au centre pendant tout le virage
    _d.copy(_tB).sub(out.pos).normalize();
    out.f.lerp(_d, THREE.MathUtils.smoothstep(t, t0, t0 + 0.25)).normalize();
  }
  out.target.copy(out.pos).addScaledVector(out.f, 20);
  out.r.crossVectors(out.f, UP).normalize();
  out.u.crossVectors(out.r, out.f);
  out.roll = VIA_ROLL * Math.sin(Math.PI * t) * Math.sin(Math.PI * t);
  return out;
}

/*
 * Rythme de la traversée : la courbe est échantillonnée (VIA_N points) ; on cumule la longueur de trajet L (distance +
 * VIA.TURN × rotation de visée), on fixe une vitesse v(L) (profil ci-dessus) et on intègre le temps T = ∫ dL / v.
 * Le temps réel de la transition (l'ease de la navigation défait) donne alors directement la position sur la courbe.
 */
const VIA_N = 600;
interface ViaLut { t: Float32Array; T: number; entry: number }
const viaLuts = new Map<number, ViaLut>();
function viaLut(i: number): ViaLut {
  const cached = viaLuts.get(i);
  if (cached) return cached;
  const A = KEYS[i], B = KEYS[i + 1], q = makePose(), pp = new THREE.Vector3(), pf = new THREE.Vector3();
  const nc = new THREE.Vector3(...NEBULA_POS);
  const L = new Float32Array(VIA_N + 1), dn = new Float32Array(VIA_N + 1);
  for (let j = 0; j <= VIA_N; j++) {
    viaPose(A, B, j / VIA_N, 0, 0, q);
    dn[j] = q.pos.distanceTo(nc);
    if (j > 0) L[j] = L[j - 1] + q.pos.distanceTo(pp) + VIA.TURN * Math.acos(Math.min(1, q.f.dot(pf)));
    pp.copy(q.pos);
    pf.copy(q.f);
  }
  // repères : point le plus proche du centre, sortie du gaz (dernier passage sous le rayon)
  let jMin = 0, jExit = 0;
  for (let j = 0; j <= VIA_N; j++) { if (dn[j] < dn[jMin]) jMin = j; if (dn[j] < NEBULA_R) jExit = j; }
  const Ltot = L[VIA_N], Lexit = L[jExit];
  const ss = THREE.MathUtils.smoothstep;
  const speed = (j: number) => {
    let v: number;
    if (j <= jMin) v = THREE.MathUtils.lerp(VIA.APP, VIA.GAS, 1 - ss(dn[j], NEBULA_R * 0.75, NEBULA_R * 1.3));
    else if (j <= jExit) v = VIA.GAS;
    else v = THREE.MathUtils.lerp(VIA.GAS, VIA.EXIT, ss(L[j], Lexit, Lexit + VIA.RAMP));
    // départ et arrêt à accélération constante (v ∝ √distance) : progressifs, sans traîne
    v *= VIA.SPEED * Math.max(0.06, Math.sqrt(Math.min(1, L[j] / VIA.START)));
    v *= Math.max(0.04, Math.sqrt(Math.min(1, (Ltot - L[j]) / VIA.BRAKE)));
    return v;
  };
  const T = new Float32Array(VIA_N + 1);
  let entry = -1;
  for (let j = 1; j <= VIA_N; j++) {
    T[j] = T[j - 1] + (L[j] - L[j - 1]) / (0.5 * (speed(j) + speed(j - 1)));
    if (entry < 0 && dn[j] < NEBULA_R) entry = T[j];
  }
  const lut: ViaLut = { t: new Float32Array(VIA_N + 1), T: T[VIA_N], entry: Math.max(0, entry) / T[VIA_N] };
  for (let j = 0; j <= VIA_N; j++) lut.t[j] = T[j] / T[VIA_N];
  viaLuts.set(i, lut);
  return lut;
}
/** Temps réel normalisé (0..1) → paramètre géométrique t de la courbe. */
function viaWarp(i: number, p: number): number {
  const lut = viaLut(i).t;
  let lo = 0, hi = VIA_N;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (lut[m] < p) lo = m; else hi = m; }
  const a = lut[lo], b = lut[hi];
  return (lo + (b > a ? (p - a) / (b - a) : 0)) / VIA_N;
}

export function cameraPose(s: number, parAz: number, parEl: number, out: Pose): Pose {
  const n = KEYS.length - 1;
  const sc = Math.min(Math.max(s, 0), n);
  const i = Math.min(Math.floor(sc), n - 1),
    t = sc - i;
  const A = KEYS[i],
    B = KEYS[i + 1];
  if (A.via && t > 0 && t < 1) {
    // l'ease sine.inOut de la navigation est défait (temps réel τ) : le rythme vient du profil de vitesse de viaLut()
    const tau = Math.acos(1 - 2 * t) / Math.PI;
    return viaPose(A, B, viaWarp(i, tau), parAz, parEl, out);
  }
  const bump = Math.sin(Math.PI * t); // 0 aux arrêts, 1 au milieu de la boucle
  const ca = B.az - A.az,
    ce = B.el - A.el,
    len = Math.hypot(ca, ce) || 1;
  let na = -ce / len,
    ne = ca / len;
  // la boucle part vers l'extérieur en hauteur (côté opposé au plan du disque) ; l'azimut, lui, avance toujours dans le même sens
  if (ne * (A.el + B.el || 1) < 0) {
    na = -na;
    ne = -ne;
  }
  const bulge = Math.min(BULGE * len, BULGE_MAX);
  const az = A.az + ca * t + na * bulge * bump + parAz;
  const el = Math.max(-1.2, Math.min(1.2, A.el + ce * t + ne * bulge * bump + parEl));
  const dist = (A.dist + (B.dist - A.dist) * t) * (1 + DEZOOM * bump);
  const look = A.look + (B.look - A.look) * t;
  // point focal interpolé (trou noir, nébuleuse ou pulsar) : la caméra voyage d'un objet à l'autre
  const cx = A.c[0] + (B.c[0] - A.c[0]) * t, cy = A.c[1] + (B.c[1] - A.c[1]) * t, cz = A.c[2] + (B.c[2] - A.c[2]) * t;
  // la caméra s'incline dans le sens du virage, comme un travelling en courbe
  out.roll = ROLL * bump * Math.sign(ca || 1);
  out.pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist);
  out.f.copy(out.pos).negate().normalize();
  out.r.crossVectors(out.f, UP).normalize();
  out.u.crossVectors(out.r, out.f);
  out.pos.x += cx; out.pos.y += cy; out.pos.z += cz;
  out.target.copy(out.r).multiplyScalar(look); // visée décalée (l'objet n'est pas forcément centré)
  out.target.x += cx; out.target.y += cy; out.target.z += cz;
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
  /** Durée de la transition de la slide `from` à la slide `to` (s). */
  duration: (from: number, to: number) => number;
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
      duration: duration(slide, next),
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

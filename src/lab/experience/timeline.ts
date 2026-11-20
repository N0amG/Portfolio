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
/**
 * Rayon apparent de l'ombre, en unités NDC verticales. Sous la sphère de photons (d < 1,5), l'ombre dépasse 90° pour un
 * observateur immobile ; `beta` : vitesse de chute de la caméra vers le trou noir (plongée), l'aberration resserre
 * l'ombre vers l'avant (un observateur qui tombe voit encore le ciel tout autour).
 */
export const shadowNdc = (d: number, tanHalf = TAN_HALF, beta = 0) => {
  if (d <= 1.0001) return 100;
  let psi = Math.asin(Math.min(1, (SHADOW_B * Math.sqrt(1 - 1 / d)) / d));
  if (d < 1.5) psi = Math.PI - psi;
  const c = Math.cos(psi), co = (c + beta) / (1 + beta * c);
  const th = Math.acos(Math.max(-1, Math.min(1, co)));
  return th > 1.55 ? 100 : Math.min(100, Math.tan(th) / tanHalf);
};

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
interface Key {
  c: Vec3; az: number; el: number; dist: number; look: number;
  /** la transition vers l'arrêt suivant passe par ce point (monde) */ via?: Vec3;
  /** fin du parcours (lot V7) : la transition vers l'arrêt suivant est la plongée (« dive ») ou le point blanc puis le dézoom depuis le blanc (« emerge ») */
  fin?: "dive" | "emerge";
}
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
  { c: O, az: 9.255, el: 0.05, dist: 7.5, look: 0, fin: "dive" }, // 7 : posé sur le disque, juste devant l'horizon : l'ombre fait ≈ 80 % de la hauteur. Vers S8 : plongée
  // Fin du parcours (lot V7, 20/11/2026) : plongée → trou de ver → noir → point blanc → blanc → dézoom sur le trou blanc → contact.
  // Le trou blanc est le même objet que le trou noir (origine), rendu par le même shader en mode « blanc ».
  { c: O, az: 9.255 + 0.5, el: 0.05, dist: 1.05, look: 0, fin: "emerge" }, // 8 : dans le trou de ver (la caméra est passée sous l'horizon ; le tunnel est rendu en espace écran). Vers S9 : noir, point blanc, dézoom
  { c: O, az: 10.6, el: 0.3, dist: 17, look: 0 }, // 9 : trou blanc au centre, un peu au-dessus du disque (jets façon quasar)
  { c: O, az: 12.2, el: 0.1, dist: 28, look: -9 }, // 10 (dernière) : contact ; trou blanc à droite du cadre, zone libre en bas à gauche pour le texte
];
/** Index 0-based d'une slide du parcours : S(1) = 0 … S(10) = 9. */
export const S = (n: number) => n - 1;
/** Index de la dernière slide. */
export const LAST_SLIDE = KEYS.length - 1;

/* ───────────────────────────────────────────────────────────
   Fin du parcours (lot V7) : paramètres de scène nommés, fonctions de s seulement (réversibles : le retour est
   l'exact inverse). Le shader du trou noir, la composition, le voile et le futur moteur audio lisent ces paramètres.
   - S7 → S8 (t = s − 6, ease de la navigation conservé) : plongée jusqu'à l'horizon (t = HORIZON), noir, puis le
     trou de ver apparaît et ralentit jusqu'à sa vitesse de croisière.
   - S8 → S9 (temps réel, ease défait ; durées en secondes dans FIN.EM, retour de Noam du 20/11/2026) : la caméra
     avance en accélérant dans le tunnel jusqu'au bout (la gorge s'ouvre et le noir de la sortie remplit l'écran),
     noir, un point blanc très lointain qui grandit à peine, puis on s'en approche de plus en plus vite jusqu'à
     l'écran blanc, blanc tenu (bascule sur le trou blanc dessous), puis dézoom lent qui laisse apparaître le trou blanc.
   ─────────────────────────────────────────────────────────── */
export const FIN = {
  /** S7 → S8 : franchissement de l'horizon (fraction de la transition, en s). */
  HORIZON: 0.62,
  /** S7 → S8 : fondu enchaîné de la vue de la chute vers le trou de ver (l'ombre devient la gorge, le ciel déformé
   *  devient les parois), puis entrée dans le tunnel (la gorge se resserre jusqu'à sa taille de croisière) jusqu'à S8. */
  TUNNEL_IN: [0.62, 0.92] as const,
  /** Entrée dans le trou de ver, sans fondu (retour de Noam du 20/11/2026 : « pas de transition en fondu comme
   *  PowerPoint ») : à l'horizon, la vue de la chute devient la texture des parois du tunnel (image identique au moment
   *  de la bascule), puis elle est entraînée le long des parois : elle file vers l'extérieur en s'étirant et sort de
   *  l'écran, pendant que le tunnel monte de la gorge derrière elle. CAP_FLOW : avance de l'écoulement (profondeur) à
   *  la fin de TUNNEL_IN (l'image de la chute laisse place au tunnel entre les profondeurs 20 et 40, dans le shader). */
  CAP_FLOW: 46,
  /** Écoulement de l'image de la chute : départ lent puis accélération exponentielle (taux CAP_K) ; près de la caméra,
   *  la profondeur est très comprimée : une avance constante la chasserait de l'écran en un instant. */
  CAP_K: 6,
  /** Rotation de l'image : le roulis de la chute est poursuivi par le tunnel, toujours dans le même sens, et ralentit
   *  en exponentielle sur SPIN_L (en s) après l'horizon (fonction de s : le retour est l'exact inverse). */
  SPIN_L: 0.2,
  /** Plongée : aberration relativiste (× la vitesse de chute libre depuis la pose de S7), plafond de la vitesse,
   *  surcroît d'éclat de la lumière reçue en fin de chute. */
  ABERR: 1, BETA_MAX: 0.95, DIVE_BRIGHT: 0.15, DISK_FADE: 0.7,
  /** S8 → S9, durées des phases (s, avec la durée de base de 3,2 s) : fin du tunnel (accélération jusqu'au bout), noir,
   *  point blanc lointain, approche de plus en plus rapide, écran blanc, dézoom (sans fondu : le blanc est le cœur du trou blanc). */
  EM: { TUNNEL: 4.5, BLACK: 0.5, FAR: 2, APPROACH: 1.5, WHITE: 1.5, DEZOOM: 4.5 },
  /** Dézoom depuis le blanc (retour de Noam du 20/11/2026 : « 50 % plus lent au début ») : il démarre à SLOW_RATE de sa
   *  vitesse, puis la retrouve progressivement sur SLOW_RAMP s. Le dézoom dure DEZOOM + (1 − SLOW_RATE) · SLOW_RAMP / 2 s. */
  SLOW_RATE: 0.5, SLOW_RAMP: 2,
  /** Fin du tunnel : vitesse d'écoulement atteinte au bout (× la croisière) ; rayon final de la gorge (couvre l'écran). */
  TUNNEL_TOP: 14, THROAT_END: 2.4,
  /** Rayon du point blanc (NDC verticales) : à sa naissance, puis à la fin de la phase lointaine ; ensuite il couvre l'écran. */
  POINT_R0: 0.0035, POINT_R1: 0.011,
  /** Durée relative de la plongée (× la durée de base de 3,2 s). */
  DIVE_DUR: 1.6,
  /** Plongée : distance au franchissement de l'horizon, tour pris pendant la chute (rad), roulis, élargissement du champ. */
  DIVE_R: 1.12, SWIRL: 0.5, ROLL: 0.5, FOV: 1.6,
  /** Plongée : la caméra monte au-dessus du plan du disque en tombant (rad) : de dedans, le plasma remplirait tout le pourtour. */
  DIVE_EL: 0.55,
  /** Dézoom : distance de départ (l'horizon blanc couvre l'écran), tour et roulis défaits pendant le recul. */
  EMERGE_R: 1.75, EMERGE_SWIRL: 0.35,
};
/** Index de la slide de départ de la plongée (S7) et du point blanc (S8). */
const DIVE_I = KEYS.findIndex((k) => k.fin === "dive");
const EMERGE_I = KEYS.findIndex((k) => k.fin === "emerge");
const unease = (t: number) => Math.acos(1 - 2 * Math.min(1, Math.max(0, t))) / Math.PI; // sine.inOut défait : temps réel
const ease = (tau: number) => (1 - Math.cos(Math.PI * tau)) / 2;
const lerpLog = (a: number, b: number, k: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * k);
/**
 * Plongée (t = s − 6) : distance de la caméra et vitesse de chute β (chute libre depuis le repos à la pose de S7,
 * mesurée par un observateur immobile : β² = (1/d − 1/d0) / (1 − 1/d0)), qui donne l'aberration de la vue.
 */
function diveState(t: number) {
  const A = KEYS[DIVE_I], B = KEYS[DIVE_I + 1], H = FIN.HORIZON;
  const d = t < H ? lerpLog(A.dist, FIN.DIVE_R, Math.pow(t / H, 1.6)) : FIN.DIVE_R + (B.dist - FIN.DIVE_R) * sstep(H, 1, t);
  const d0 = A.dist;
  const beta = Math.min(FIN.BETA_MAX, FIN.ABERR * Math.sqrt(Math.max(0, (1 / d - 1 / d0) / (1 - 1 / d0))));
  return { d, beta };
}
/**
 * Bord de l'ombre tel que le shader du trou noir le rend (même intégration des rayons, aberration comprise) : angle
 * (rad) depuis l'axe caméra → trou noir, par dichotomie sur la limite capture / fuite. Sert à la plongée : de près et
 * avec l'aberration, l'estimation analytique (shadowNdc) s'écarte du rendu.
 */
function shaderShadowAngle(d: number, beta: number): number {
  const captured = (th: number) => {
    const co = Math.cos(th), cs = (co - beta) / (1 - beta * co), sn = Math.sqrt(Math.max(0, 1 - cs * cs));
    let px = d, py = 0, vx = -cs, vy = sn; // caméra sur l'axe x, visée vers −x, rayon dans le plan xy
    const h2 = (px * vy - py * vx) ** 2;
    for (let i = 0; i < 200; i++) {
      const r = Math.hypot(px, py);
      const dt = Math.min(1.5, Math.max(0.02, 0.07 * r));
      const k = (-1.5 * h2 / r ** 5) * dt;
      vx += k * px; vy += k * py;
      px += vx * dt; py += vy * dt;
      const r2 = Math.hypot(px, py);
      if (r2 < 1) return true;
      if (r2 > 16 && px * vx + py * vy > 0) return false;
    }
    return false;
  };
  if (!captured(1e-4)) return 0;
  let lo = 1e-4, hi = Math.PI * 0.75;
  for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (captured(m)) lo = m; else hi = m; }
  return lo;
}
/** Plongée : champ de base (il s'élargit pendant la chute, se resserre sous le tunnel). */
const diveFovBase = (t: number) => {
  const H = FIN.HORIZON;
  return TAN_HALF * (1 + FIN.FOV * (t < H ? sstep(0, H, t) : 1 - sstep(H, 1, t)));
};
/**
 * Plongée : champ et rayon apparent de l'ombre, échantillonnés jusqu'à la fin du fondu vers le trou de ver.
 * Retour de Noam (20/11/2026) : l'ombre rétrécit d'abord (dézoom de la distorsion, gardé), puis grandit, puis
 * rétrécissait de nouveau juste avant le trou de ver (la vitesse de chute monte à 0,94 c), d'où un à-coup. Passé son
 * premier minimum, son rayon apparent ne diminue plus : le champ se resserre juste ce qu'il faut pour le tenir.
 */
const DIVE_N = 200;
let diveLut: { tan: Float32Array; R: Float32Array; tEnd: number } | null = null;
function diveView(t: number) {
  if (!diveLut) {
    const tEnd = FIN.TUNNEL_IN[1];
    const tan = new Float32Array(DIVE_N + 1), R = new Float32Array(DIVE_N + 1), th = new Float32Array(DIVE_N + 1);
    for (let j = 0; j <= DIVE_N; j++) {
      const tj = (tEnd * j) / DIVE_N, ds = diveState(tj);
      th[j] = shaderShadowAngle(ds.d, ds.beta);
      tan[j] = diveFovBase(tj);
      R[j] = Math.tan(th[j]) / tan[j];
    }
    let i0 = 0;
    while (i0 < DIVE_N && R[i0 + 1] <= R[i0] + 1e-6) i0++;
    let m = R[i0];
    for (let j = i0; j <= DIVE_N; j++) {
      if (R[j] < m) { tan[j] = Math.tan(th[j]) / m; R[j] = m; } else m = R[j];
    }
    diveLut = { tan, R, tEnd };
  }
  const L = diveLut, x = (Math.min(Math.max(t, 0), L.tEnd) / L.tEnd) * DIVE_N;
  const j = Math.min(DIVE_N - 1, Math.floor(x)), f = x - j;
  return { tanHalf: L.tan[j] + (L.tan[j + 1] - L.tan[j]) * f, shadow: L.R[j] + (L.R[j + 1] - L.R[j]) * f, tEnd: L.tEnd };
}
/**
 * Rotation de l'image pendant la plongée et l'entrée dans le tunnel (t = s − 6) : le roulis de la caméra
 * (FIN.ROLL · e², e = (t / H)^1,6) jusqu'à l'horizon, puis la même vitesse qui décroît en exponentielle (sur SPIN_L) :
 * toujours dans le même sens, sans arrêt brusque ni retour.
 */
function spinAt(t: number) {
  const H = FIN.HORIZON;
  if (t <= H) return FIN.ROLL * Math.pow(t / H, 3.2);
  const rate = (FIN.ROLL * 3.2) / H; // dérivée du roulis à l'horizon (rad par unité de s)
  return FIN.ROLL + rate * FIN.SPIN_L * (1 - Math.exp(-(t - H) / FIN.SPIN_L));
}
/** s de la bascule plongée → trou de ver (l'image de la chute y est capturée pour les parois du tunnel). */
export const FIN_CAPTURE_S = DIVE_I + FIN.HORIZON;
/** Rotation de l'image à l'horizon (référence de l'image capturée). */
export const FIN_SPIN_H = FIN.ROLL;
/** S8 → S9 : repères en temps réel normalisé τ (0..1), déduits des durées de FIN.EM. */
const EMT = (() => {
  const e = FIN.EM, T = e.TUNNEL + e.BLACK + e.FAR + e.APPROACH + e.WHITE + e.DEZOOM + (1 - FIN.SLOW_RATE) * FIN.SLOW_RAMP / 2;
  const cut = e.TUNNEL / T, point = cut + e.BLACK / T, near = point + e.FAR / T, full = near + e.APPROACH / T;
  const dz = full + e.WHITE / T;
  return { T, cut, point, near, full, switch: (full + dz) / 2, dz };
})();
/**
 * Dézoom depuis le blanc : progression 0 → 1 (départ et arrivée au repos) pour le temps réel normalisé τ de S8 → S9.
 * Le temps du dézoom est ralenti au début : vitesse SLOW_RATE, qui remonte à 1 sur SLOW_RAMP s (sans à-coup).
 */
function emergeAt(tau: number) {
  const x = Math.max(0, (tau - EMT.dz) * EMT.T); // secondes depuis le début du dézoom
  const R = FIN.SLOW_RATE, L = FIN.SLOW_RAMP;
  const u = Math.min(1, x / L);
  const ramp = x < L ? L * (u * u * u - (u * u * u * u) / 2) : L / 2 + (x - L); // ∫ smoothstep
  return sstep(0, 1, (R * x + (1 - R) * ramp) / FIN.EM.DEZOOM);
}
/** Plages de s des trois éléments lourds de la fin (jamais deux actifs en même temps : le noir et le blanc servent de coupures). */
export const FIN_RANGES = {
  dive: [DIVE_I, DIVE_I + FIN.HORIZON] as const,
  tunnel: [DIVE_I + FIN.HORIZON, EMERGE_I + ease(EMT.cut)] as const,
  white: [EMERGE_I + ease(EMT.cut), KEYS.length] as const,
};

export interface Finale {
  /** Plongée (S7 → S8) : 0 → 1 jusqu'au franchissement de l'horizon. */
  dive: number;
  /** Traînées de lumière radiales (l'anneau de photons éclate ; convergent à nouveau pendant le dézoom) : 0..1. */
  streak: number;
  /** Bleuissement de la lumière reçue pendant la chute : 0..1. */
  blue: number;
  /** Aberration chromatique de la plongée et du dézoom (s'ajoute à celle du mouvement). */
  chroma: number;
  /** Trou de ver : visibilité (0 = inactif) et vitesse d'écoulement (× la vitesse de croisière). */
  tunnel: number;
  tunnelSpeed: number;
  /** Trou de ver : arrivée au bout (0..1) ; la gorge s'ouvre jusqu'à couvrir l'écran de noir. */
  tunnelEnd: number;
  /** Trou de ver : entrée (1 au début du fondu : la gorge a la taille de l'ombre, 0 : taille de croisière). */
  tunnelIntro: number;
  /** Entrée dans le trou de ver : l'image de la chute (capturée à l'horizon) sert de texture aux parois (1 = active)… */
  capture: number;
  /** … et avance le long des parois de capFlow (profondeur) depuis l'horizon. */
  capFlow: number;
  /** Rotation de l'image (rad) : roulis de la caméra pendant la chute, poursuivi dans le même sens par le tunnel. */
  spin: number;
  /** Plongée : surcroît d'éclat de la lumière reçue (l'aberration elle-même suit la caméra : Pose.beta). */
  bright: number;
  /** Plongée : atténuation du disque en fin de chute (0..1 ; il passe derrière nous, le ciel déformé prend le relais). */
  diskFade: number;
  /** Voile noir (0..1) ; 1 = noir total (rien n'est rendu dessous). */
  black: number;
  /** Rayon du point blanc (NDC verticales ; 0 = absent). */
  point: number;
  /** Voile blanc (0..1). */
  white: number;
  /** Mode trou blanc du shader (0 ou 1 ; bascule sous l'écran blanc). */
  whiteHole: number;
  /** Dézoom depuis le blanc : 0 → 1 (posé sur S9). */
  emerge: number;
  /** Son (lot F1) : 1 du noir au point blanc. Front montant = coupure nette du son (silence voulu de la plongée). */
  silence: number;
  /** Son (lot F1) : enveloppe de la note aiguë du point blanc (attaque à sa naissance, décroît pendant qu'il grandit). */
  note: number;
}
export const makeFinale = (): Finale => ({
  dive: 0, streak: 0, blue: 0, chroma: 0, tunnel: 0, tunnelSpeed: 1, tunnelEnd: 0, tunnelIntro: 0, capture: 0, capFlow: 0, spin: 0, bright: 0, diskFade: 0, black: 0, point: 0, white: 0, whiteHole: 0, emerge: 0, silence: 0, note: 0,
});
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Paramètres de la fin du parcours pour la position s (en slides). */
export function finale(s: number, o: Finale): Finale {
  o.dive = o.streak = o.blue = o.chroma = o.tunnel = o.tunnelEnd = o.tunnelIntro = o.capture = o.capFlow = o.spin = o.bright = o.diskFade = o.black = o.point = o.white = o.whiteHole = o.emerge = o.silence = o.note = 0;
  o.tunnelSpeed = 1;
  if (s <= DIVE_I) return o;
  if (s >= EMERGE_I) o.spin = spinAt(1);
  if (s < EMERGE_I) {
    const t = s - DIVE_I, H = FIN.HORIZON;
    // pas de noir : la vue de la chute (ciel déformé par l'aberration autour de l'ombre) se fond dans le trou de ver
    const k = Math.min(1, t / H);
    o.dive = k;
    o.blue = sstep(0.05, 0.9, k);
    o.bright = FIN.DIVE_BRIGHT * k * k;
    o.diskFade = FIN.DISK_FADE * sstep(0.55, 1, k);
    o.chroma = 0.035 * k * k;
    // naissance des traits de lumière (ils ne disparaissent qu'en sortant de l'écran : voir la composition finale)
    o.streak = sstep(0.3, 1, k) * (1 - sstep(FIN.TUNNEL_IN[0], FIN.TUNNEL_IN[1], t));
    o.spin = spinAt(t);
    if (t >= H) {
      // bascule nette à l'horizon (pas de fondu) : le tunnel reprend l'image de la chute sur ses parois
      o.tunnel = 1;
      const u = Math.min(1, (t - H) / (FIN.TUNNEL_IN[1] - H));
      o.capture = u < 1 ? 1 : 0;
      o.capFlow = (FIN.CAP_FLOW * (Math.exp(FIN.CAP_K * u) - 1)) / (Math.exp(FIN.CAP_K) - 1);
      const j = (t - H) / (1 - H);
      o.tunnelIntro = 1 - sstep(FIN.TUNNEL_IN[1], 1, t); // la gorge garde la taille de l'ombre pendant tout le fondu (pas de dézoom)
      o.tunnelSpeed = 1 + 5 * Math.pow(1 - j, 2); // il part lancé (la chute continue), puis ralentit jusqu'à la croisière
      o.blue = 1;
      o.chroma = 0.012 + 0.023 * (1 - j);
    }
    return o;
  }
  if (s < EMERGE_I + 1) {
    const tau = unease(s - EMERGE_I);
    if (tau < EMT.cut) {
      // la caméra avance en accélérant jusqu'au bout du tunnel : la gorge s'ouvre et son noir remplit l'écran
      const k = tau / EMT.cut;
      o.tunnel = 1;
      o.tunnelSpeed = 1 + (FIN.TUNNEL_TOP - 1) * k * k;
      o.tunnelEnd = Math.pow(k, 2.5);
      o.blue = 1;
      o.streak = 0.7 * k * k; // traits de vitesse
      o.chroma = (0.012 + 0.03 * k) * (1 - o.tunnelEnd); // pas d'irisation sur le bord de la sortie
      o.black = sstep(0.96, 1, k); // garantit le noir total à la sortie
      return o;
    }
    if (tau < EMT.switch) {
      o.black = 1;
      o.silence = tau < EMT.point ? 1 : 0;
      if (tau >= EMT.point) {
        const r0 = FIN.POINT_R0, r1 = FIN.POINT_R1;
        if (tau < EMT.near) {
          // très lointain : il grandit à peine
          const k = (tau - EMT.point) / (EMT.near - EMT.point);
          o.point = r0 * Math.pow(r1 / r0, k);
          o.note = sstep(0, 0.05, k) * (1 - 0.5 * k);
        } else {
          // on s'en approche de plus en plus vite, jusqu'à l'écran blanc
          const k = Math.min(1, (tau - EMT.near) / (EMT.full - EMT.near));
          o.point = r1 * Math.pow(2.2 / r1, k * k);
          o.note = 0.5 * (1 - k);
          o.white = sstep(0.92, 1, k);
        }
      }
      return o;
    }
    o.whiteHole = 1;
    if (tau < EMT.dz) { o.white = 1; return o; } // écran blanc tenu
    // dézoom lent, qui part et arrive au repos. Pas de fondu : au départ, la caméra est si près du cœur de l'horizon
    // (rendu en blanc pur) qu'il remplit l'écran, le contour bleu juste au-delà des bords ; on recule doucement.
    o.emerge = emergeAt(tau);
    return o;
  }
  o.whiteHole = 1;
  o.emerge = 1;
  return o;
}
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
  /** Demi-champ vertical (tan) : TAN_HALF, sauf pendant la plongée et le dézoom (champ élargi). */
  tanHalf: number;
  /** Vitesse de chute vers le trou noir (fraction de c) : aberration relativiste de la vue (0 hors de la plongée). */
  beta: number;
  /** Rayon apparent de l'ombre (NDC verticales) quand il est connu mieux que par shadowNdc (plongée) ; 0 = shadowNdc. */
  shadow: number;
}
export const makePose = (): Pose => ({
  pos: new THREE.Vector3(),
  f: new THREE.Vector3(),
  r: new THREE.Vector3(),
  u: new THREE.Vector3(),
  target: new THREE.Vector3(),
  roll: 0,
  tanHalf: TAN_HALF,
  beta: 0,
  shadow: 0,
});

/**
 * Pose de la caméra pour une position s (en slides) : interpolation entre deux arrêts, avec une boucle
 * qui s'écarte du trou noir (perpendiculaire au trajet, côté extérieur) et un recul au milieu.
 */
/** Durée relative de la transition entre deux slides voisines (la traversée de la nébuleuse est plus longue). */
export const transitionScale = (a: number, b: number) => {
  const i = Math.min(a, b);
  if (KEYS[i]?.fin) return KEYS[i].fin === "dive" ? FIN.DIVE_DUR : EMT.T / BASE_DUR;
  return KEYS[i]?.via ? viaLut(i).T / BASE_DUR : 1;
};
/** Vrai si la transition qui part de la slide i est une traversée (`via`). */
export const hasVia = (i: number) => !!KEYS[i]?.via;
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

/*
 * Fin du parcours : poses de la plongée (S7 → S8) et du dézoom depuis le blanc (S8 → S9), autour de l'origine.
 * La pose est celle d'un arrêt (keyPose) dont la distance, l'azimut, le roulis et le champ varient : continues aux deux
 * bouts (égales aux arrêts de KEYS), et les sauts éventuels tombent sous le noir ou le blanc.
 */
const _fk: Key = { c: O, az: 0, el: 0, dist: 1, look: 0 };
function finPose(A: Key, B: Key, t: number, parAz: number, parEl: number, out: Pose): Pose {
  _fk.c = A.c; _fk.look = 0;
  if (A.fin === "dive") {
    const H = FIN.HORIZON;
    const ds = diveState(t);
    out.beta = ds.beta;
    _fk.dist = ds.d;
    if (t < H) {
      // chute qui accélère (en échelle log de la distance), la caméra tourne avec le disque, s'incline, le champ s'élargit
      const k = t / H, e = Math.pow(k, 1.6);
      _fk.az = A.az + FIN.SWIRL * e * e;
      out.roll = FIN.ROLL * e * e; // (= spinAt(t))
    } else {
      // sous l'horizon (le trou de ver est rendu en espace écran) : on rejoint la pose de S8
      const j = sstep(H, 1, t);
      _fk.az = A.az + FIN.SWIRL + (B.az - A.az - FIN.SWIRL) * j;
      out.roll = spinAt(t); // le roulis continue dans le même sens (ne se défait plus)
    }
    // champ : élargi pendant la chute, l'ombre ne rétrécit plus une fois qu'elle grandit (diveView) ; après le fondu,
    // sous le tunnel, il revient à TAN_HALF
    const v = diveView(t);
    out.shadow = v.shadow; // (au-delà du fondu : la valeur de sa fin, d'où part la gorge du tunnel)
    out.tanHalf = t <= v.tEnd ? v.tanHalf : v.tanHalf + (TAN_HALF - v.tanHalf) * sstep(v.tEnd, 1, t);
    // elle tombe en montant au-dessus du plan du disque (le ciel déformé reste visible), puis revient sous le tunnel
    _fk.el = t < H
      ? A.el + FIN.DIVE_EL * sstep(0.15, 0.85, t / H)
      : A.el + FIN.DIVE_EL * (1 - sstep(FIN.TUNNEL_IN[1], 1, t)) + (B.el - A.el) * sstep(H, 1, t);
  } else {
    const tau = unease(t);
    if (tau < EMT.switch) {
      // dans le tunnel, puis sous le noir et le blanc : la caméra reste à la pose de S8
      _fk.dist = A.dist; _fk.az = A.az; _fk.el = A.el;
      out.roll = 0;
      out.tanHalf = TAN_HALF;
    } else {
      // dézoom depuis le blanc : recul lent depuis le cœur blanc de l'horizon, champ qui se resserre, tour défait
      // (posée au départ du dézoom sous le blanc tenu, puis recul lent qui part et arrive au repos)
      const e = emergeAt(tau);
      _fk.dist = lerpLog(FIN.EMERGE_R, B.dist, e);
      _fk.az = B.az - FIN.EMERGE_SWIRL * (1 - e) * (1 - e);
      _fk.el = B.el;
      out.roll = 0; // recul droit, calme
      out.tanHalf = TAN_HALF * (1 + FIN.FOV * (1 - e) * (1 - e));
    }
  }
  keyPose(_fk, parAz, parEl, out.pos, out.target);
  out.f.copy(out.target).sub(out.pos).normalize();
  out.r.crossVectors(out.f, UP).normalize();
  out.u.crossVectors(out.r, out.f);
  return out;
}

export function cameraPose(s: number, parAz: number, parEl: number, out: Pose): Pose {
  const n = KEYS.length - 1;
  const sc = Math.min(Math.max(s, 0), n);
  const i = Math.min(Math.floor(sc), n - 1),
    t = sc - i;
  const A = KEYS[i],
    B = KEYS[i + 1];
  out.tanHalf = TAN_HALF;
  out.beta = 0;
  out.shadow = 0;
  if (A.fin && t > 0 && t < 1) return finPose(A, B, t, parAz, parEl, out);
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
    /** Pose directement la caméra sur une slide, sans transition (dev : ?slide=N). */
    jump(n: number) {
      gsap.killTweensOf(cam);
      slide = Math.max(0, Math.min(last, Math.round(n)));
      cam.s = slide;
      busy = false;
      onChange(slide, busy);
    },
    state: () => ({ slide, busy }),
    destroy() {
      observer.kill();
      window.removeEventListener("keydown", onKey);
      gsap.killTweensOf(cam);
    },
  };
}

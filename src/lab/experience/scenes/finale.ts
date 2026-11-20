import * as THREE from "three";
import { FIN, FIN_RANGES, FIN_SPIN_H, S } from "../timeline";
import { createJetRenderer } from "./jets";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   Fin du parcours (lot V7) : trois éléments 🔴, jamais deux actifs en même temps.
   Ils ne déclarent pas de fenêtre slide ± 1 mais une plage de s (FIN_RANGES, timeline.ts), bornée par les coupures :
   l'horizon (noir) entre la plongée et le trou de ver, le noir total entre le trou de ver et le point blanc,
   l'écran blanc entre le point blanc et le trou blanc (qui comprend le point blanc et le contact).
   Les paramètres nommés viennent de `f.fin` (finale() dans timeline.ts) ; les éléments les traduisent en uniforms
   du shader du trou noir (`f.bh.dive`, `.tunnel`, `.white`), en effets de composition (`f.composite.streak`,
   `.chroma`) et en voile (`f.composite.veil` : noir, point blanc, blanc).
   Qualité automatique : tout passe par le shader du trou noir (résolution interne, pas d'intégration et octaves du
   niveau) et la composition (nombre de prises des traînées selon le niveau) ; minTier « basse » : la fin du
   parcours n'est jamais coupée, seulement allégée.
   ─────────────────────────────────────────────────────────── */

const noop = () => {};

/** Voile : on garde le plus fort des demandes (plusieurs effets peuvent en poser). */
function veil(f: FrameParams, black: number, white = 0, point = 0, note = 0) {
  const v = f.composite.veil;
  v.set(Math.max(v.x, black), Math.max(v.y, white), Math.max(v.z, point), Math.max(v.w, note));
}

// ---------------------------------------------------------------------------
// 2 · Plongée (S7 → S8, jusqu'à l'horizon)
// ---------------------------------------------------------------------------
export function createDive(): SceneElement {
  const P = { streak: 0.6, blue: 1, bright: 1, chroma: 1 };
  return {
    id: "plongee",
    label: "2 · Plongée (S7 → S8)",
    slides: [S(7)],
    range: FIN_RANGES.dive,
    cost: "lourd",
    minTier: "basse",
    layers: [],
    init: noop,
    update(f: FrameParams) {
      const F = f.fin;
      // la lumière qui tombe avec nous : bleuie et plus brillante à l'approche de l'horizon
      // (l'aberration du ciel suit la caméra : Pose.beta, appliquée par le moteur)
      f.bh.dive.set(F.blue * P.blue, F.bright * P.bright, F.diskFade, 0);
      // l'anneau de photons éclate en traînées, aberration chromatique croissante
      f.composite.streak = Math.max(f.composite.streak, F.streak * P.streak);
      f.composite.chroma += F.chroma * P.chroma;
    },
    render: noop,
    dispose: noop,
    gui(folder) {
      folder.add(P, "streak", 0, 1, 0.01).name("Traînées (longueur)");
      folder.add(P, "blue", 0, 1, 0.01).name("Bleuissement");
      folder.add(P, "bright", 0, 3, 0.05).name("Surcroît d'éclat");
      folder.add(P, "chroma", 0, 3, 0.05).name("Aberration chromatique");
    },
  };
}

// ---------------------------------------------------------------------------
// 2 · Trou de ver (fin de S7 → S8, S8, début de S8 → S9 jusqu'à la coupure au noir)
// ---------------------------------------------------------------------------
export function createWormhole(): SceneElement {
  const P = { speed: 2.2, twist: 0.35, throat: 0.075, breathe: 0.08, bend: 0.22, bright: 1, streak: 0.6, chroma: 1 };
  let phase = 0;
  return {
    id: "trou-de-ver",
    label: "2 · Trou de ver (S8)",
    slides: [S(8)],
    range: FIN_RANGES.tunnel,
    cost: "lourd",
    minTier: "basse",
    layers: [],
    init: noop,
    update(f: FrameParams) {
      const F = f.fin;
      // écoulement continu ; il sort du noir lancé, ralentit, puis s'emballe juste avant la coupure
      phase += f.dt * P.speed * F.tunnelSpeed;
      if (phase > 4000) phase -= 4000; // précision du shader (la coordonnée d'écoulement reste petite)
      // gorge : à l'entrée, elle a la taille de l'ombre vue pendant la chute (puis se resserre jusqu'à la croisière) ;
      // au bout du tunnel, elle s'ouvre jusqu'à couvrir l'écran (sa sortie est noire)
      const throat = P.throat * (1 + P.breathe * Math.sin(f.time * 1.3));
      let rE = throat * Math.pow(FIN.THROAT_END / throat, F.tunnelEnd);
      if (F.tunnelIntro > 0) rE *= Math.pow(Math.min(f.rhNdc, FIN.THROAT_END) / rE, F.tunnelIntro);
      f.bh.tunnel.set(Math.max(1e-4, F.tunnel), phase, P.twist, rE);
      // l'axe du tunnel se courbe vers la souris (et se redresse aux deux bouts) ; z = intérieur de la gorge noir
      const b = P.bend * (1 - F.tunnelEnd) * (1 - F.tunnelIntro);
      f.bh.tunnelBend.set(f.mouse.x * b, -f.mouse.y * b, Math.max(F.tunnelEnd, F.tunnelIntro), P.bright);
      // rotation : celle de la chute, poursuivie dans le même sens (elle ralentit jusqu'à S8, sans jamais repartir en arrière)
      f.bh.tunnelSpin.value = F.spin;
      // entrée : la vue de la chute (capturée à l'horizon par le moteur) sert de texture aux parois et file vers l'extérieur
      if (F.capture > 0) f.bh.cap.set(1, Math.min(f.rhNdc, FIN.THROAT_END), F.capFlow, f.bh.tunnelSpin.value - FIN_SPIN_H);
      f.composite.streak = Math.max(f.composite.streak, F.streak * P.streak);
      f.composite.chroma += F.chroma * P.chroma;
      veil(f, F.black);
    },
    render: noop,
    dispose: noop,
    gui(folder) {
      folder.add(P, "speed", 0, 8, 0.05).name("Vitesse d'écoulement");
      folder.add(P, "twist", -1.5, 1.5, 0.01).name("Torsion");
      folder.add(P, "throat", 0, 0.3, 0.005).name("Gorge (anneau d'Einstein)");
      folder.add(P, "breathe", 0, 0.5, 0.01).name("Respiration de la gorge");
      folder.add(P, "bend", 0, 0.8, 0.01).name("Courbure (souris)");
      folder.add(P, "bright", 0.1, 3, 0.05).name("Éclat");
      folder.add(P, "streak", 0, 1, 0.01).name("Traînées (entrée)");
      folder.add(P, "chroma", 0, 3, 0.05).name("Aberration chromatique");
    },
  };
}

// ---------------------------------------------------------------------------
// 3 · Point blanc → trou blanc (+ jets façon quasar), jusqu'au contact (S10)
// ---------------------------------------------------------------------------
export function createWhiteHole(): SceneElement {
  const P = { flow: 0.35, horizon: 1, halo: 1, jets: true };
  // jets du quasar : mêmes jets que 11, plus longs, plus larges et plus rapides
  const jets = createJetRenderer({ length: 60, base: 1.6, width: 0.28, open: 0.035, twist: 0.2, bright: 2.2, knots: 11, knotSpeed: 0.8, decay: 1.0, beta: 0.8, beamP: 2.2 });
  let jetFade = 0;
  return {
    id: "trou-blanc",
    label: "3 · Point blanc → trou blanc (S9, S10)",
    slides: [S(9), S(10)],
    range: FIN_RANGES.white,
    cost: "lourd",
    minTier: "basse",
    layers: ["front"],
    init: (ctx: SceneContext) => jets.init(ctx),
    update(f: FrameParams) {
      const F = f.fin;
      veil(f, F.black, F.white, F.point);
      jetFade = 0;
      if (F.whiteHole <= 0) return;
      // même shader que le trou noir : palette bleue, flux inversé (matière éjectée), horizon qui émet
      f.bh.white.set(1, P.flow, P.horizon, P.halo);
      jetFade = P.jets ? THREE.MathUtils.smoothstep(F.emerge, 0.35, 0.95) : 0;
      jets.update(f, jetFade);
    },
    render(_layer, ctx: SceneContext) {
      if (jetFade > 0.001) jets.render(ctx);
    },
    dispose: () => jets.dispose(),
    gui(folder) {
      folder.add(P, "flow", 0, 1.5, 0.01).name("Éjection du disque");
      folder.add(P, "horizon", 0, 3, 0.05).name("Éclat de l'horizon");
      folder.add(P, "halo", 0, 3, 0.05).name("Halo");
      folder.add(P, "jets").name("Jets du quasar");
      jets.gui(folder.addFolder("Jets du quasar"));
    },
  };
}

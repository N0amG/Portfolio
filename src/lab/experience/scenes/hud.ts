import { LAST_SLIDE } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   19 · HUD scientifique (DOM léger, coin haut droit, toutes les slides).
   Cinq lignes en mono : coordonnées, masse, distance, décalage vers le rouge, vitesse de rotation.
   Masse, coordonnées et rotation sont propres à chaque slide (tableau ci-dessous, interpolé entre deux slides) ;
   la distance et le décalage gravitationnel sont calculés en direct depuis la caméra (z = 1/√(1−1/d) − 1).
   Pendant une transition les chiffres défilent (tirage aléatoire qui se résout à l'arrivée).
   Aucune mise à jour du DOM hors changement de texte, 12 fois par seconde au plus.
   ─────────────────────────────────────────────────────────── */

interface Row { ra: number; dec: number; mass: number; rot: number }

// ra en heures, dec en degrés, masse en millions de masses solaires, rot = vitesse du bord interne du disque en fraction de c
const ROWS: Row[] = [
  { ra: 17.7611, dec: -29.0078, mass: 4.3, rot: 0.52 }, // S1 accueil
  { ra: 12.5137, dec: 12.3911, mass: 6500, rot: 0.61 }, // S2
  { ra: 3.3014, dec: -9.4225, mass: 19.4, rot: 0.34 }, // S3
  { ra: 19.5798, dec: 35.2016, mass: 0.0155, rot: 0.47 }, // S4
  { ra: 9.0312, dec: -41.7764, mass: 1280, rot: 0.58 }, // S5
  { ra: 22.8841, dec: 5.9906, mass: 330, rot: 0.66 }, // S6
  { ra: 14.1103, dec: -62.3159, mass: 88.2, rot: 0.73 }, // S7
  { ra: 0.0, dec: 0.0, mass: 0.001, rot: 0.9 }, // S8
  { ra: 6.2503, dec: 22.0147, mass: 52, rot: 0.12 }, // S9
];

const pad = (n: number, w: number) => String(n).padStart(w, "0");
function fmtCoord(ra: number, dec: number) {
  const h = Math.floor(ra), m = Math.floor((ra - h) * 60), s = Math.floor(((ra - h) * 60 - m) * 60);
  const ad = Math.abs(dec), d = Math.floor(ad), dm = Math.floor((ad - d) * 60), ds = Math.floor(((ad - d) * 60 - dm) * 60);
  return `${pad(h, 2)}h${pad(m, 2)}m${pad(s, 2)}s ${dec < 0 ? "−" : "+"}${pad(d, 2)}°${pad(dm, 2)}′${pad(ds, 2)}″`;
}
function fmtMass(mm: number) {
  // millions de masses solaires, en notation compacte à largeur fixe : 4.30e6 / 1.55e4 / 6.50e9
  const v = mm * 1e6;
  const e = Math.floor(Math.log10(Math.max(v, 1)));
  return `${(v / 10 ** e).toFixed(2)}e${e} MSOL`;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function createHud(): SceneElement {
  const P = { opacity: 0.62, scramble: 1.0 };
  let box: HTMLDivElement;
  let vals: HTMLSpanElement[] = [];
  const shown: string[] = ["", "", "", "", ""];
  let acc = 0;
  const digits = "0123456789";

  const scramble = (s: string, p: number) => {
    if (p <= 0) return s;
    let o = "";
    for (const ch of s) o += ch >= "0" && ch <= "9" && Math.random() < p ? digits[(Math.random() * 10) | 0] : ch;
    return o;
  };

  return {
    id: "hud",
    label: "19 · HUD scientifique",
    slides: "all",
    cost: "leger",
    minTier: "basse",
    layers: [],
    init(ctx: SceneContext) {
      box = document.createElement("div");
      box.className = "lab-sci mono";
      box.setAttribute("aria-hidden", "true");
      const labels = ["COORD", "MASSE", "DIST", "Z", "ROT"];
      for (const l of labels) {
        const a = document.createElement("span");
        a.textContent = l;
        const b = document.createElement("span");
        b.className = "v";
        box.append(a, b);
        vals.push(b);
      }
      ctx.root.appendChild(box);
    },
    setActive(on: boolean) {
      box.style.display = on ? "" : "none";
    },
    update(f: FrameParams) {
      box.style.opacity = String(P.opacity);
      acc += f.dt;
      if (acc < 1 / 12) return;
      acc = 0;
      const sc = Math.min(Math.max(f.s, 0), LAST_SLIDE);
      const i = Math.min(Math.floor(sc), LAST_SLIDE - 1), t = sc - i;
      const k = t * t * (3 - 2 * t);
      const A = ROWS[i], B = ROWS[i + 1];
      // le défilement croît vers le milieu de la transition et se résout aux extrémités
      const moving = t > 0.002 && t < 0.998;
      const p = moving ? Math.min(1, Math.pow(Math.sin(Math.PI * t), 0.6)) * 0.9 * P.scramble : 0;
      const d = f.camPos.length();
      const z = 1 / Math.sqrt(Math.max(1 - 1 / d, 1e-3)) - 1;
      const next = [
        fmtCoord(lerp(A.ra, B.ra, k), lerp(A.dec, B.dec, k)),
        fmtMass(Math.exp(lerp(Math.log(A.mass), Math.log(B.mass), k))),
        `${d.toFixed(1)} rs`,
        z.toFixed(3),
        `${lerp(A.rot, B.rot, k).toFixed(2)} c`,
      ].map((s) => scramble(s, p));
      for (let n = 0; n < next.length; n++) {
        if (next[n] !== shown[n]) {
          shown[n] = next[n];
          vals[n].textContent = next[n];
        }
      }
    },
    render() {},
    dispose() {
      box?.remove();
      vals = [];
    },
    gui(folder) {
      folder.add(P, "opacity", 0, 1, 0.01).name("Opacité");
      folder.add(P, "scramble", 0, 1, 0.05).name("Défilement des chiffres");
    },
  };
}

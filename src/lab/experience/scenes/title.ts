import * as THREE from "three";
import { TITLE_TEXT } from "../../content";
import { cameraPose, makePose, S } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   18 · Texte géant de fond (signature du site, S1).
   Un grand texte en contour (Syne), posé sur un plan fixe dans le monde, loin DERRIÈRE le trou noir, face à la
   caméra de S1. Il n'est pas dessiné dans la cible équirectangulaire du ciel (2048×1024 : ~6 px par degré, des
   contours fins y seraient flous) mais échantillonné directement par le shader du trou noir, au bout de chaque rayon
   courbé (uniforms uTitle*) : la lentille et l'anneau d'Einstein sont gratuits et le texte reste net en pleine
   résolution. Coût : un échantillon de texture par pixel, seulement quand l'élément est actif.
   La texture (contour + halo léger) est dessinée une fois sur un canvas 2D, puis redessinée si un réglage change.
   ─────────────────────────────────────────────────────────── */

const TEX_W = 4096;

export function createTitle(): SceneElement {
  const P = { intensity: 0.9, depth: 40, halfWidth: 30, y: 0, drift: 2.5, stroke: 7, glow: 0.5, fill: 0.04 };
  let tex: THREE.CanvasTexture | null = null;
  let canvas: HTMLCanvasElement;
  let root: HTMLElement;
  let maxAniso = 1;
  let aspect = 0.2; // hauteur / largeur de la texture
  const pose = makePose();
  const q = new THREE.Vector3();

  const family = () => getComputedStyle(root).getPropertyValue("--ff-display").trim() || "sans-serif";

  function draw() {
    const font = (px: number) => `800 ${px}px ${family()}`;
    const g = canvas.getContext("2d")!;
    const pad = 80;
    g.font = font(100);
    const k = (TEX_W - 2 * pad) / Math.max(1, g.measureText(TITLE_TEXT).width);
    const size = Math.floor(100 * k);
    g.font = font(size);
    const m = g.measureText(TITLE_TEXT);
    const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    canvas.width = TEX_W;
    canvas.height = Math.ceil(asc + desc + 2 * pad);
    aspect = canvas.height / canvas.width;
    g.font = font(size); // le redimensionnement du canvas remet le contexte à zéro
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.lineJoin = "round";
    const x = TEX_W / 2, y = pad + asc;
    g.fillStyle = `rgba(255,255,255,${P.fill})`;
    g.fillText(TITLE_TEXT, x, y);
    g.strokeStyle = "#fff";
    if (P.glow > 0) {
      // halo : un contour large et flou, puis le contour net par-dessus
      g.save();
      g.shadowColor = `rgba(255,255,255,${P.glow})`;
      g.shadowBlur = 28;
      g.globalAlpha = P.glow * 0.5;
      g.lineWidth = P.stroke * 1.6;
      g.strokeText(TITLE_TEXT, x, y);
      g.restore();
    }
    g.lineWidth = P.stroke;
    g.strokeText(TITLE_TEXT, x, y);
    if (tex) tex.dispose();
    tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = maxAniso; // le texte est très étiré près de l'anneau d'Einstein
    tex.colorSpace = THREE.NoColorSpace;
  }

  return {
    id: "titre",
    label: "18 · Texte géant de fond",
    slides: [S(1)],
    cost: "moyen",
    minTier: "basse",
    layers: [],
    init(ctx: SceneContext) {
      root = ctx.root;
      maxAniso = Math.min(8, ctx.renderer.capabilities.getMaxAnisotropy());
      canvas = document.createElement("canvas");
      draw();
      // la police Syne n'est peut-être pas encore chargée : on redessine dès qu'elle l'est
      document.fonts.load(`800 100px ${family()}`).then(draw, () => {});
    },
    update(f: FrameParams) {
      const t = f.bh.title;
      // plan fixe dans le monde : face à la caméra de S1, à P.depth derrière le trou noir
      cameraPose(S(1), 0, 0, pose);
      q.copy(pose.pos).addScaledVector(pose.f, pose.pos.length() + P.depth)
        .addScaledVector(pose.u, P.y)
        .addScaledVector(pose.r, Math.sin(f.time * 0.06) * P.drift); // dérive lente : la lentille « vit »
      t.o.copy(q).sub(f.camPos);
      t.n.copy(pose.f);
      const hw = P.halfWidth, hh = hw * aspect;
      t.a1.set(pose.r.x / hw, pose.r.y / hw, pose.r.z / hw, 0);
      const w = f.weight * f.weight * (3 - 2 * f.weight);
      t.a2.set(pose.u.x / hh, pose.u.y / hh, pose.u.z / hh, P.intensity * w);
      t.tex.value = tex;
    },
    render() {},
    dispose() {
      tex?.dispose();
      tex = null;
    },
    gui(folder) {
      folder.add(P, "intensity", 0, 3, 0.05).name("Intensité");
      folder.add(P, "depth", 5, 150, 1).name("Profondeur derrière le TN");
      folder.add(P, "halfWidth", 8, 80, 0.5).name("Demi-largeur (monde)");
      folder.add(P, "y", -30, 30, 0.5).name("Hauteur");
      folder.add(P, "drift", 0, 10, 0.1).name("Dérive latérale");
      folder.add(P, "stroke", 2, 24, 0.5).name("Épaisseur du contour").onFinishChange(draw);
      folder.add(P, "glow", 0, 1, 0.05).name("Halo").onFinishChange(draw);
      folder.add(P, "fill", 0, 0.4, 0.01).name("Remplissage").onFinishChange(draw);
    },
  };
}

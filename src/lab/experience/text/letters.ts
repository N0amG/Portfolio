import * as THREE from "three";
import { GLYPH_FRAG, GLYPH_VERT } from "../shaders/glyphs";
import { cameraPose, makePose, TAN_HALF, TEXT_DEPTH } from "../timeline";

/* ───────────────────────────────────────────────────────────
   Texte : un bloc par slide.
   - Le DOM ne sert qu'à la mise en page (bloc de mesure invisible) et à l'accessibilité.
   - Tout le texte est rendu en WebGL : atlas de glyphes + petit maillage instancié par lettre.
     Posé, il est un plan 3D face à la caméra de SA slide ; détaché, il suit la physique écran
     (spirale, marée, lentille gravitationnelle, parallaxe souris).
   ─────────────────────────────────────────────────────────── */

interface Block {
  text: string;
  el: HTMLDivElement;
  cx: number;
  cy: number;
  halfW: number;
}
interface Letter {
  m: HTMLSpanElement; // lettre du bloc de mesure
  v: HTMLSpanElement; // lettre de la couche visible (opacité 0 : accessibilité seulement)
  b: number;
  r: [number, number, number, number, number];
  x: number;
  y: number;
  w: number;
  h: number;
  domOp: string;
  world: THREE.Vector3;
  wr: THREE.Vector3;
  wu: THREE.Vector3;
}

/** État de la scène lu à chaque image. */
export interface LetterView {
  camS: number;
  explosion: number;
  bhScreen: THREE.Vector2; // centre du trou noir à l'écran (px)
  rhNdc: number; // rayon de l'ombre (NDC verticales)
  textCam: THREE.PerspectiveCamera;
}

const GRID = 10; // subdivisions du maillage d'une lettre
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const DEG = Math.PI / 180;

export function createLetters(texts: readonly string[], pageEl: HTMLElement, lettersEl: HTMLElement) {
  const letters: Letter[] = [];
  const blocks: Block[] = texts.map((text, bi) => {
    const el = document.createElement("div");
    el.className = "measure glyph";
    el.setAttribute("aria-hidden", "true");
    const words = text.split(" ");
    words.forEach((word, wi) => {
      const w = document.createElement("span");
      w.className = "w";
      for (const ch of word) {
        const m = document.createElement("span");
        m.className = "l";
        m.textContent = ch;
        w.appendChild(m);
        const v = document.createElement("span");
        v.textContent = ch;
        v.style.opacity = "0";
        lettersEl.appendChild(v);
        const rnd = () => Math.random();
        letters.push({
          m, v, b: bi, r: [rnd(), rnd(), rnd(), rnd(), rnd()], x: 0, y: 0, w: 0, h: 0, domOp: "0",
          world: new THREE.Vector3(), wr: new THREE.Vector3(), wu: new THREE.Vector3(),
        });
      }
      el.appendChild(w);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    pageEl.appendChild(el);
    return { text, el, cx: 0, cy: 0, halfW: 1 };
  });
  const measureEl = blocks[0].el; // référence de style (taille et famille de police) pour l'atlas
  const NL = letters.length;

  // --- Géométrie instanciée : image primaire + image secondaire (de l'autre côté de l'anneau)
  const plane = new THREE.PlaneGeometry(1, 1, GRID, GRID);
  const glyphGeo = new THREE.InstancedBufferGeometry();
  {
    const pos = plane.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setXY(i, pos.getX(i) + 0.5, 0.5 - pos.getY(i)); // [0,1]², y vers le bas
    glyphGeo.index = plane.index;
    glyphGeo.setAttribute("position", pos);
    glyphGeo.instanceCount = NL * 2;
  }
  const mkInst = (name: string) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(NL * 2 * 4), 4);
    a.setUsage(THREE.DynamicDrawUsage);
    glyphGeo.setAttribute(name, a);
    return a;
  };
  const iA = mkInst("iA"), iB = mkInst("iB"), iC = mkInst("iC"), iUV = mkInst("iUV");
  // position 3D de la lettre (origine de sa boîte) et vecteurs monde par pixel du plan du bloc ; iD.x = mélange 3D -> écran
  const iW = mkInst("iW"), iR = mkInst("iR"), iU = mkInst("iU"), iD = mkInst("iD");

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: null },
      uView: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: new THREE.Vector2() },
      uThetaE: { value: 100 },
      uPar: { value: new THREE.Vector2() },
      uSwirl: { value: 1.1 },
      uTide: { value: 1.0 },
      uViewProj: { value: new THREE.Matrix4() },
    },
    vertexShader: GLYPH_VERT,
    fragmentShader: GLYPH_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const mesh = new THREE.Mesh(glyphGeo, mat);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);

  // --- Atlas : chaque caractère dessiné dans une cellule qui reproduit sa boîte DOM (même ligne de base)
  let atlasTex: THREE.CanvasTexture | null = null;
  function buildAtlas() {
    const cs = getComputedStyle(measureEl);
    const domFont = parseFloat(cs.fontSize);
    const AF = 128, k = AF / domFont; // échelle atlas / DOM
    const padDom = Math.ceil(domFont * 0.18), pad = padDom * k;
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d")!;
    const font = `${cs.fontWeight} ${AF}px ${cs.fontFamily}`;
    ctx.font = font;
    const m = ctx.measureText("Hg");
    const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    const cells = new Map<string, { x: number; y: number; cw: number; chh: number; lineH: number }>();
    const W = 2048;
    let x = 0, y = 0, rowH = 0;
    for (const L of letters) {
      const ch = L.m.textContent!;
      if (cells.has(ch)) continue;
      const cw = Math.ceil(L.w * k + 2 * pad), chh = Math.ceil(L.h * k + 2 * pad);
      if (x + cw > W) { x = 0; y += rowH + 2; rowH = 0; }
      cells.set(ch, { x, y, cw, chh, lineH: L.h * k });
      x += cw + 2;
      rowH = Math.max(rowH, chh);
    }
    cv.width = W;
    cv.height = y + rowH + 2;
    ctx.font = font;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    for (const [ch, c] of cells) {
      const baseline = c.y + pad + (c.lineH - (asc + desc)) / 2 + asc;
      ctx.fillText(ch, c.x + pad, baseline);
    }
    if (atlasTex) atlasTex.dispose();
    atlasTex = new THREE.CanvasTexture(cv);
    atlasTex.minFilter = THREE.LinearMipmapLinearFilter;
    atlasTex.generateMipmaps = true;
    atlasTex.anisotropy = 4;
    mat.uniforms.uAtlas.value = atlasTex;
    // attributs fixes par lettre : boîte, marge, image, uv (flipY : v = 1 en haut du canvas)
    const H = cv.height;
    letters.forEach((L, i) => {
      const c = cells.get(L.m.textContent!)!;
      for (const j of [i, i + NL]) {
        iC.setXYZW(j, L.w, L.h, padDom, j < NL ? 0 : 1);
        iUV.setXYZW(j, c.x / W, 1 - c.y / H, (c.x + c.cw) / W, 1 - (c.y + c.chh) / H);
      }
    });
    iC.needsUpdate = true;
    iUV.needsUpdate = true;
  }

  // Chaque bloc est un plan posé dans la scène, face à la caméra de SA slide, à TEXT_DEPTH devant elle :
  // vu depuis sa slide il occupe exactement sa place de mise en page ; depuis ailleurs, on le voit sous un autre angle.
  const tmpPose = makePose();
  const vTmp = new THREE.Vector3(), vTmp2 = new THREE.Vector3();
  function anchor() {
    const W = window.innerWidth, H = window.innerHeight, asp = W / H;
    const wpp = (2 * TEXT_DEPTH * TAN_HALF) / H; // unités de scène par pixel à cette profondeur
    letters.forEach((L, i) => {
      cameraPose(L.b, 0, 0, tmpPose);
      const ox = L.x + L.w / 2, oy = L.y + L.h * 0.55; // origine de la boîte (comme le transform-origin)
      const nx = (ox / W) * 2 - 1, ny = 1 - (oy / H) * 2;
      L.world
        .copy(tmpPose.pos)
        .addScaledVector(tmpPose.f, TEXT_DEPTH)
        .addScaledVector(tmpPose.r, nx * TAN_HALF * asp * TEXT_DEPTH)
        .addScaledVector(tmpPose.u, ny * TAN_HALF * TEXT_DEPTH);
      L.wr.copy(tmpPose.r).multiplyScalar(wpp);
      L.wu.copy(tmpPose.u).multiplyScalar(-wpp);
      for (const j of [i, i + NL]) {
        iW.setXYZ(j, L.world.x, L.world.y, L.world.z);
        iR.setXYZ(j, L.wr.x, L.wr.y, L.wr.z);
        iU.setXYZ(j, L.wu.x, L.wu.y, L.wu.z);
      }
    });
    iW.needsUpdate = true;
    iR.needsUpdate = true;
    iU.needsUpdate = true;
  }

  /** Mesure la mise en page DOM, reconstruit l'atlas et repose les blocs en 3D (au chargement et au resize). */
  function layout() {
    for (const B of blocks) {
      const br = B.el.getBoundingClientRect();
      B.cx = br.left + br.width / 2;
      B.cy = br.top + br.height / 2;
      B.halfW = br.width / 2;
    }
    for (const L of letters) {
      const r = L.m.getBoundingClientRect();
      L.x = r.left; L.y = r.top; L.w = r.width; L.h = r.height;
    }
    buildAtlas();
    anchor();
  }

  function setDom(L: Letter, op: string) {
    if (L.domOp !== op) { L.v.style.opacity = op; L.domOp = op; }
  }
  function setGlyph(i: number, ox: number, oy: number, va: number, rot: number, sx: number, sy: number, op: number, abs: number, kd = 1) {
    for (const j of [i, i + NL]) {
      iA.setXYZW(j, ox, oy, va, rot);
      iB.setXYZW(j, sx, sy, op, abs);
      iD.setX(j, kd);
    }
  }

  /** Physique des lettres pour l'image courante (calculée en JS, appliquée dans la boucle commune). */
  function update(view: LetterView) {
    const W = window.innerWidth, H = window.innerHeight;
    const cx = view.bhScreen.x, cy = view.bhScreen.y; // centre du trou noir à l'écran (il bouge avec la caméra)
    const rh = (view.rhNdc * H) / 2; // rayon de l'ombre en px (varie avec le recul de la caméra)
    const E = view.explosion > 0 ? 0.26 : 0; // part "explosion" de la séquence d'une lettre (0 = aspiration directe)
    const DMAX = 0.35; // décalage max entre les lettres d'un bloc (fraction de p)
    const force = view.explosion;
    letters.forEach((L, i) => {
      const B = blocks[L.b];
      const [r1, r2, r3, r4, r5] = L.r;
      const homeX = L.x + L.w / 2;
      setDom(L, "0"); // le DOM ne sert plus qu'à la mise en page et à l'accessibilité
      // d = position de la caméra par rapport à ce bloc : 0 = face au bloc, +1 = slide suivante, -1 = précédente
      const d = view.camS - L.b;
      const e = smooth(-0.45, -0.15, d); // apparition du bloc qui arrive
      // position actuelle de la lettre posée en 3D, projetée à l'écran (sert de point de départ à l'explosion)
      vTmp.copy(L.world).project(view.textCam);
      const restX = ((vTmp.x + 1) / 2) * W, restY = ((1 - vTmp.y) / 2) * H;
      vTmp2.copy(L.world).addScaledVector(L.wr, L.w).project(view.textCam);
      const rs = Math.hypot(((vTmp2.x - vTmp.x) / 2) * W, ((vTmp2.y - vTmp.y) / 2) * H) / Math.max(L.w, 1);
      // désintégration : commence quand le bloc est parti sur le côté, les lettres de tête d'abord
      const pBlock = Math.min(1, Math.max(0, (d - 0.1) / 0.9));
      const xN = ((homeX - B.cx) / B.halfW) * 0.5 + 0.5;
      const delay = (0.55 * r1 + 0.45 * (1 - xN)) * DMAX; // côté droit d'abord : il reste le plus longtemps dans le cadre
      const u = Math.min(1, Math.max(0, (pBlock - delay) / (1 - DMAX)));
      if (u <= 0) {
        setGlyph(i, restX, restY, 0, 0, rs, rs, e, 0, 0); // rendu 100 % 3D
        return;
      }
      if (u >= 1) { setGlyph(i, 0, 0, 0, 0, 1, 1, 0, 0); return; }

      let x: number, y: number, op = 1, rot = 0, va = 0, sx = 1, sy = 1, sc = 1;
      const bx = restX, by = restY;
      // 1. explosion : directions opposées (côté gauche vers la gauche, côté droit vers la droite, haut/bas alterné)
      const side = Math.sign(homeX - B.cx) || 1;
      let dx = side * (0.45 + 0.9 * r2) + ((homeX - B.cx) / B.halfW) * 0.4;
      let dy = (r3 - 0.5) * 2.2 * (r5 > 0.5 ? 1 : -1);
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl; dy /= dl;
      const dist = (70 + 190 * r4) * force * (H / 900);
      const spin = (r5 - 0.5) * 2 * 420 * force;
      const k = easeOut(Math.min(1, u / E));
      const ex = bx + dx * dist * k, ey = by + dy * dist * k;
      rot = spin * k;
      if (u < E) {
        x = ex; y = ey;
      } else {
        // 2. spirale gravitationnelle vers l'horizon (anti-horaire à l'écran, comme le disque et les étoiles)
        const s = (u - E) / (1 - E);
        const ox = ex - cx, oy = ey - cy;
        const r0 = Math.hypot(ox, oy), a0 = Math.atan2(oy, ox);
        const path = (t: number) => {
          const rr = rh + (r0 - rh) * (1 - Math.pow(t, 1.7));
          const aa = a0 - 1.9 * Math.PI * Math.pow(t, 1.8);
          return [cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr, rr] as const;
        };
        const [px, py, rr] = path(s);
        const [qx, qy] = path(Math.max(0, s - 0.012));
        x = px; y = py;
        const vx = px - qx, vy = py - qy, sp = Math.hypot(vx, vy);
        va = (Math.atan2(vy, vx) * 180) / Math.PI;
        const stretch = Math.min(3, Math.max(0, sp / 5 - 0.4)); // étirement le long de la vitesse (la courbure vient du shader)
        sx = 1 + stretch;
        sy = 1 / Math.sqrt(1 + stretch * 0.8);
        sc = 0.3 + 0.7 * smooth(rh, rh * 2.6, rr);
        rot += 160 * s;
        op = smooth(rh * 0.95, rh * 1.7, rr) * (1 - smooth(0.93, 1, s));
      }
      // absorption : 0 pendant l'explosion, 1 quand la lettre est prise par le trou noir
      const absorb = smooth(E * 0.7, E + (1 - E) * 0.35, u);
      // origine de la transformation = 50 % / 55 % de la boîte (comme le transform-origin CSS)
      const ks = rs + (1 - rs) * smooth(0, Math.max(E, 0.3), u); // l'échelle de perspective se relâche en douceur
      const kd = smooth(0, Math.max(E * 0.5, 0.08), u); // bascule progressive du plan 3D vers la physique écran
      setGlyph(i, x, y, va * DEG, (rot - va) * DEG, sx * sc * ks, sy * sc * ks, op, absorb, kd);
    });
    iA.needsUpdate = true;
    iB.needsUpdate = true;
    iD.needsUpdate = true;
  }

  return {
    blocks,
    scene,
    mat,
    /** Famille de police du bloc de mesure (pour attendre son chargement). */
    font: () => {
      const cs = getComputedStyle(measureEl);
      return `${cs.fontWeight} 64px ${cs.fontFamily}`;
    },
    layout,
    update,
    dispose() {
      atlasTex?.dispose();
      plane.dispose();
      glyphGeo.dispose();
      mat.dispose();
      pageEl.replaceChildren();
      lettersEl.replaceChildren();
    },
  };
}

export type Letters = ReturnType<typeof createLetters>;

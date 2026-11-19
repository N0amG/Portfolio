import * as THREE from "three";
import { PULSAR_POS, S, cameraPose, makePose } from "../timeline";
import { LENS_FRAG, LENS_VERT, lensUniforms, updateLens, updateView } from "./lens";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   6 · Pulsar (S4).
   Étoile à neutrons fixe dans le monde (PULSAR_POS, point focal de S4 : au centre du cadre, trou noir au loin),
   en vraie géométrie 3D, couche "front", lentille et masquage par le trou noir via scenes/lens.ts.
   - Axe de rotation ω et axe magnétique m incliné de α par rapport à ω ; m tourne autour de ω (phare).
     ω est choisi pour que le cône balayé par m passe par la caméra de S4 : un faisceau la balaie à chaque tour.
   - Faisceaux : deux cônes droits le long de ±m (étroits au départ, s'élargissent linéairement), rubans tournés vers
     la caméra, sans ondulation ; plus brillants
     quand on regarde dans l'axe (ligne de visée plus longue dans le cône).
   - Panneau (maillage subdivisé pour suivre la lentille) : cœur minuscule très brillant, halo, flash quand un faisceau
     passe vers la caméra (halo élargi + traînées), et nébuleuse de vent : tore équatorial (ellipse vue selon ω),
     petits jets polaires et volutes de bruit.
   Couleurs : blanc, horizon bleu #7fd6ff, bleu profond #1b4dff (teinte froide de S4).
   ─────────────────────────────────────────────────────────── */

const NSEG = 64;

const BEAM_VERT = /* glsl */ `
  ${LENS_VERT}
  attribute vec3 aU;   // x = t le long du faisceau (0..1), y = côté (-1..1), z = faisceau (+1 / −1)
  uniform vec3 uP, uM;
  uniform float uLen, uHalf;
  varying vec3 vU;
  varying vec2 vS;   // (côté × largeur, largeur) : la coordonnée en travers est rendue exacte dans le fragment (sinon zigzag)
  varying float vBehind, vView;
  void main(){
    vec3 ax = uM * aU.z;
    float s = 0.05 + aU.x * uLen;
    vec3 c = uP + ax * s;
    vec3 v = normalize(uCamPos - c);
    vec3 sd = cross(ax, v);
    float l = length(sd);
    sd = l > 1e-4 ? sd / l : vec3(1.0, 0.0, 0.0);
    vView = dot(ax, v);
    vU = aU;
    float w = (0.012 + tan(uHalf) * s) * 2.5;   // cône : largeur linéaire ; ×2,5 : place pour la lueur
    vS = vec2(aU.y * w, w);
    gl_Position = lensProject(c + sd * aU.y * w, vBehind);
  }
`;
const BEAM_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uTime, uFade, uBright;
  varying vec3 vU;
  varying vec2 vS;
  varying float vBehind, vView;
  void main(){
    // chaque morceau du cône est un trapèze : interpoler vU.y sur ses deux triangles brise l'axe à chaque segment (zigzag) ;
    // le rapport de deux grandeurs interpolées linéairement redonne la vraie position en travers
    float t = vU.x, v = vS.x / vS.y * 2.5;
    float core = exp(-v * v * 2.5);
    float glow = exp(-v * v * 0.45) * 0.22;
    float along = smoothstep(0.0, 0.015, t) * exp(-t * 2.4) * (1.0 - smoothstep(0.75, 1.0, t));
    float los = 1.0 / (sqrt(max(1.0 - vView * vView, 0.0)) + 0.3);   // ligne de visée dans le cône
    float I = along * (core + glow) * los * uBright;
    vec3 col = mix(vec3(0.106, 0.302, 1.0), vec3(0.498, 0.839, 1.0), smoothstep(0.0, 0.5, core));
    col = mix(col, vec3(1.0), core * 0.55);
    gl_FragColor = vec4(1.0 - exp(-col * I), uFade * bhVis(vBehind));
  }
`;

const STAR_VERT = /* glsl */ `
  ${LENS_VERT}
  uniform vec3 uP;
  uniform float uSize;
  varying vec2 vQ;
  varying float vBehind;
  void main(){
    vec3 R = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 U = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vQ = position.xy;
    gl_Position = lensProject(uP + (R * position.x + U * position.y) * uSize, vBehind);
  }
`;
const STAR_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uSize, uCore, uHalo, uFlash, uTime, uFade, uWind, uRing, uCosI;
  uniform vec2 uAx;   // axe de rotation projeté à l'écran (unitaire)
  varying vec2 vQ;
  varying float vBehind;
  float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p){ return 0.5 * vn(p) + 0.3 * vn(p * 2.1 + 3.7) + 0.2 * vn(p * 4.3 - 1.9); }
  void main(){
    vec2 p = vQ * uSize;
    float r2 = dot(p, p);
    float core = exp(-r2 / (uCore * uCore)) * 5.0 + exp(-sqrt(r2) / (uCore * 2.5)) * 0.8;
    float halo = uHalo * 0.06 / (r2 + 0.06);
    float fl = uFlash * (0.5 / (r2 * 0.5 + 0.5) + exp(-abs(p.y) * 22.0) * exp(-abs(p.x) * 0.45) * 1.1
                         + exp(-abs(p.x) * 22.0) * exp(-abs(p.y) * 1.3) * 0.3);
    // nébuleuse de vent : tore dans le plan équatorial (ellipse), jets polaires, volutes
    vec2 pe = vec2(-uAx.y, uAx.x);
    float xa = dot(p, pe), ya = dot(p, uAx);
    float er = length(vec2(xa, ya / max(uCosI, 0.15)));
    float ca = cos(uTime * 0.05), sa = sin(uTime * 0.05);
    float n = fbm(mat2(ca, -sa, sa, ca) * p * 1.7 + 4.0);
    float ring = exp(-pow((er - uRing) / (uRing * 0.28), 2.0)) * (0.4 + 1.1 * n);
    float pw = 0.04 + 0.12 * abs(ya);                                   // jets polaires : cônes droits, sans volutes
    float pj = exp(-xa * xa / (pw * pw)) * exp(-abs(ya) * 1.4) * 0.8;
    float haze = exp(-r2 * 0.3) * smoothstep(0.35, 0.8, n) * 0.6;
    float wind = (ring * 0.55 + pj * 0.5 + haze) * uWind;
    vec3 col = vec3(1.0) * core + vec3(0.75, 0.9, 1.0) * halo + vec3(0.85, 0.95, 1.0) * fl
             + mix(vec3(0.106, 0.302, 1.0), vec3(0.498, 0.839, 1.0), smoothstep(0.3, 0.8, n)) * wind;
    float edge = 1.0 - smoothstep(0.75, 1.0, length(vQ));
    gl_FragColor = vec4(1.0 - exp(-col * edge), uFade * bhVis(vBehind));
  }
`;

export function createPulsar(): SceneElement {
  const P = {
    spin: 0.9, incl: 0.5, half: 0.085, length: 22, bright: 1.6,
    core: 0.07, halo: 1, flash: 1.6, wind: 0.8, ring: 1.4,
    lens: true, edge: 0.3,
  };
  let scene: THREE.Scene, beamMat: THREE.ShaderMaterial, starMat: THREE.ShaderMaterial;
  let beamGeo: THREE.BufferGeometry, starGeo: THREE.PlaneGeometry;
  let lu: ReturnType<typeof lensUniforms>;
  const pose = makePose();
  const pos = new THREE.Vector3(...PULSAR_POS), toCam = new THREE.Vector3(), perp = new THREE.Vector3(), w = new THREE.Vector3();
  const b1 = new THREE.Vector3(), b2 = new THREE.Vector3(), m = new THREE.Vector3(), tmp = new THREE.Vector3();
  let phase = 0;

  return {
    id: "pulsar",
    label: "6 · Pulsar (S4)",
    slides: [S(4)],
    cost: "moyen",
    minTier: "moyenne",
    layers: ["front"],
    init(ctx: SceneContext) {
      cameraPose(S(4), 0, 0, pose);
      lu = lensUniforms(ctx);
      const U: number[] = [], idx: number[] = [];
      for (const j of [1, -1]) {
        const o = U.length / 3;
        for (let i = 0; i <= NSEG; i++) {
          U.push(i / NSEG, -1, j, i / NSEG, 1, j);
          if (i < NSEG) { const b = o + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        }
      }
      beamGeo = new THREE.BufferGeometry();
      const a = new THREE.Float32BufferAttribute(U, 3);
      beamGeo.setAttribute("aU", a);
      beamGeo.setAttribute("position", a); // requis par three, non utilisé
      beamGeo.setIndex(idx);
      const common = { transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending };
      beamMat = new THREE.ShaderMaterial({
        uniforms: {
          ...lu, uP: { value: pos }, uM: { value: m }, uLen: { value: 20 }, uHalf: { value: 0.08 },
          uTime: { value: 0 }, uFade: { value: 0 }, uBright: { value: 1 },
        },
        vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, ...common,
      });
      starGeo = new THREE.PlaneGeometry(2, 2, 16, 16);
      starMat = new THREE.ShaderMaterial({
        uniforms: {
          ...lu, uP: { value: pos }, uSize: { value: 5 }, uCore: { value: 0.07 }, uHalo: { value: 1 }, uFlash: { value: 0 },
          uTime: { value: 0 }, uFade: { value: 0 }, uWind: { value: 1 }, uRing: { value: 1.4 }, uCosI: { value: 1 },
          uAx: { value: new THREE.Vector2(0, 1) },
        },
        vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, ...common,
      });
      const beams = new THREE.Mesh(beamGeo, beamMat), star = new THREE.Mesh(starGeo, starMat);
      beams.frustumCulled = star.frustumCulled = false;
      star.renderOrder = 1;
      scene = new THREE.Scene().add(beams, star);
    },
    update(f: FrameParams) {
      // axe de rotation : incliné de (α − δ) par rapport à la direction de la caméra de S4 → un faisceau la balaie à chaque tour
      toCam.copy(pose.pos).sub(pos).normalize();
      perp.copy(pose.u).addScaledVector(toCam, -pose.u.dot(toCam)).normalize();
      tmp.crossVectors(toCam, perp);
      perp.multiplyScalar(Math.cos(0.6)).addScaledVector(tmp, Math.sin(0.6)); // axe vu en diagonale
      const tilt = Math.max(0, P.incl - 0.02);
      w.copy(toCam).multiplyScalar(Math.cos(tilt)).addScaledVector(perp, Math.sin(tilt));
      b1.copy(toCam).addScaledVector(w, -toCam.dot(w)).normalize();
      b2.crossVectors(w, b1);
      phase += f.dt * P.spin * Math.PI * 2;
      const c = Math.cos(phase), s = Math.sin(phase);
      m.copy(w).multiplyScalar(Math.cos(P.incl)).addScaledVector(b1, Math.sin(P.incl) * c).addScaledVector(b2, Math.sin(P.incl) * s);
      // flash : un faisceau pointe vers la caméra courante
      const view = tmp.copy(f.camPos).sub(pos).normalize();
      const ang = Math.acos(Math.min(1, Math.abs(m.dot(view))));
      const flash = Math.exp(-((ang / (P.half * 1.3)) ** 2)) * P.flash;
      const fade = THREE.MathUtils.smoothstep(f.weight, 0, P.edge);
      updateLens(lu, f, P.lens);
      const bu = beamMat.uniforms, su = starMat.uniforms;
      bu.uLen.value = P.length; bu.uHalf.value = P.half; bu.uTime.value = f.time; bu.uFade.value = fade;
      bu.uBright.value = P.bright;
      su.uSize.value = 5; su.uCore.value = P.core; su.uHalo.value = P.halo * (1 + flash * 0.6); su.uFlash.value = flash;
      su.uTime.value = f.time; su.uFade.value = fade; su.uWind.value = P.wind; su.uRing.value = P.ring;
      su.uCosI.value = Math.abs(w.dot(view));
      (su.uAx.value as THREE.Vector2).set(w.dot(f.camR), w.dot(f.camU)).normalize();
    },
    render(_layer, ctx: SceneContext) {
      updateView(lu, ctx);
      ctx.renderer.render(scene, ctx.camera);
    },
    dispose() {
      beamGeo.dispose();
      starGeo.dispose();
      beamMat.dispose();
      starMat.dispose();
    },
    gui(folder) {
      folder.add(P, "spin", 0, 4, 0.05).name("Rotation (tours/s)");
      folder.add(P, "incl", 0.1, 1.2, 0.01).name("Inclinaison de l'axe magnétique");
      folder.add(P, "half", 0.02, 0.25, 0.005).name("Ouverture des faisceaux");
      folder.add(P, "length", 5, 50, 0.5).name("Longueur des faisceaux");
      folder.add(P, "bright", 0, 5, 0.05).name("Éclat des faisceaux");
      folder.add(P, "core", 0.02, 0.3, 0.005).name("Taille du cœur");
      folder.add(P, "halo", 0, 4, 0.05).name("Halo");
      folder.add(P, "flash", 0, 5, 0.05).name("Flash");
      folder.add(P, "wind", 0, 3, 0.05).name("Nébuleuse de vent");
      folder.add(P, "ring", 0.4, 3, 0.05).name("Rayon du tore");
      folder.add(P, "lens").name("Lentille (partie derrière)");
      folder.add(P, "edge", 0, 1, 0.05).name("Fondu en bord de fenêtre");
    },
  };
}

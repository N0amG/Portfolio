import * as THREE from "three";
import { S } from "../timeline";
import { LENS_FRAG, LENS_VERT, lensUniforms, updateLens, updateView } from "./lens";
import type GUI from "lil-gui";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   11 · Jets relativistes (S3).
   Deux jets polaires étroits (axe ±y, perpendiculaires au disque), en vraie géométrie 3D : rubans tournés vers la
   caméra autour de leur axe, couche "front" ; la partie située derrière le trou noir est courbée par la lentille et
   cachée par l'ombre et le disque (scenes/lens.ts) : vu d'au-dessus, le jet inférieur disparaît derrière le disque.
   - Nœuds brillants qui remontent le long du jet, légère torsion hélicoïdale de l'axe.
   - Beaming : éclat × D^p, D = 1 / (γ (1 − β cos θ)), θ = angle entre le jet et la direction de la caméra :
     le jet qui pointe vers la caméra est plus brillant, l'autre s'éteint presque.
   Couleurs : cœur blanc, puis horizon bleu #7fd6ff, bords bleu profond #1b4dff (palette de la section 4).
   ─────────────────────────────────────────────────────────── */

const N = 180; // segments par jet

const VERT = /* glsl */ `
  ${LENS_VERT}
  attribute vec3 aU;   // x = t le long du jet (0 = base, 1 = bout), y = côté (-1..1), z = jet (+1 haut, −1 bas)
  uniform float uLen, uBase, uWidth, uOpen, uTwist, uTime, uBeta, uBeamP;
  varying vec3 vU;
  varying float vBehind, vBeam;
  vec3 axisAt(float t, float j){
    float y = uBase + t * uLen;
    // légère torsion : l'axe décrit une hélice d'amplitude croissante qui tourne lentement
    float a = y * 0.42 - uTime * 0.9 + j * 1.7;
    float amp = uTwist * t * (0.6 + 0.4 * t);
    return vec3(cos(a) * amp, j * y, sin(a) * amp);
  }
  void main(){
    float t = aU.x, j = aU.z;
    vec3 c = axisAt(t, j);
    vec3 tg = normalize(axisAt(t + 0.004, j) - c);
    vec3 v = normalize(uCamPos - c);
    vec3 sd = cross(tg, v);
    float l = length(sd);
    sd = l > 1e-4 ? sd / l : vec3(1.0, 0.0, 0.0);
    float w = uWidth + uOpen * t * uLen;
    // beaming relativiste
    float g = inversesqrt(1.0 - uBeta * uBeta);
    float D = 1.0 / (g * (1.0 - uBeta * dot(tg, v)));
    vBeam = pow(D, uBeamP);
    vU = aU;
    gl_Position = lensProject(c + sd * aU.y * w * 3.0, vBehind);   // ×3 : place pour le halo
  }
`;

const FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uTime, uFade, uBright, uKnots, uKnotSpeed, uDecay;
  varying vec3 vU;
  varying float vBehind, vBeam;
  float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
  void main(){
    float t = vU.x, v = vU.y * 3.0, j = vU.z;
    // nœuds : grumeaux qui remontent le long du jet (x croît avec le temps à t fixé -> ils montent)
    float x = t * uKnots - uTime * uKnotSpeed;
    float id = floor(x), fx = fract(x);
    float knot = pow(max(1.0 - abs(fx - 0.5) * 2.0, 0.0), 4.0) * (0.3 + 1.5 * h1(id + j * 17.0));
    float core = exp(-pow(v * (2.6 - knot * 0.8), 2.0));
    float glow = exp(-pow(v * 1.1, 2.0)) * 0.28;
    float along = smoothstep(0.0, 0.04, t) * exp(-t * uDecay) * (1.0 - smoothstep(0.8, 1.0, t));
    float I = along * (core * (0.4 + 2.0 * knot) + glow * (0.5 + 1.0 * knot)) * vBeam * uBright;
    vec3 col = mix(vec3(0.106, 0.302, 1.0), vec3(0.498, 0.839, 1.0), smoothstep(0.0, 0.6, core));   // #1b4dff -> #7fd6ff
    col = mix(col, vec3(1.0), smoothstep(0.5, 1.0, core) * (0.45 + 0.5 * knot));                    // cœur blanc
    gl_FragColor = vec4(1.0 - exp(-col * I * 1.5), uFade * bhVis(vBehind));   // saturation douce : garde la teinte
  }
`;

export type JetSettings = typeof JET_DEFAULTS;
const JET_DEFAULTS = {
  length: 30, base: 1.3, width: 0.15, open: 0.03, twist: 0.35, bright: 1.4,
  knots: 7, knotSpeed: 0.45, decay: 1.6, beta: 0.6, beamP: 2.5, lens: true,
};

/** Deux jets polaires (géométrie, shader, réglages) : utilisés par 11 · jets relativistes et par 3 · trou blanc (quasar). */
export function createJetRenderer(settings: Partial<JetSettings> = {}) {
  const P = { ...JET_DEFAULTS, ...settings };
  let scene: THREE.Scene, mat: THREE.ShaderMaterial, geo: THREE.BufferGeometry;
  let lu: ReturnType<typeof lensUniforms>;
  return {
    P,
    init(ctx: SceneContext) {
      lu = lensUniforms(ctx);
      const U: number[] = [], idx: number[] = [];
      for (const j of [1, -1]) {
        const o = U.length / 3;
        for (let i = 0; i <= N; i++) {
          U.push(i / N, -1, j, i / N, 1, j);
          if (i < N) { const b = o + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        }
      }
      geo = new THREE.BufferGeometry();
      const a = new THREE.Float32BufferAttribute(U, 3);
      geo.setAttribute("aU", a);
      geo.setAttribute("position", a); // requis par three, non utilisé
      geo.setIndex(idx);
      mat = new THREE.ShaderMaterial({
        uniforms: {
          ...lu,
          uLen: { value: 1 }, uBase: { value: 1 }, uWidth: { value: 1 }, uOpen: { value: 0 }, uTwist: { value: 0 },
          uTime: { value: 0 }, uBeta: { value: 0.6 }, uBeamP: { value: 2.5 }, uFade: { value: 0 }, uBright: { value: 1 },
          uKnots: { value: 7 }, uKnotSpeed: { value: 0.5 }, uDecay: { value: 1.5 },
        },
        vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene = new THREE.Scene().add(mesh);
    },
    /** fade : 0..1 (apparition). */
    update(f: FrameParams, fade: number) {
      updateLens(lu, f, P.lens);
      const u = mat.uniforms;
      u.uLen.value = P.length; u.uBase.value = P.base; u.uWidth.value = P.width; u.uOpen.value = P.open;
      u.uTwist.value = P.twist; u.uTime.value = f.time; u.uBeta.value = P.beta; u.uBeamP.value = P.beamP;
      u.uFade.value = fade; u.uBright.value = P.bright; u.uKnots.value = P.knots; u.uKnotSpeed.value = P.knotSpeed;
      u.uDecay.value = P.decay;
    },
    render(ctx: SceneContext) {
      updateView(lu, ctx);
      ctx.renderer.render(scene, ctx.camera);
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
    gui(folder: GUI) {
      folder.add(P, "bright", 0, 4, 0.05).name("Éclat");
      folder.add(P, "length", 8, 90, 0.5).name("Longueur");
      folder.add(P, "width", 0.02, 0.6, 0.01).name("Largeur à la base");
      folder.add(P, "open", 0, 0.08, 0.001).name("Ouverture");
      folder.add(P, "twist", 0, 1.5, 0.01).name("Torsion");
      folder.add(P, "knots", 1, 20, 1).name("Nœuds (nombre)");
      folder.add(P, "knotSpeed", 0, 2, 0.01).name("Vitesse des nœuds");
      folder.add(P, "decay", 0, 5, 0.05).name("Atténuation le long du jet");
      folder.add(P, "beta", 0, 0.95, 0.01).name("Beaming : vitesse β");
      folder.add(P, "beamP", 1, 4, 0.1).name("Beaming : exposant");
      folder.add(P, "lens").name("Lentille (partie derrière)");
    },
  };
}

export function createJets(): SceneElement {
  const jets = createJetRenderer();
  return {
    id: "jets",
    label: "11 · Jets relativistes",
    slides: [S(3)],
    cost: "moyen",
    minTier: "basse", // rien n'est retiré selon le niveau (20/11/2026)
    layers: ["front"],
    init: (ctx) => jets.init(ctx),
    update(f: FrameParams) {
      // apparition sur la moitié de fenêtre la plus proche de S3 (passage de relais du budget « moyen » sans saut)
      jets.update(f, THREE.MathUtils.smoothstep(f.weight, 0.5, 0.85));
    },
    render: (_layer, ctx) => jets.render(ctx),
    dispose: () => jets.dispose(),
    gui: (folder) => jets.gui(folder),
  };
}

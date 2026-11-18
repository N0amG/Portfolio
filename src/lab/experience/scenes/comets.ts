import * as THREE from "three";
import { S } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   9 · Comètes (couche "back", pleine résolution : cachées par l'ombre et le disque).
   Chaque comète suit en écran une spirale vers le centre du trou noir (rayon qui décroît, angle qui accélère) ;
   la tête, la queue et la largeur sont calculées dans le vertex shader à partir de la seule date de la comète.
   Fréquence : plusieurs passages sur S3, un passage rare ailleurs.
   ─────────────────────────────────────────────────────────── */

const MAX = 3;
const SEG = 48; // segments de la queue

const VERT = /* glsl */ `
  attribute vec2 aK;      // x : abscisse le long de la queue (0 = tête, 1 = bout), y : côté (-1 ou 1)
  attribute float aIdx;   // numéro de la comète
  uniform vec4 uA[${MAX}];   // x : azimut de départ, y : rayon de départ (NDC verticales), z : avancement de la tête (0 → 1), w : sens (±1)
  uniform vec4 uB[${MAX}];   // x : nombre de tours, y : longueur de queue (en avancement), z : luminosité, w : largeur
  uniform vec2 uC; uniform float uAspect, uRh;
  varying vec2 vK; varying float vL;
  // avancement u ∈ [0,1] -> position en NDC verticales relative au trou noir
  vec2 path(vec4 a, vec4 b, float u){
    u = max(u, 0.0);
    float rho = mix(a.y, uRh * 0.55, pow(min(u, 1.0), 1.7));
    float th = a.x + a.w * b.x * 6.2831853 * pow(min(u, 1.0), 1.35);
    return rho * vec2(cos(th), sin(th));
  }
  void main(){
    int i = int(aIdx + 0.5);
    vec4 a = uA[i], b = uB[i];
    float u = a.z - aK.x * b.y;
    vec2 p0 = path(a, b, u), p1 = path(a, b, u + 0.01);
    vec2 t = normalize((p1 - p0) * vec2(1.0, 1.0) + 1e-5);
    vec2 n = vec2(-t.y, t.x);
    // la queue s'amincit ; un renflement autour de la tête fait office de coma
    float coma = 1.0 + 1.4 * exp(-aK.x * 40.0);
    float w = b.w * (1.0 - aK.x) * coma * (0.35 + 0.65 * smoothstep(0.0, 0.08, aK.x + 0.02));
    vec2 p = p0 + n * aK.y * w;
    p.x /= uAspect;                                    // p est en unités verticales ; ramène en NDC x
    gl_Position = vec4(uC + p * vec2(1.0, 1.0), 0.0, 1.0);
    // les points de queue pas encore nés (u < 0) ne sont pas visibles
    vL = (u < 0.0 ? 0.0 : 1.0) * b.z * step(0.0, a.z);
    vK = vec2(aK.x, aK.y);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vK; varying float vL;
  void main(){
    float across = exp(-vK.y * vK.y * 3.2);
    float along = pow(1.0 - vK.x, 1.9);
    float head = exp(-vK.x * 55.0);
    // tête #fff4e0, queue vers l'horizon bleu #7fd6ff (glace et poussière), jamais criarde
    vec3 col = mix(vec3(0.498, 0.839, 1.0) * 0.55, vec3(1.0, 0.957, 0.878), head);
    float a = across * (along * 0.32 + head * 0.9) * vL;
    gl_FragColor = vec4(col * a, 1.0);
  }
`;

interface Comet { t: number; dur: number; az: number; r0: number; turns: number; dir: number; len: number; width: number; gain: number }

export function createComets(): SceneElement {
  const P = { intensity: 1.0, onS3: 5.5, elsewhere: 26, duration: 5.5, length: 0.34 };
  const slots: (Comet | null)[] = Array.from({ length: MAX }, () => null);
  let mat: THREE.ShaderMaterial, scene: THREE.Scene, geo: THREE.BufferGeometry;
  let nextIn = 2; // secondes avant la prochaine comète (au rythme « ailleurs » ; accéléré sur S3)
  let lastT = -1;
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);

  function spawn(boost: number) {
    const i = slots.findIndex((s) => !s);
    if (i < 0) return;
    slots[i] = {
      t: 0, dur: P.duration * rnd(0.8, 1.2) * boost, az: rnd(0, Math.PI * 2), r0: rnd(1.55, 2.1),
      turns: rnd(0.22, 0.42), dir: Math.random() < 0.5 ? 1 : -1, len: P.length * rnd(0.8, 1.15), width: rnd(0.004, 0.007), gain: rnd(0.8, 1.15),
    };
  }

  return {
    id: "cometes",
    label: "9 · Comètes",
    slides: "all",
    cost: "leger",
    minTier: "basse",
    layers: ["back"],
    init() {
      const pos: number[] = [], k: number[] = [], idx: number[] = [];
      for (let s = 0; s <= SEG; s++) {
        const x = s / SEG;
        k.push(x, -1, x, 1);
        pos.push(0, 0, 0, 0, 0, 0);
      }
      for (let s = 0; s < SEG; s++) {
        const a = s * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
      const ibg = new THREE.InstancedBufferGeometry();
      ibg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      ibg.setAttribute("aK", new THREE.Float32BufferAttribute(k, 2));
      ibg.setIndex(idx);
      ibg.setAttribute("aIdx", new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2]), 1));
      ibg.instanceCount = MAX;
      geo = ibg;
      mat = new THREE.ShaderMaterial({
        uniforms: {
          uA: { value: Array.from({ length: MAX }, () => new THREE.Vector4(0, 1, -1, 1)) },
          uB: { value: Array.from({ length: MAX }, () => new THREE.Vector4(0.3, 0.3, 0, 0.008)) },
          uC: { value: new THREE.Vector2() }, uAspect: { value: 1 }, uRh: { value: 0.27 },
        },
        vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(geo, mat);
      m.frustumCulled = false;
      scene = new THREE.Scene().add(m);
    },
    update(f: FrameParams) {
      if (lastT < 0 || f.time - lastT > 0.25) nextIn = Math.min(nextIn, 1.5);
      lastT = f.time;
      const onS3 = f.slide === S(3) ? f.weight : 0;
      nextIn -= f.dt * (1 + onS3 * (P.elsewhere / P.onS3 - 1)); // le décompte s'accélère sur S3
      if (nextIn <= 0) {
        spawn(1);
        nextIn = P.elsewhere * rnd(0.7, 1.3);
      }
      const A = mat.uniforms.uA.value as THREE.Vector4[], B = mat.uniforms.uB.value as THREE.Vector4[];
      const k = (f.reduced ? 0.7 : 1) * P.intensity;
      for (let i = 0; i < MAX; i++) {
        const c = slots[i];
        if (!c) { A[i].set(0, 1, -1, 1); B[i].z = 0; continue; }
        c.t += f.dt;
        const u = c.t / c.dur;
        if (u > 1 + c.len) { slots[i] = null; A[i].set(0, 1, -1, 1); B[i].z = 0; continue; }
        // la tête s'accélère en tombant : avancement ∝ u² mêlé à u
        const adv = Math.min(1.02, 0.25 * u + 0.75 * u * u);
        const fadeIn = Math.min(1, c.t / 0.6);
        A[i].set(c.az, c.r0, adv, c.dir);
        B[i].set(c.turns, c.len, k * c.gain * fadeIn, c.width);
      }
      mat.uniforms.uC.value.copy(f.bhNdc);
      mat.uniforms.uAspect.value = f.width / f.height;
      mat.uniforms.uRh.value = f.rhNdc;
    },
    render(_layer, ctx: SceneContext) {
      ctx.renderer.render(scene, ctx.ortho);
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
    gui(folder) {
      folder.add(P, "intensity", 0, 3, 0.05).name("Intensité");
      folder.add(P, "onS3", 2, 20, 0.5).name("Intervalle sur S3 (s)");
      folder.add(P, "elsewhere", 8, 90, 1).name("Intervalle ailleurs (s)");
      folder.add(P, "duration", 2, 12, 0.1).name("Durée du passage (s)");
      folder.add(P, "length", 0.1, 0.8, 0.01).name("Longueur de queue");
      folder.add({ now: () => spawn(1) }, "now").name("Lancer une comète");
    },
  };
}

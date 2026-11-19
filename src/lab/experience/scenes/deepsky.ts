import * as THREE from "three";
import { FS_VERT } from "../shaders/common";
import { KEYS, cameraPose, makePose } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   10 · Ciel profond (couche "sky" : galaxies, nébuleuses, étoiles brillantes, rémanent de supernova).
   Tous les objets ont une VRAIE position dans le monde (distance finie). Chaque image, leur direction et leur taille
   apparentes sont recalculées depuis la caméra : si on change de point de vue, un objet reste donc où il doit être
   (parallaxe comprise) et ne disparaît jamais tant qu'il est dans le champ. Ils sont dessinés dans la cible
   équirectangulaire du ciel, donc courbés par la lentille du trou noir.
   Aspiration : une galaxie « neutre » sur sa slide de départ tombe ensuite en spirale vers le trou noir
   (étirée, plus petite, plus faible) et a disparu 3 slides plus tard ; `u = (s − départ) / 3`, donc l'animation suit la
   caméra et se rejoue à l'envers quand on revient en arrière.
   ─────────────────────────────────────────────────────────── */

const N = 10;
const INFALL_SLIDES = 3;

const FRAG = /* glsl */ `
  #define N ${N}
  varying vec2 vUv;
  uniform vec4 uC[N];    // xyz : direction caméra → objet ; w : rayon apparent (tangente)
  uniform vec4 uE1[N];   // xyz : axe 1 du plan tangent ; w : type (0 galaxie, 1 nébuleuse, 2 étoile, 3 supernova)
  uniform vec4 uE2[N];   // xyz : axe 2 ; w : luminosité (0 = absent)
  uniform vec4 uA[N];    // x : angle du grand axe ; y : rapport d'inclinaison ; z : phase de rotation ; w : graine
  uniform vec4 uS[N];    // x : étirement (≥ 1) ; y : angle de l'étirement (vers le trou noir)
  uniform vec3 uCol1[N], uCol2[N];
  float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int k = 0; k < 4; k++){ s += a * vn(p); p = p * 2.03 + vec2(5.2, 1.3); a *= 0.5; } return s; }

  vec3 galaxy(vec2 g, vec4 A, vec3 c1, vec3 c2){
    float ca = cos(A.x), sa = sin(A.x);
    vec2 p = vec2(ca * g.x + sa * g.y, -sa * g.x + ca * g.y);
    p.y /= A.y;
    float r = length(p);
    if (r > 1.6) return vec3(0.0);
    float th = atan(p.y, p.x) + A.z;
    float arm = pow(0.5 + 0.5 * cos(2.0 * (th - 2.4 * log(r + 0.04))), 2.2);
    float disk = exp(-r * 2.6);
    float grain = vn(p * 9.0 + A.w) * 0.6 + vn(p * 21.0) * 0.4;
    float dust = smoothstep(0.35, 0.8, vn(p * 5.0 + 7.0 + arm * 2.0));
    float bulge = exp(-r * r * 38.0);
    vec3 armCol = mix(c1, c1 * 0.6 + vec3(0.2, 0.3, 0.3), grain);
    vec3 col = armCol * disk * (0.12 + 0.88 * arm) * (0.45 + 0.9 * grain) * (1.0 - 0.55 * dust * arm) * 0.9;
    col += c2 * bulge * 1.6 + vec3(1.0, 0.95, 0.88) * exp(-r * r * 400.0) * 1.2;
    vec2 sc = floor(p * 70.0);
    float star = step(0.985, h21(sc + A.w)) * exp(-dot(fract(p * 70.0) - 0.5, fract(p * 70.0) - 0.5) * 30.0) * disk * (0.3 + arm);
    col += star * vec3(0.9, 0.95, 1.0) * 1.4;
    return col * smoothstep(1.6, 0.9, r);
  }
  vec3 nebula(vec2 g, vec4 A, vec3 c1, vec3 c2){
    float r2 = dot(g, g);
    if (r2 > 2.2) return vec3(0.0);
    float n = fbm(g * 1.7 + A.w), n2 = fbm(g * 3.1 - A.w);
    float env = exp(-r2 * 1.1);
    float dens = smoothstep(0.3, 0.85, n) * env;
    return mix(c1, c2, smoothstep(0.3, 0.8, n2)) * dens * 0.55 + c1 * env * 0.05;
  }
  vec3 starObj(vec2 g, vec3 c1){
    float r = length(g);
    float core = exp(-r * r * 160.0) * 2.2 + exp(-r * 9.0) * 0.18;
    float spk = exp(-abs(g.x) * 70.0) * exp(-abs(g.y) * 3.0) + exp(-abs(g.y) * 70.0) * exp(-abs(g.x) * 3.0);
    return mix(vec3(1.0), c1, 0.6) * (core + spk * 0.45);
  }
  vec3 remnant(vec2 g, vec4 A, vec3 c1, vec3 c2){
    float r = length(g);
    if (r > 1.5) return vec3(0.0);
    float ang = atan(g.y, g.x);
    float n = fbm(vec2(ang * 2.4 + A.w, r * 5.0));
    float shell = exp(-pow((r - 0.58 - 0.05 * n) / 0.085, 2.0)) * (0.35 + 1.3 * n);
    float haze = exp(-pow((r - 0.45) / 0.35, 2.0)) * 0.12 * fbm(g * 4.0 + A.w);
    vec3 col = mix(c1, c2, smoothstep(0.5, 0.72, r)) * (shell + haze);
    col += vec3(1.0, 0.95, 0.9) * exp(-r * r * 500.0) * 1.2;   // reste d'étoile au centre
    return col;
  }

  void main(){
    float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.14159265;
    vec3 d = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
    vec3 col = vec3(0.0);
    for (int i = 0; i < N; i++){
      float br = uE2[i].w;
      if (br <= 0.0) continue;
      float c = dot(d, uC[i].xyz);
      if (c < 0.3) continue;
      vec2 g = vec2(dot(d, uE1[i].xyz), dot(d, uE2[i].xyz)) / c / uC[i].w;
      if (dot(g, g) > 6.0) continue;
      float st = uS[i].x;
      if (st > 1.001){
        vec2 sd = vec2(cos(uS[i].y), sin(uS[i].y));
        float al = dot(g, sd);
        g = sd * (al / st) + (g - al * sd) * sqrt(st);   // spaghettification : étiré vers le trou noir
      }
      float t = uE1[i].w;
      vec3 o = t < 0.5 ? galaxy(g, uA[i], uCol1[i], uCol2[i])
             : t < 1.5 ? nebula(g, uA[i], uCol1[i], uCol2[i])
             : t < 2.5 ? starObj(g, uCol1[i]) : remnant(g, uA[i], uCol1[i], uCol2[i]);
      col += o * br;
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

type Kind = 0 | 1 | 2 | 3;
interface Obj {
  kind: Kind;
  /** Diapo de fond (0-based), décalage à droite / en haut et profondeur derrière le trou noir, dans le plan de cette slide. */
  slide: number; x: number; y: number; depth: number;
  radius: number;
  /** Normale du disque (galaxies) : donne l'inclinaison apparente selon le point de vue. */
  normal: [number, number, number];
  gain: number;
  c1: string; c2: string;
  /** Slide où l'aspiration commence (la galaxie est neutre sur cette slide, absorbée 3 slides plus tard). */
  infall?: number;
  seed: number;
}

const OBJECTS: Obj[] = [
  { kind: 0, slide: 0, x: -16, y: 5, depth: 38, radius: 13, normal: [0.3, 0.8, 0.5], gain: 2.4, c1: "#6a85f2", c2: "#ffd39a", infall: 0, seed: 3 }, // S1 → aspirée jusqu'à S4
  { kind: 2, slide: 1, x: 10, y: 8, depth: 50, radius: 3.5, normal: [0, 1, 0], gain: 1.0, c1: "#9fd0ff", c2: "#ffffff", seed: 1 },
  { kind: 0, slide: 1, x: -18, y: -6, depth: 60, radius: 10, normal: [-0.5, 0.7, 0.2], gain: 1.6, c1: "#7fd6ff", c2: "#ffb347", seed: 8 },
  { kind: 1, slide: 2, x: 8, y: -6, depth: 45, radius: 22, normal: [0, 1, 0], gain: 0.4, c1: "#3a56d8", c2: "#9a5cf0", seed: 5 }, // nébuleuse bleu-violet
  { kind: 3, slide: 3, x: -12, y: 8, depth: 40, radius: 9, normal: [0, 1, 0], gain: 1.4, c1: "#7fd6ff", c2: "#ff5a1f", seed: 2 }, // rémanent de supernova
  { kind: 0, slide: 4, x: 14, y: 4, depth: 40, radius: 9, normal: [0.6, 0.5, -0.4], gain: 2.4, c1: "#ffb347", c2: "#fff4e0", infall: 4, seed: 11 }, // S5 → aspirée jusqu'à S8
  { kind: 1, slide: 5, x: -10, y: -8, depth: 40, radius: 20, normal: [0, 1, 0], gain: 0.4, c1: "#ff5a1f", c2: "#8a1a05", seed: 6 }, // nébuleuse chaude
  { kind: 2, slide: 6, x: -8, y: 6, depth: 50, radius: 3, normal: [0, 1, 0], gain: 1.0, c1: "#ffb347", c2: "#ffffff", seed: 4 },
  { kind: 1, slide: 7, x: 10, y: 8, depth: 45, radius: 18, normal: [0, 1, 0], gain: 0.4, c1: "#1b4dff", c2: "#7fd6ff", seed: 9 },
];

const col = (hex: string) => new THREE.Color(hex);

export function createDeepSky(): SceneElement {
  const P = { intensity: 1.0, size: 1.0, stretch: 1.0 };
  let mat: THREE.ShaderMaterial, scene: THREE.Scene, tri: THREE.BufferGeometry;
  const home: THREE.Vector3[] = []; // position de départ de chaque objet
  const normals: THREE.Vector3[] = [];
  const pos = new THREE.Vector3(), dir = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const nrm = new THREE.Vector3(), tmp = new THREE.Vector3(), toBh = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  return {
    id: "ciel",
    label: "10 · Ciel profond (galaxies, nébuleuses…)",
    slides: "all",
    cost: "leger",
    minTier: "basse",
    layers: ["sky"],
    init() {
      // position monde = derrière le trou noir, vue depuis la slide de l'objet
      const pose = makePose();
      for (const o of OBJECTS) {
        cameraPose(Math.min(o.slide, KEYS.length - 1), 0, 0, pose);
        home.push(pose.pos.clone().addScaledVector(pose.f, pose.pos.length() + o.depth).addScaledVector(pose.r, o.x).addScaledVector(pose.u, o.y));
        normals.push(new THREE.Vector3(...o.normal).normalize());
      }
      tri = new THREE.BufferGeometry();
      tri.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
      tri.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
      const v4 = () => Array.from({ length: N }, () => new THREE.Vector4());
      mat = new THREE.ShaderMaterial({
        uniforms: {
          uC: { value: v4() }, uE1: { value: v4() }, uE2: { value: v4() }, uA: { value: v4() }, uS: { value: v4() },
          uCol1: { value: Array.from({ length: N }, (_, i) => col(OBJECTS[i]?.c1 ?? "#000000")) },
          uCol2: { value: Array.from({ length: N }, (_, i) => col(OBJECTS[i]?.c2 ?? "#000000")) },
        },
        vertexShader: FS_VERT, fragmentShader: FRAG,
        transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
      });
      const m = new THREE.Mesh(tri, mat);
      m.frustumCulled = false;
      scene = new THREE.Scene().add(m);
    },
    update(f: FrameParams) {
      const u = mat.uniforms;
      const C = u.uC.value as THREE.Vector4[], E1 = u.uE1.value as THREE.Vector4[], E2 = u.uE2.value as THREE.Vector4[];
      const A = u.uA.value as THREE.Vector4[], S = u.uS.value as THREE.Vector4[];
      OBJECTS.forEach((o, i) => {
        // aspiration : progression 0 → 1 sur INFALL_SLIDES slides à partir de la slide de départ (suit la caméra)
        const k = o.infall === undefined ? 0 : Math.min(1, Math.max(0, (f.s - o.infall) / INFALL_SLIDES));
        pos.copy(home[i]);
        let scale = 1, vis = 1;
        if (k > 0) {
          const kk = k * k * (3 - 2 * k) * 0.35 + k * 0.65; // départ doux, fin franche
          const r0 = Math.hypot(pos.x, pos.z), ang = Math.atan2(pos.z, pos.x) - 5.2 * Math.pow(kk, 1.15); // tourne dans le sens du disque
          const r = r0 * Math.pow(1 - kk, 1.25);
          pos.set(Math.cos(ang) * r, pos.y * (1 - kk), Math.sin(ang) * r);
          scale = 1 - 0.55 * k;
          vis = 1 - Math.pow(k, 5);
        }
        dir.copy(pos).sub(f.camPos);
        const dist = dir.length();
        if (dist < 2 || vis <= 0.001) { E2[i].w = 0; return; }
        dir.divideScalar(dist);
        e1.crossVectors(dir, UP).normalize();
        e2.crossVectors(e1, dir).normalize();
        const tanR = Math.min(0.9, (o.radius * scale * P.size) / dist);
        C[i].set(dir.x, dir.y, dir.z, tanR);
        E1[i].set(e1.x, e1.y, e1.z, o.kind);
        E2[i].set(e2.x, e2.y, e2.z, o.gain * P.intensity * vis);
        // inclinaison apparente du disque : l'axe court est la projection de la normale sur le plan du ciel
        nrm.copy(normals[i]);
        const cosi = Math.min(1, Math.max(0.22, Math.abs(nrm.dot(dir))));
        tmp.copy(nrm).addScaledVector(dir, -nrm.dot(dir));
        const major = Math.atan2(tmp.dot(e2), tmp.dot(e1)) + Math.PI / 2;
        A[i].set(major, cosi, f.time * 0.012, o.seed * 7.3);
        // étirement vers le trou noir
        let st = 1;
        let sa = 0;
        if (k > 0) {
          toBh.copy(pos).negate().normalize();
          sa = Math.atan2(toBh.dot(e2), toBh.dot(e1));
          st = 1 + 4.5 * k * k * P.stretch;
        }
        S[i].set(st, sa, 0, 0);
      });
    },
    render(_layer, ctx: SceneContext) {
      ctx.renderer.render(scene, ctx.ortho);
    },
    dispose() {
      tri.dispose();
      mat.dispose();
    },
    gui(folder) {
      folder.add(P, "intensity", 0, 3, 0.05).name("Intensité");
      folder.add(P, "size", 0.4, 2, 0.05).name("Taille");
      folder.add(P, "stretch", 0, 3, 0.05).name("Étirement (aspiration)");
    },
  };
}

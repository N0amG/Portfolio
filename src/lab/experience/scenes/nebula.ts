import * as THREE from "three";
import { FS_VERT } from "../shaders/common";
import { NEBULA_POS, NEBULA_VIA, S, TAN_HALF } from "../timeline";
import type { TierName } from "../quality";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   4 · Nébuleuse (S4, élément central du plan ; reste visible au fond sur S5 et derrière le trou noir sur S6).
   Un vrai volume de gaz fixe dans le monde (sphère englobante de rayon R centrée sur NEBULA_POS, point focal de S4),
   raymarché à chaque image depuis la position réelle de la caméra : profondeur et parallaxe internes pendant les
   transitions. Le volume est rendu dans un petit « patch » (projection gnomonique autour de la direction caméra →
   nébuleuse, taille selon la qualité automatique), que le shader du trou noir échantillonne au bout de ses rayons
   courbés (BlackholeParams.neb, comme le texte géant 18) : lentille, anneau d'Einstein et bloom gratuits, et la
   poussière masque les étoiles du fond.
   - Densité : bruit 3D précalculé (texture 64³ répétable, 4 canaux) avec déformation de domaine ; filaments = bruit
     « en crête » ; bandes de poussière = champ séparé qui absorbe sans émettre.
   - Étoiles jeunes : 4 sources dans le volume, qui éclairent le gaz (1/d²), creusent une cavité autour d'elles et
     apparaissent comme points brillants atténués par le gaz situé devant.
   Remplace la petite nébuleuse lointaine de S3 dans deepsky.ts (supprimée pour ne pas doubler).
   ─────────────────────────────────────────────────────────── */

const NOISE = 64;
const STEPS: Record<TierName, number> = { haute: 40, moyenne: 30, basse: 22 };
const PATCH: Record<TierName, number> = { haute: 832, moyenne: 576, basse: 416 };

/** Bruit de valeur 3D répétable (4 canaux à des fréquences différentes, 2 octaves chacun), normalisé 0..1. */
function makeNoise(): THREE.Data3DTexture {
  const n = NOISE, data = new Uint8Array(n * n * n * 4);
  const acc = new Float32Array(n * n * n);
  const periods = [[4, 8], [8, 16], [16, 32], [3, 6]];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  for (let ch = 0; ch < 4; ch++) {
    acc.fill(0);
    periods[ch].forEach((p, oi) => {
      const lat = new Float32Array(p * p * p);
      let seed = (ch * 977 + oi * 131 + 7) >>> 0;
      for (let i = 0; i < lat.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; lat[i] = seed / 4294967296; }
      const L = (x: number, y: number, z: number) => lat[((z % p) * p + (y % p)) * p + (x % p)];
      const amp = oi === 0 ? 0.65 : 0.35;
      for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const fx = (x * p) / n, fy = (y * p) / n, fz = (z * p) / n;
        const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
        const u = fade(fx - ix), v = fade(fy - iy), w = fade(fz - iz);
        const l = (a: number, b: number, t: number) => a + (b - a) * t;
        const c00 = l(L(ix, iy, iz), L(ix + 1, iy, iz), u), c10 = l(L(ix, iy + 1, iz), L(ix + 1, iy + 1, iz), u);
        const c01 = l(L(ix, iy, iz + 1), L(ix + 1, iy, iz + 1), u), c11 = l(L(ix, iy + 1, iz + 1), L(ix + 1, iy + 1, iz + 1), u);
        acc[(z * n + y) * n + x] += amp * l(l(c00, c10, v), l(c01, c11, v), w);
      }
    });
    let lo = Infinity, hi = -Infinity;
    for (const a of acc) { lo = Math.min(lo, a); hi = Math.max(hi, a); }
    for (let i = 0; i < acc.length; i++) data[i * 4 + ch] = Math.round(((acc[i] - lo) / (hi - lo)) * 255);
  }
  const tex = new THREE.Data3DTexture(data, n, n, n);
  tex.format = THREE.RGBAFormat;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

interface Star { p: [number, number, number]; i: number; c: string; halo: number }
const STARS: Star[] = [
  { p: [0.14, 0.06, -0.08], i: 1.0, c: "#cfe6ff", halo: 1 }, // replacée au-dessus du point de passage (étoile frôlée)
  { p: [0.24, -0.02, 0.04], i: 0.7, c: "#9fd0ff", halo: 1 },
  { p: [0.06, 0.13, 0.06], i: 0.55, c: "#fff4e0", halo: 1 },
  { p: [-0.38, -0.1, 0.22], i: 0.8, c: "#bfe3ff", halo: 1 },
  // deux petits points brillants au cœur de la nébuleuse, vus pendant la traversée : presque pas de halo ni d'éclairage
  { p: [0.02, -0.06, 0.16], i: 0.45, c: "#e6f2ff", halo: 0.08 },
  { p: [-0.12, 0.05, -0.14], i: 0.38, c: "#fff1dc", halo: 0.08 },
];

const FRAG = /* glsl */ `
  precision highp sampler3D;
  varying vec2 vUv;
  uniform sampler3D uNoise;
  uniform vec3 uCam;              // caméra dans le repère local (unités de R)
  uniform vec3 uC, uE1, uE2;      // direction du patch et axes (monde, × demi-ouverture)
  uniform mat3 uRot;              // monde → local
  uniform vec3 uScale;            // ellipsoïde de l'enveloppe
  uniform float uSteps, uDetail, uTime, uDensity, uDust, uGlow, uFil, uJitter, uLit, uTexAng, uStarSize;
  uniform vec3 uCol1, uCol2, uCol3;
  #define NS ${STARS.length}
  uniform vec4 uStar[NS];         // xyz = position locale, w = intensité
  uniform vec3 uStarCol[NS];
  uniform float uStarHalo[NS];    // halo et éclairage du gaz (1 = étoile jeune, ≈ 0,1 = simple point brillant)

  float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

  void main(){
    vec2 g = vUv * 2.0 - 1.0;
    vec3 d = normalize(uRot * normalize(uC + g.x * uE1 + g.y * uE2));
    vec3 o = uCam;
    float b = dot(o, d), c = dot(o, o) - 1.0, h = b * b - c;
    if (h <= 0.0){ gl_FragColor = vec4(0.0); return; }
    h = sqrt(h);
    float t0 = max(-b - h, 0.0), t1 = -b + h, span = t1 - t0;
    // caméra dans le volume (traversée) : pas resserrés près de la caméra (t = u²), sinon pas réguliers
    bool ins = c < 0.0;
    float jit = 0.5 + uJitter * (ign(gl_FragCoord.xy) - 0.5);
    float t = t0, dt = span / uSteps;
    // points brillants des étoiles : distance de passage la plus proche ; on note la transmission atteinte à cette profondeur
    float tc[NS], Ts[NS];
    for (int k = 0; k < NS; k++){ tc[k] = dot(uStar[k].xyz - o, d); Ts[k] = 1.0; }
    vec3 col = vec3(0.0);
    float T = 1.0;
    float drift = uTime * 0.006;
    for (int i = 0; i < 64; i++){
      if (float(i) >= uSteps || T < 0.01) break;
      float u0 = (float(i) + jit) / uSteps;
      t = ins ? t0 + span * u0 * u0 : t0 + span * u0;
      dt = ins ? max(span * 2.0 * u0, span * 0.5 / uSteps) / uSteps : span / uSteps;
      vec3 q = o + d * t;
      float r = length(q / uScale);
      float env = 1.0 - smoothstep(0.3, 1.0, r);
      if (env > 0.0){
        vec4 a = texture(uNoise, q * 0.42 + vec3(0.0, drift, drift * 0.5));
        vec3 w = q + (a.rgb - 0.5) * 0.7;                       // déformation de domaine : volutes
        vec4 n = texture(uNoise, w * 0.9 + vec3(0.37, -drift, 0.11));
        float det = uDetail > 0.5 ? texture(uNoise, w * 2.6 + 0.71).b - 0.5 : 0.0;
        // détail fin près de la caméra (traversée) : deux octaves de plus, seulement sur les premiers mètres
        float nd = uDetail * smoothstep(0.4, 0.04, t);
        float fine = 0.0;
        if (nd > 0.0){
          fine = ((texture(uNoise, w * 6.3 + vec3(drift * 4.0, 0.2, 0.0)).g - 0.5) * 0.45
                + (texture(uNoise, w * 15.0 - vec3(0.0, drift * 9.0, 0.4)).r - 0.5) * 0.3) * nd;
        }
        float base = n.r * 0.6 + n.g * 0.4 + det * 0.3 + fine;
        float ridge = 1.0 - abs(n.g * 2.0 - 1.0 + fine * 1.5);  // filaments : crêtes du bruit
        ridge *= ridge; ridge *= ridge; ridge *= ridge;
        // près de la caméra (traversée) : plus de vides, filaments et poussière plus marqués → du relief qui défile
        float near = smoothstep(0.5, 0.05, t);
        float gas = env * (smoothstep(0.42 + 0.14 * near, 0.78, base) * (0.7 - 0.25 * near)
                         + uFil * (1.0 + 1.8 * near) * ridge * smoothstep(0.35, 0.65, a.r));
        float dust = env * smoothstep(0.5 - 0.07 * near, 0.68 - 0.05 * near, a.a + (n.b - 0.5) * 0.45 + det * 0.2 + fine * 0.6);
        // étoiles jeunes : éclairage en 1/d² et cavité creusée autour d'elles
        vec3 lit = vec3(0.0);
        float cav = 1.0;
        for (int k = 0; k < NS; k++){
          vec3 dv = q - uStar[k].xyz;
          float d2 = dot(dv, dv);
          float hk = uStarHalo[k];
          lit += uStarCol[k] * (uStar[k].w * hk / (d2 * 28.0 + 0.35));
          cav *= smoothstep(0.0, 0.025 * uStar[k].w * hk, d2);
        }
        float clear = smoothstep(0.012, 0.06, t);                // pas de mur collé à la caméra
        gas *= cav * clear;
        dust *= clear;
        vec3 tint = mix(uCol1, uCol2 * 1.6, smoothstep(0.45, 0.7, n.b + det * 0.3 + ridge * 0.25));
        vec3 emis = gas * (tint * uGlow + lit * mix(uCol3, tint * 1.4, 0.45) * uLit) + dust * lit * uCol3 * 0.05;
        float sig = (gas * 0.5 + dust * uDust) * uDensity;
        col += T * emis * dt * uDensity;
        T *= exp(-sig * dt);
      }
      for (int k = 0; k < NS; k++) if (t < tc[k]) Ts[k] = T;
    }
    // points des étoiles (taille en texels du patch : nets malgré la basse résolution, puis pris dans le bloom)
    for (int k = 0; k < NS; k++){
      if (tc[k] <= 0.0) continue;
      vec3 dv = o + d * tc[k] - uStar[k].xyz;
      float ang = length(dv) / tc[k] / uTexAng;
      float dp = length(dv);
      float hk = uStarHalo[k];
      float pt = exp(-ang * ang / (uStarSize * uStarSize)) * 6.0
               + hk * (0.25 / (1.0 + ang * ang * 0.02) + 0.0004 / (dp * dp + 0.00002));   // halo (physique : éblouit de près)
      col += uStarCol[k] * uStar[k].w * pt * Ts[k];
    }
    gl_FragColor = vec4(col, 1.0 - T);
  }
`;


export function createNebula(): SceneElement {
  const P = {
    gain: 1.2, density: 3.2, dust: 12, glow: 0.7, lit: 0.6, filaments: 1.4, jitter: 1, starSize: 1.4,
    radius: 34, inside: 1.3, flyby: 3.2,
    col1: "#2440c8", col2: "#c8402e", col3: "#9fdcff",
    edge: 0.3,
  };
  let placeFlyby = () => {};
  let mat: THREE.ShaderMaterial, scene: THREE.Scene, tri: THREE.BufferGeometry, rt: THREE.WebGLRenderTarget;
  let noise: THREE.Data3DTexture;
  const center = new THREE.Vector3(...NEBULA_POS), rel = new THREE.Vector3(), dir = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const local2world = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.55, 1.1, 0.25));
  const world2local = new THREE.Matrix3().setFromMatrix4(local2world).transpose();
  let pw = 0, ph = 0;
  const flyby = new THREE.Vector3();

  return {
    id: "nebuleuse",
    label: "4 · Nébuleuse (S4)",
    slides: [S(5), S(6), S(7)],
    cost: "moyen",
    minTier: "basse",
    layers: ["sky"],
    init() {
      noise = makeNoise();
      placeFlyby = () => {
        flyby.set(...NEBULA_VIA).add(new THREE.Vector3(0, P.flyby, 0)).sub(center).divideScalar(P.radius).applyMatrix3(world2local);
        (mat.uniforms.uStar.value as THREE.Vector4[])[0].set(flyby.x, flyby.y, flyby.z, 1.2);
      };
      tri = new THREE.BufferGeometry();
      tri.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
      tri.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
      rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
      mat = new THREE.ShaderMaterial({
        uniforms: {
          uNoise: { value: noise }, uCam: { value: new THREE.Vector3() },
          uC: { value: new THREE.Vector3() }, uE1: { value: new THREE.Vector3() }, uE2: { value: new THREE.Vector3() },
          uRot: { value: world2local }, uScale: { value: new THREE.Vector3(1, 0.55, 0.8) },
          uSteps: { value: 40 }, uDetail: { value: 1 }, uTime: { value: 0 }, uDensity: { value: 1 }, uDust: { value: 1 },
          uGlow: { value: 1 }, uFil: { value: 1 }, uJitter: { value: 1 }, uLit: { value: 1 }, uTexAng: { value: 0.001 },
          uStarSize: { value: 1.4 },
          uCol1: { value: new THREE.Color() }, uCol2: { value: new THREE.Color() }, uCol3: { value: new THREE.Color() },
          uStar: { value: STARS.map((s) => new THREE.Vector4(...s.p, s.i)) },
          uStarCol: { value: STARS.map((s) => new THREE.Color(s.c)) },
          uStarHalo: { value: STARS.map((s) => s.halo) },
        },
        vertexShader: FS_VERT, fragmentShader: FRAG,
        blending: THREE.NoBlending, depthTest: false, depthWrite: false,
      });
      // étoile 0 : placée au-dessus du point de passage de la traversée (S4 → S5), la caméra la frôle
      placeFlyby();
      const m = new THREE.Mesh(tri, mat);
      m.frustumCulled = false;
      scene = new THREE.Scene().add(m);
    },
    update(f: FrameParams) {
      // résolution du patch : niveau de qualité × résolution interne du trou noir (sortie comprise)
      const base = PATCH[f.tier] * Math.min(1, Math.max(0.55, f.res * f.outScale));
      rel.copy(f.camPos).sub(center);
      const dist = rel.length();
      // Deux cadrages du patch (le contenu raymarché est le même) :
      // - de loin : centré sur la nébuleuse, couvre toute la sphère (la lentille peut aller chercher n'importe quel bord) ;
      // - de près ou dedans (traversée) : le champ de la caméra, avec une marge.
      const inside = dist < P.radius * P.inside;
      let tanX: number, tanY: number, w: number, h: number;
      if (inside) {
        tanY = TAN_HALF * 1.12;
        tanX = tanY * (f.width / f.height);
        dir.copy(f.camF); e1.copy(f.camR); e2.copy(f.camU);
        w = Math.round(base * 1.2); h = Math.round((w * tanY) / tanX);
      } else {
        dir.copy(rel).negate().divideScalar(dist);
        e1.crossVectors(dir, UP).normalize();
        e2.crossVectors(e1, dir);
        tanX = tanY = Math.tan(Math.asin(Math.min(0.97, (P.radius * 1.02) / dist)));
        w = h = Math.round(base);
      }
      if (w !== pw || h !== ph) { pw = w; ph = h; rt.setSize(w, h); }
      const u = mat.uniforms;
      u.uCam.value.copy(rel).divideScalar(P.radius).applyMatrix3(world2local);
      u.uC.value.copy(dir);
      u.uE1.value.copy(e1).multiplyScalar(tanX);
      u.uE2.value.copy(e2).multiplyScalar(tanY);
      u.uSteps.value = STEPS[f.tier];
      u.uDetail.value = f.tier === "basse" ? 0 : 1;
      u.uTime.value = f.time;
      u.uDensity.value = P.density; u.uDust.value = P.dust; u.uGlow.value = P.glow; u.uLit.value = P.lit;
      u.uFil.value = P.filaments; u.uJitter.value = P.jitter; u.uStarSize.value = P.starSize;
      u.uTexAng.value = (2 * tanY) / h;
      (u.uCol1.value as THREE.Color).set(P.col1); (u.uCol2.value as THREE.Color).set(P.col2); (u.uCol3.value as THREE.Color).set(P.col3);
      // paramètres du shader du trou noir (e1, e2 divisés par la demi-ouverture : uv = g × 0,5 + 0,5)
      const nb = f.bh.neb;
      nb.tex.value = rt.texture;
      nb.c.set(dir.x, dir.y, dir.z, P.gain * THREE.MathUtils.smoothstep(f.weight, 0, P.edge));
      nb.e1.copy(e1).divideScalar(tanX);
      nb.e2.copy(e2).divideScalar(tanY);
      // devant ou derrière le trou noir : dans le volume, le gaz est entre la caméra et tout le reste
      nb.front.value = 1 - THREE.MathUtils.smoothstep(dist, P.radius * 0.95, P.radius * 1.25);
      nb.fill.value = inside ? 1 : 0;
    },
    render(_layer, ctx: SceneContext) {
      // le patch est rendu juste avant la passe du trou noir (couche "sky"), dans sa propre cible
      const r = ctx.renderer, prev = r.getRenderTarget();
      r.setRenderTarget(rt);
      r.render(scene, ctx.ortho);
      r.setRenderTarget(prev);
    },
    dispose() {
      tri.dispose();
      mat.dispose();
      rt.dispose();
      noise.dispose();
    },
    gui(folder) {
      folder.add(P, "gain", 0, 3, 0.05).name("Intensité");
      folder.add(P, "density", 0.5, 8, 0.1).name("Densité");
      folder.add(P, "dust", 0, 25, 0.5).name("Poussière (absorption)");
      folder.add(P, "glow", 0, 2, 0.05).name("Émission propre du gaz");
      folder.add(P, "lit", 0, 2, 0.05).name("Éclairage des étoiles jeunes");
      folder.add(P, "filaments", 0, 3, 0.05).name("Filaments");
      folder.add(P, "starSize", 0.5, 4, 0.1).name("Taille des étoiles (texels)");
      folder.add(P, "jitter", 0, 1, 0.05).name("Tramage des pas");
      folder.addColor(P, "col1").name("Couleur du gaz");
      folder.addColor(P, "col2").name("Couleur des bords ionisés");
      folder.addColor(P, "col3").name("Lumière des étoiles");
      folder.add(P, "radius", 10, 38, 0.5).name("Rayon");
      folder.add(P, "flyby", 0, 12, 0.1).name("Traversée : distance de l'étoile frôlée").onChange(() => placeFlyby());
      folder.add(P, "inside", 1, 2, 0.05).name("Traversée : passage au cadrage caméra (× rayon)");
      folder.add(P, "edge", 0, 1, 0.05).name("Fondu en bord de fenêtre");
    },
  };
}

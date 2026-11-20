import * as THREE from "three";
import { PULSAR_POS, S } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   8 · Astéroïdes / débris (🟢, champ autour du pulsar, S4 ± 1 : dérive pendant S3 → S4 et S4 → S5).
   Une seule draw call : géométrie instanciée (icosaèdre subdivisé), tout est calculé dans le vertex shader depuis le
   temps (aucune boucle JS par rocher) :
   - orbite képlérienne autour du pulsar (ω ∝ r^-1,5) dans un disque épais incliné (plan de normale `uN`) ;
   - forme irrégulière procédurale : déplacement par bruit de valeur de chaque sommet, étirement propre au rocher ;
   - rotation propre (axe et vitesse par rocher, formule de Rodrigues).
   Éclairage : le pulsar (source dominante de la slide), lumière blanc-bleu, éclat en 1/(1 + (d/d0)²), normales à facettes
   (dérivées d'écran), ombre propre (terminateur) ; bruit d'albédo par rocher. Couche "front", tampon de profondeur vidé
   avant la passe. Fondu en taille (les rochers rétrécissent) en bord de fenêtre et quand ils frôlent la caméra.
   ─────────────────────────────────────────────────────────── */

const NOISE = /* glsl */ `
  float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vn3(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
`;

const VERT = /* glsl */ `
  ${NOISE}
  attribute vec4 aA;   // r, phase, hauteur, taille
  attribute vec4 aB;   // vitesse de rotation, graine, étirement x, étirement z
  attribute vec3 aC;   // axe de rotation (unitaire)
  uniform vec3 uP, uE1, uE2, uN, uCamPos;
  uniform float uTime, uFade, uSpeed, uSize, uRough;
  varying vec3 vW, vO;
  varying float vSeed;
  void main(){
    float r = aA.x;
    float th = aA.y + uTime * uSpeed * 2.2 * pow(r, -1.5);
    vec3 c = uP + (uE1 * cos(th) + uE2 * sin(th)) * r + uN * aA.z;
    // forme : sphère déformée par un bruit de valeur à 2 octaves, puis étirée
    vec3 d = normalize(position);
    float n = 0.65 * vn3(d * 1.6 + aB.y * 31.0) + 0.35 * vn3(d * 3.7 - aB.y * 17.0);
    vec3 p = d * (0.55 + uRough * (n - 0.35)) * vec3(aB.z, 1.0, aB.w);
    float a = aB.x * uTime + aB.y * 6.2831;
    float ca = cos(a), sa = sin(a);
    vec3 ax = aC;
    p = p * ca + cross(ax, p) * sa + ax * dot(ax, p) * (1.0 - ca);   // Rodrigues
    vO = d * 2.0 + aB.y * 13.0;
    float near = smoothstep(0.6, 2.4, distance(c, uCamPos));            // un rocher qui frôle la caméra rétrécit
    vec3 w = c + p * aA.w * uSize * uFade * near;
    vW = w; vSeed = aB.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
  }
`;

const FRAG = /* glsl */ `
  ${NOISE}
  uniform vec3 uP, uCamPos;
  uniform float uLight, uD0;
  varying vec3 vW, vO;
  varying float vSeed;
  void main(){
    vec3 N = normalize(cross(dFdx(vW), dFdy(vW)));
    vec3 V = normalize(uCamPos - vW);
    if (dot(N, V) < 0.0) N = -N;
    vec3 toL = uP - vW;
    float d = length(toL);
    vec3 L = toL / d;
    float lam = max(dot(N, L), 0.0);
    float I = uLight / (1.0 + (d / uD0) * (d / uD0));
    float n1 = vn3(vO * 2.3), n2 = vn3(vO * 7.1 + 3.0);
    vec3 alb = mix(vec3(0.17, 0.145, 0.13), vec3(0.50, 0.43, 0.37), n1);
    alb = mix(alb, vec3(0.42, 0.20, 0.10), smoothstep(0.55, 0.9, fract(vSeed * 7.0)) * 0.5);   // quelques rochers rouillés (#8a1a05 / #ff5a1f)
    alb *= 0.55 + 0.9 * n2;
    vec3 lc = vec3(0.80, 0.92, 1.0);
    vec3 col = alb * lc * lam * I + alb * vec3(0.106, 0.302, 1.0) * 0.14;
    col += lc * pow(max(dot(N, normalize(L + V)), 0.0), 24.0) * 0.05 * I * lam;   // petit reflet des faces lisses
    gl_FragColor = vec4(1.0 - exp(-col * 1.5), 1.0);
  }
`;

export function createDebris(): SceneElement {
  const P = {
    count: 300, rIn: 5, rOut: 26, thick: 2.2, size: 0.5, rough: 1.15, speed: 1,
    light: 4.5, d0: 22, edge: 0.3, tiltX: 0.25, tiltZ: 0.15,
  };
  const MAX = 800;
  let scene: THREE.Scene, mat: THREE.ShaderMaterial, geo: THREE.InstancedBufferGeometry, base: THREE.IcosahedronGeometry;
  const pos = new THREE.Vector3(...PULSAR_POS);
  const n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();

  function basis() {
    n.set(P.tiltX, 1, P.tiltZ).normalize();
    e1.crossVectors(n, new THREE.Vector3(0, 0, 1)).normalize();
    e2.crossVectors(n, e1);
  }
  function fill() {
    const A = new Float32Array(MAX * 4), B = new Float32Array(MAX * 4), C = new Float32Array(MAX * 3);
    // générateur déterministe (le champ est le même à chaque chargement)
    let st = 1234567;
    const rnd = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 4294967296);
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.15;
    for (let i = 0; i < MAX; i++) {
      const r = P.rIn + (P.rOut - P.rIn) * Math.pow(rnd(), 1.5);   // plus dense vers l'intérieur
      A.set([r, rnd() * Math.PI * 2, gauss() * P.thick * (0.4 + r / P.rOut), 0.07 + 0.55 * Math.pow(rnd(), 3.5)], i * 4);
      B.set([(rnd() - 0.5) * 1.6, rnd(), 0.65 + rnd() * 0.9, 0.65 + rnd() * 0.9], i * 4);
      const ax = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      C.set([ax.x, ax.y, ax.z], i * 3);
    }
    geo.setAttribute("aA", new THREE.InstancedBufferAttribute(A, 4));
    geo.setAttribute("aB", new THREE.InstancedBufferAttribute(B, 4));
    geo.setAttribute("aC", new THREE.InstancedBufferAttribute(C, 3));
  }

  return {
    id: "debris",
    label: "8 · Astéroïdes / débris (autour du pulsar)",
    slides: [S(4)],
    cost: "leger",
    minTier: "basse",
    layers: ["front"],
    init() {
      base = new THREE.IcosahedronGeometry(1, 2);
      geo = new THREE.InstancedBufferGeometry();
      geo.index = base.index;
      geo.setAttribute("position", base.getAttribute("position"));
      fill();
      geo.instanceCount = P.count;
      basis();
      mat = new THREE.ShaderMaterial({
        uniforms: {
          uP: { value: pos }, uE1: { value: e1 }, uE2: { value: e2 }, uN: { value: n }, uCamPos: { value: new THREE.Vector3() },
          uTime: { value: 0 }, uFade: { value: 0 }, uSpeed: { value: 1 }, uSize: { value: 1 }, uRough: { value: 1 },
          uLight: { value: 1 }, uD0: { value: 20 },
        },
        vertexShader: VERT, fragmentShader: FRAG, depthTest: true, depthWrite: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene = new THREE.Scene().add(mesh);
    },
    update(f: FrameParams) {
      const u = mat.uniforms;
      u.uCamPos.value.copy(f.camPos);
      u.uTime.value = f.time;
      u.uFade.value = THREE.MathUtils.smoothstep(f.weight, 0, P.edge);
      u.uSpeed.value = P.speed; u.uSize.value = P.size; u.uRough.value = P.rough;
      u.uLight.value = P.light; u.uD0.value = P.d0;
      geo.instanceCount = Math.min(MAX, Math.round(P.count * (f.reduced ? 0.5 : 1)));
    },
    render(_layer, ctx: SceneContext) {
      ctx.renderer.clearDepth();
      ctx.renderer.render(scene, ctx.camera);
    },
    dispose() {
      geo.dispose();
      base.dispose();
      mat.dispose();
    },
    gui(folder) {
      folder.add(P, "count", 50, MAX, 10).name("Nombre de rochers");
      folder.add(P, "size", 0.3, 3, 0.05).name("Taille");
      folder.add(P, "rough", 0, 1.8, 0.05).name("Irrégularité des formes");
      folder.add(P, "speed", 0, 6, 0.05).name("Vitesse d'orbite");
      folder.add(P, "light", 0, 15, 0.1).name("Éclairage du pulsar");
      folder.add(P, "d0", 5, 60, 0.5).name("Portée de l'éclairage");
      folder.add(P, "thick", 0, 5, 0.05).name("Épaisseur du champ").onChange(() => fill());
      folder.add(P, "rIn", 2, 10, 0.1).name("Rayon intérieur").onChange(() => fill());
      folder.add(P, "rOut", 8, 40, 0.5).name("Rayon extérieur").onChange(() => fill());
      folder.add(P, "tiltX", -1, 1, 0.01).name("Inclinaison X").onChange(basis);
      folder.add(P, "tiltZ", -1, 1, 0.01).name("Inclinaison Z").onChange(basis);
      folder.add(P, "edge", 0, 1, 0.05).name("Fondu en bord de fenêtre");
    },
  };
}

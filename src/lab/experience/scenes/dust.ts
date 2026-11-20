import * as THREE from "three";
import { TAN_HALF } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   15 · Poussière au premier plan (couche "front", toutes les slides).
   Particules fixes dans le monde, sur 3 couches de profondeur (boîtes de 7, 12 et 20 unités centrées sur la caméra,
   recyclées par modulo) : la parallaxe vient du vrai mouvement de la caméra, renforcée par la souris.
   Tout est calculé dans le vertex shader (aucune boucle JS par particule).
   ─────────────────────────────────────────────────────────── */

const PER_LAYER = 600;
const COUNT = PER_LAYER * 3;

const VERT = /* glsl */ `
  attribute vec4 aData;   // x : couche (0 proche … 2 lointaine), y : taille, z : phase, w : teinte
  uniform vec3 uCamPos, uCamR, uCamU, uCamF;
  uniform float uAspect, uTanHalf, uTime, uPx, uSize, uMouseK;
  uniform vec2 uMouse;
  varying float vA; varying float vT; varying float vSoft;
  void main(){
    float L = aData.x;
    float box = L < 0.5 ? 7.0 : (L < 1.5 ? 12.0 : 20.0);
    vec3 rel = mod(position * box - uCamPos + vec3(uTime * 0.05, uTime * 0.03, 0.0) + 0.5 * box, box) - 0.5 * box;
    vec3 v = vec3(dot(rel, uCamR), dot(rel, uCamU), dot(rel, uCamF));
    float near = 1.0 - L * 0.5;                                  // 1 proche, 0 lointaine
    v.x -= uMouse.x * uMouseK * near;                            // parallaxe souris : les plans proches bougent plus
    v.y += uMouse.y * uMouseK * near;
    if (v.z < 0.45){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; vT = 0.0; vSoft = 0.0; return; }
    gl_Position = vec4(v.x / (uTanHalf * uAspect * v.z), v.y / (uTanHalf * v.z), 0.0, 1.0);
    float tw = 0.7 + 0.3 * sin(uTime * (0.6 + aData.z * 1.7) + aData.z * 40.0);
    float fade = smoothstep(0.45, 1.6, v.z) * (1.0 - smoothstep(0.55 * box, 0.95 * box, v.z));
    float sz = uSize * (0.6 + aData.y) * (1.0 + near * 1.3) / v.z;
    gl_PointSize = clamp(sz * uPx, 1.5, 22.0 * uPx);
    vSoft = clamp(near * (0.3 + 0.7 * smoothstep(1.5, 0.6, v.z)), 0.0, 1.0);   // les grains très proches sont flous (bokeh)
    vA = fade * tw * (0.35 + 0.65 * aData.y) * (1.0 - 0.45 * vSoft);
    vT = aData.w;
  }
`;

const FRAG = /* glsl */ `
  uniform float uIntensity;
  varying float vA; varying float vT; varying float vSoft;
  void main(){
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * mix(7.0, 2.2, vSoft));
    vec3 col = mix(vec3(0.949, 0.937, 0.91), vec3(1.0, 0.70, 0.28), step(0.72, vT));   // #f2efe8, quelques grains ambre
    gl_FragColor = vec4(col * core * vA * uIntensity * 0.55, 1.0);
  }
`;

export function createDust(): SceneElement {
  const P = { intensity: 1.0, size: 1.4, mouse: 0.9 };
  let geo: THREE.BufferGeometry, mat: THREE.ShaderMaterial, scene: THREE.Scene;

  return {
    id: "poussiere",
    label: "15 · Poussière au premier plan",
    slides: "all",
    cost: "leger",
    minTier: "basse",
    layers: ["front"],
    init() {
      geo = new THREE.BufferGeometry();
      const pos = new Float32Array(COUNT * 3), data = new Float32Array(COUNT * 4);
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3] = Math.random(); pos[i * 3 + 1] = Math.random(); pos[i * 3 + 2] = Math.random();
        data[i * 4] = i % 3; // couches entrelacées : réduire le nombre de points garde les trois plans
        data[i * 4 + 1] = Math.random() ** 2;
        data[i * 4 + 2] = Math.random();
        data[i * 4 + 3] = Math.random();
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aData", new THREE.BufferAttribute(data, 4));
      mat = new THREE.ShaderMaterial({
        uniforms: {
          uCamPos: { value: new THREE.Vector3() }, uCamR: { value: new THREE.Vector3() },
          uCamU: { value: new THREE.Vector3() }, uCamF: { value: new THREE.Vector3() },
          uAspect: { value: 1 }, uTanHalf: { value: TAN_HALF }, uTime: { value: 0 }, uPx: { value: 1 },
          uSize: { value: P.size }, uMouseK: { value: 0 }, uMouse: { value: new THREE.Vector2() }, uIntensity: { value: 1 },
        },
        vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
      });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      scene = new THREE.Scene().add(pts);
    },
    update(f: FrameParams) {
      const u = mat.uniforms;
      u.uCamPos.value.copy(f.camPos); u.uCamR.value.copy(f.camR); u.uCamU.value.copy(f.camU); u.uCamF.value.copy(f.camF);
      u.uAspect.value = f.width / f.height;
      u.uTime.value = f.time;
      u.uPx.value = f.dpr;
      u.uSize.value = P.size;
      u.uMouseK.value = P.mouse;
      u.uMouse.value.copy(f.mouse);
      u.uIntensity.value = P.intensity * (1 - f.fin.tunnel); // pas de poussière dans le trou de ver (2)
      u.uTanHalf.value = f.tanHalf;
      geo.setDrawRange(0, f.reduced ? COUNT / 2 : COUNT);
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
      folder.add(P, "size", 0.4, 4, 0.05).name("Taille");
      folder.add(P, "mouse", 0, 3, 0.05).name("Parallaxe souris");
    },
  };
}

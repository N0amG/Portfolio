import * as THREE from "three";
import { TAN_HALF } from "../timeline";
import type { FrameParams, SceneContext } from "./types";

/* ───────────────────────────────────────────────────────────
   Outils partagés des éléments en vraie géométrie 3D (couche "front") qui doivent rester cohérents avec le trou noir
   sous tous les angles (5 · étoile compagne, 11 · jets) :
   - lensProject() (vertex) : projection par la caméra de la scène, puis, pour un point situé DERRIÈRE le plan qui passe
     par le trou noir perpendiculairement à la visée, lentille ponctuelle (image primaire) : θ = (β + √(β² + 4θE²)) / 2,
     avec le θE physique d'une source à distance finie, θE² = 2·Dls / (Dl·Ds) (rayon de Schwarzschild = 1, même
     déviation 2/b que le raymarching du shader). Le θE s'annule en passant le plan : pas de saut.
   - bhVis() (fragment) : la partie située derrière est multipliée par la transmission du trou noir (alpha de son image) :
     cachée par l'ombre et derrière le disque, la partie avant passe devant (même principe que 20 · texte en anneau).
   ─────────────────────────────────────────────────────────── */

export const LENS_VERT = /* glsl */ `
  uniform vec3 uCamPos;
  uniform vec2 uBhNdc;
  uniform float uAspect, uLensK, uLensOn;
  vec4 lensProject(vec3 w, out float behind){
    vec4 cp = projectionMatrix * viewMatrix * vec4(w, 1.0);
    float dl = length(uCamPos);
    float dls = -dot(w, uCamPos / dl);
    behind = smoothstep(-0.6, 0.6, dls);
    if (dls > 0.0 && cp.w > 0.0 && uLensOn > 0.5){
      vec2 q = (cp.xy / cp.w - uBhNdc) * vec2(uAspect, 1.0);
      float b = max(length(q), 1e-5);
      float te2 = uLensK * dls / (dl * (dl + dls));
      float th = 0.5 * (b + sqrt(b * b + 4.0 * te2));
      cp.xy = (uBhNdc + q * (th / b) / vec2(uAspect, 1.0)) * cp.w;
    }
    return cp;
  }
`;

export const LENS_FRAG = /* glsl */ `
  uniform sampler2D uBh;
  uniform vec2 uView;
  float bhVis(float behind){
    float tr = clamp(texture2D(uBh, gl_FragCoord.xy / uView).a, 0.0, 1.0);
    return mix(1.0, tr, behind);
  }
`;

export function lensUniforms(ctx: SceneContext) {
  return {
    uCamPos: { value: new THREE.Vector3() },
    uBhNdc: { value: new THREE.Vector2() },
    uAspect: { value: 1 },
    uLensK: { value: 2 / (TAN_HALF * TAN_HALF) }, // θE² en unités NDC verticales : 2·Dls/(Dl·Ds) / tan²(demi-champ)
    uLensOn: { value: 1 },
    uBh: { value: ctx.bhTex },
    uView: { value: new THREE.Vector2(1, 1) },
  };
}
type LensU = ReturnType<typeof lensUniforms>;

/** À appeler dans update() : pose de la caméra et centre du trou noir à l'écran. */
export function updateLens(u: LensU, f: FrameParams, lens: boolean) {
  u.uCamPos.value.copy(f.camPos);
  u.uBhNdc.value.copy(f.bhNdc);
  u.uAspect.value = f.width / f.height;
  u.uLensOn.value = lens ? 1 : 0;
  u.uLensK.value = 2 / (f.tanHalf * f.tanHalf); // le champ s'élargit pendant la plongée et le dézoom de la fin
}
const _v = new THREE.Vector3();
/** Même projection + lentille que lensProject(), côté JS : position NDC (x, y) d'un point monde, z = profondeur de visée. */
export function lensNdc(w: THREE.Vector3, f: FrameParams, out: THREE.Vector3) {
  const depth = _v.copy(w).sub(f.camPos).dot(f.camF);
  out.copy(w).applyMatrix4(f.viewProj);
  const dl = f.camPos.length(), dls = -w.dot(f.camPos) / dl, asp = f.width / f.height;
  if (dls > 0 && depth > 0) {
    const qx = (out.x - f.bhNdc.x) * asp, qy = out.y - f.bhNdc.y;
    const b = Math.max(Math.hypot(qx, qy), 1e-5);
    const te2 = ((2 / (f.tanHalf * f.tanHalf)) * dls) / (dl * (dl + dls));
    const k = (0.5 * (b + Math.sqrt(b * b + 4 * te2))) / b;
    out.x = f.bhNdc.x + (qx * k) / asp;
    out.y = f.bhNdc.y + qy * k;
  }
  out.z = depth;
  return out;
}

/** À appeler dans render() : taille de la cible pour lire la transmission du trou noir. */
export function updateView(u: LensU, ctx: SceneContext) {
  ctx.renderer.getDrawingBufferSize(u.uView.value);
}

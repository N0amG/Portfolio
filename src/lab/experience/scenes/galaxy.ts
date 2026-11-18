import * as THREE from "three";
import { FS_VERT } from "../shaders/common";
import { S } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   10 · Galaxie spirale de fond (couche "sky", slide S1).
   Dessinée dans la cible équirectangulaire du ciel (repère monde) : le shader du trou noir l'échantillonne à travers
   les rayons courbés, donc elle est déformée par la lentille (étirée en arc près de l'anneau d'Einstein).
   La galaxie est une image gnomonique (plan tangent) autour d'une direction fixe : noyau chaud, deux bras bleutés,
   poussière sombre dans les bras, quelques étoiles. Aucune géométrie à part.
   ─────────────────────────────────────────────────────────── */

const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uDir, uE1, uE2;
  uniform float uSize, uSpin, uTilt, uW, uTime;
  float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
  }
  void main(){
    float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.14159265;
    vec3 d = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
    float c = dot(d, uDir);
    if (c < 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    vec2 g = vec2(dot(d, uE1), dot(d, uE2)) / c / uSize;       // coordonnées sur le plan tangent, 1 = rayon de la galaxie
    // inclinaison du disque : on écrase un axe, puis on retourne dans le repère de la galaxie
    float ct = cos(uTilt), st = sin(uTilt);
    vec2 p = vec2(g.x * ct + g.y * st, -g.x * st + g.y * ct);
    p.y /= 0.42;                                               // disque vu en biais
    float r = length(p);
    if (r > 1.6) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    float th = atan(p.y, p.x) + uSpin * uTime;
    // deux bras en spirale logarithmique
    float arm = 0.5 + 0.5 * cos(2.0 * (th - 2.4 * log(r + 0.04)));
    arm = pow(arm, 2.2);
    float disk = exp(-r * 2.6);
    float grain = vn(p * 9.0 + 3.0) * 0.6 + vn(p * 21.0) * 0.4;
    float dust = smoothstep(0.35, 0.8, vn(p * 5.0 + 7.0 + arm * 2.0));
    float bulge = exp(-r * r * 38.0);
    vec3 armCol = mix(vec3(0.34, 0.5, 0.95), vec3(0.5, 0.84, 1.0), grain);   // bleu profond vers horizon bleu
    vec3 coreCol = vec3(1.0, 0.82, 0.55);                                    // noyau ambre
    vec3 col = armCol * disk * (0.12 + 0.88 * arm) * (0.45 + 0.9 * grain) * (1.0 - 0.55 * dust * arm) * 0.9;
    col += coreCol * bulge * 1.6 + vec3(1.0, 0.95, 0.88) * exp(-r * r * 400.0) * 1.2;
    // étoiles dans les bras
    vec2 sc = floor(p * 70.0);
    float star = step(0.985, h21(sc)) * exp(-dot(fract(p * 70.0) - 0.5, fract(p * 70.0) - 0.5) * 30.0) * disk * (0.3 + arm);
    col += star * vec3(0.9, 0.95, 1.0) * 1.4;
    col *= smoothstep(1.6, 0.9, r);
    gl_FragColor = vec4(col * uW, 1.0);
  }
`;

export function createGalaxy(): SceneElement {
  // direction fixe dans le repère monde (visible depuis S1, en haut à gauche du trou noir), taille angulaire en radians
  const P = { intensity: 2.4, size: 0.2, tilt: 0.55, spin: 0.012, az: -0.3, alt: 0.0 };
  const dir = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  let mat: THREE.ShaderMaterial, scene: THREE.Scene, tri: THREE.BufferGeometry;

  function aim() {
    // la caméra de S1 est sur +z et regarde vers −z : la direction (az, alt) part de −z
    dir.set(Math.sin(P.az) * Math.cos(P.alt), Math.sin(P.alt), -Math.cos(P.az) * Math.cos(P.alt)).normalize();
    e1.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    e2.crossVectors(e1, dir).normalize();
    // e1 pointe vers la droite à l'écran quand on regarde vers −z : on inverse pour garder l'orientation naturelle
    e1.negate();
  }

  return {
    id: "galaxie",
    label: "10 · Galaxie spirale",
    slides: [S(1)],
    cost: "leger",
    minTier: "basse",
    layers: ["sky"],
    init() {
      tri = new THREE.BufferGeometry();
      tri.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
      tri.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
      mat = new THREE.ShaderMaterial({
        uniforms: {
          uDir: { value: dir }, uE1: { value: e1 }, uE2: { value: e2 },
          uSize: { value: P.size }, uSpin: { value: P.spin }, uTilt: { value: P.tilt }, uW: { value: 0 }, uTime: { value: 0 },
        },
        vertexShader: FS_VERT, fragmentShader: FRAG,
        transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
      });
      const m = new THREE.Mesh(tri, mat);
      m.frustumCulled = false;
      scene = new THREE.Scene().add(m);
      aim();
    },
    update(f: FrameParams) {
      aim();
      const u = mat.uniforms;
      u.uSize.value = P.size; u.uSpin.value = P.spin; u.uTilt.value = P.tilt;
      u.uTime.value = f.time;
      u.uW.value = P.intensity * f.weight * f.weight * (3 - 2 * f.weight); // apparaît et s'éteint en douceur avec la transition
    },
    render(_layer, ctx: SceneContext) {
      ctx.renderer.render(scene, ctx.ortho);
    },
    dispose() {
      tri.dispose();
      mat.dispose();
    },
    gui(folder) {
      folder.add(P, "intensity", 0, 2, 0.05).name("Intensité");
      folder.add(P, "size", 0.08, 0.4, 0.005).name("Taille (rad)");
      folder.add(P, "tilt", -1.6, 1.6, 0.01).name("Inclinaison");
      folder.add(P, "az", -1.2, 1.2, 0.01).name("Azimut");
      folder.add(P, "alt", -0.6, 0.6, 0.01).name("Hauteur");
      folder.add(P, "spin", 0, 0.1, 0.002).name("Rotation des bras");
    },
  };
}

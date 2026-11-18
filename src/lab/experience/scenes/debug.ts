import * as THREE from "three";
import { FS_VERT } from "../shaders/common";
import { S } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   Élément factice (dev uniquement, éteint par défaut) : prouve le registre et deux points d'insertion.
   - "back" : un cube en fil de fer près du trou noir (caché par l'ombre et le disque) ;
   - "sky"  : une grille de méridiens et parallèles dans le fond échantillonné (courbée par la lentille).
   Actif sur S6 à S9. À allumer dans le panneau de réglages (Scènes → Test registre).
   ─────────────────────────────────────────────────────────── */

const GRID_FRAG = /* glsl */ `
  varying vec2 vUv; uniform float uW;
  void main(){
    vec2 g = abs(fract(vUv * vec2(24.0, 12.0)) - 0.5);
    float line = 1.0 - smoothstep(0.0, 0.04, min(g.x / 2.0, g.y));
    gl_FragColor = vec4(vec3(0.1, 0.6, 1.0) * line * 0.35 * uW, 1.0);
  }
`;

export function createDebugElement(): SceneElement {
  const P = { size: 2, grid: true };
  let cube: THREE.LineSegments, cubeScene: THREE.Scene;
  let gridMat: THREE.ShaderMaterial, gridScene: THREE.Scene, tri: THREE.BufferGeometry;
  let w = 0;

  return {
    id: "debug",
    label: "Test registre (dev)",
    slides: [S(6), S(7), S(8), S(9)],
    cost: "leger",
    minTier: "basse",
    layers: ["back", "sky"],
    enabledByDefault: false,
    init() {
      const mat = new THREE.LineBasicMaterial({ color: 0x33ffcc, transparent: true, blending: THREE.AdditiveBlending, depthTest: false });
      cube = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), mat);
      cube.position.set(6, 1.5, 0);
      cube.frustumCulled = false;
      cubeScene = new THREE.Scene().add(cube);
      tri = new THREE.BufferGeometry();
      tri.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
      tri.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
      gridMat = new THREE.ShaderMaterial({
        uniforms: { uW: { value: 0 } }, vertexShader: FS_VERT, fragmentShader: GRID_FRAG,
        transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
      });
      const m = new THREE.Mesh(tri, gridMat);
      m.frustumCulled = false;
      gridScene = new THREE.Scene().add(m);
    },
    update(f: FrameParams) {
      w = f.weight;
      cube.rotation.x += f.dt * 0.7;
      cube.rotation.y += f.dt * 1.1;
      cube.scale.setScalar(P.size * (f.reduced ? 0.5 : 1));
      (cube.material as THREE.LineBasicMaterial).opacity = w;
      gridMat.uniforms.uW.value = w;
    },
    render(layer, ctx: SceneContext) {
      if (layer === "back") ctx.renderer.render(cubeScene, ctx.camera);
      else if (P.grid) ctx.renderer.render(gridScene, ctx.ortho);
    },
    dispose() {
      cube.geometry.dispose();
      (cube.material as THREE.Material).dispose();
      gridMat.dispose();
      tri.dispose();
    },
    gui(folder) {
      folder.add(P, "size", 0.5, 6, 0.1).name("Taille du cube");
      folder.add(P, "grid").name("Grille dans le ciel");
    },
  };
}

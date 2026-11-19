import * as THREE from "three";
import { RING_TEXT } from "../../content";
import { S } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   20 · Texte en anneau (S6, l'approche).
   Une phrase écrite sur un ruban cylindrique incliné qui entoure le trou noir et tourne lentement (la texture défile).
   Vraie géométrie 3D, projetée par la caméra de la scène : la perspective suit tous les angles de vue.
   Couche "front" (après la composition, net et à la couleur exacte du texte) ; la moitié de l'anneau située
   DERRIÈRE le trou noir (côté opposé à la caméra) est multipliée par la transmission du trou noir (alpha de son
   image) : elle disparaît dans l'ombre et derrière le disque, la moitié avant passe devant.
   Les faces vues de l'intérieur (texte à l'envers) sont atténuées.
   ─────────────────────────────────────────────────────────── */

const SEG = 256;

const VERT = /* glsl */ `
  uniform float uR, uH;
  varying vec2 vUv;
  varying vec3 vW;
  void main(){
    vec4 w = modelMatrix * vec4(position.x * uR, position.y * uH, position.z * uR, 1.0);
    vW = w.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uTex, uBh;
  uniform vec2 uView;
  uniform vec3 uCam, uCol;
  uniform float uRep, uPhase, uAlpha, uBackDim;
  varying vec2 vUv;
  varying vec3 vW;
  void main(){
    float a = texture2D(uTex, vec2(vUv.x * uRep + uPhase, vUv.y)).a;
    // derrière le plan qui passe par le trou noir, perpendiculaire à la visée : caché par l'ombre et le disque
    float behind = smoothstep(-0.6, 0.6, -dot(vW, normalize(uCam)));
    float trans = clamp(texture2D(uBh, gl_FragCoord.xy / uView).a, 0.0, 1.0);
    float vis = mix(1.0, trans, behind) * (gl_FrontFacing ? 1.0 : uBackDim);
    gl_FragColor = vec4(uCol, a * vis * uAlpha);
  }
`;

export function createRing(): SceneElement {
  const P = { opacity: 0.85, radius: 7, height: 1.1, tilt: 0.38, tiltAz: 0.6, speed: 0.012, backDim: 0.35 };
  let scene: THREE.Scene, mesh: THREE.Mesh, mat: THREE.ShaderMaterial, geo: THREE.BufferGeometry;
  let tex: THREE.CanvasTexture | null = null;
  let root: HTMLElement;
  let texRatio = 20; // largeur / hauteur de la texture
  let ctxRef: SceneContext;
  const view = new THREE.Vector2();

  const family = () => getComputedStyle(root).getPropertyValue("--ff-display").trim() || "sans-serif";

  function draw() {
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    const H = 160, size = 104;
    const font = `700 ${size}px ${family()}`;
    g.font = font;
    const w = Math.ceil(g.measureText(RING_TEXT.toUpperCase()).width);
    c.width = w; c.height = H;
    g.font = font;
    g.fillStyle = "#fff";
    g.textBaseline = "middle";
    g.fillText(RING_TEXT.toUpperCase(), 0, H / 2 + 6);
    texRatio = w / H;
    tex?.dispose();
    tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = Math.min(8, ctxRef.renderer.capabilities.getMaxAnisotropy());
    tex.colorSpace = THREE.NoColorSpace;
    if (mat) mat.uniforms.uTex.value = tex;
  }

  return {
    id: "anneau",
    label: "20 · Texte en anneau",
    slides: [S(6)],
    cost: "leger",
    minTier: "basse",
    layers: ["front"],
    init(ctx: SceneContext) {
      ctxRef = ctx;
      root = ctx.root;
      // ruban : deux rangées de sommets (bas, haut) sur le cercle unité ; faces tournées vers l'extérieur
      const pos: number[] = [], uv: number[] = [], idx: number[] = [];
      for (let i = 0; i <= SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        pos.push(Math.cos(a), -0.5, Math.sin(a), Math.cos(a), 0.5, Math.sin(a));
        uv.push(1 - i / SEG, 0, 1 - i / SEG, 1); // u décroissant : le texte se lit de gauche à droite vu de l'extérieur
        if (i < SEG) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      draw();
      document.fonts.load(`700 100px ${family()}`).then(draw, () => {});
      mat = new THREE.ShaderMaterial({
        uniforms: {
          uTex: { value: tex }, uBh: { value: ctx.bhTex }, uView: { value: view },
          uCam: { value: new THREE.Vector3() }, uCol: { value: new THREE.Vector3(0.949, 0.937, 0.91) }, // #f2efe8, sortie écran (sRGB)
          uR: { value: 1 }, uH: { value: 1 }, uRep: { value: 1 }, uPhase: { value: 0 }, uAlpha: { value: 0 }, uBackDim: { value: 0.35 },
        },
        vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene = new THREE.Scene().add(mesh);
    },
    update(f: FrameParams) {
      const u = mat.uniforms;
      mesh.rotation.set(P.tilt, P.tiltAz, 0, "YXZ");
      u.uR.value = P.radius;
      u.uH.value = P.height;
      // nombre de répétitions de la phrase sur le tour, pour garder les proportions des lettres
      u.uRep.value = Math.max(1, Math.round((2 * Math.PI * P.radius) / (P.height * texRatio)));
      u.uPhase.value = (f.time * P.speed) % 1;
      u.uCam.value.copy(f.camPos);
      const w = f.weight * f.weight * (3 - 2 * f.weight);
      u.uAlpha.value = P.opacity * w;
      u.uBackDim.value = P.backDim;
    },
    render(_layer, ctx: SceneContext) {
      ctx.renderer.getDrawingBufferSize(view);
      ctx.renderer.render(scene, ctx.camera);
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      tex?.dispose();
      tex = null;
    },
    gui(folder) {
      folder.add(P, "opacity", 0, 1, 0.05).name("Opacité");
      folder.add(P, "radius", 3, 14, 0.1).name("Rayon");
      folder.add(P, "height", 0.3, 3, 0.05).name("Hauteur des lettres");
      folder.add(P, "tilt", -1.2, 1.2, 0.01).name("Inclinaison");
      folder.add(P, "tiltAz", -3.14, 3.14, 0.01).name("Axe d'inclinaison");
      folder.add(P, "speed", -0.1, 0.1, 0.001).name("Vitesse d'orbite (tours/s)");
      folder.add(P, "backDim", 0, 1, 0.05).name("Faces intérieures");
    },
  };
}

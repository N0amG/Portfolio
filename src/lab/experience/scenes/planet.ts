import * as THREE from "three";
import { PULSAR_POS, S } from "../timeline";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   7 · Planète à anneaux au premier plan (S4 → S5).
   La caméra quitte le pulsar en montant et en reculant (travelling rapide au début) : la planète, posée près de
   la trajectoire de départ, entre dans le cadre, défile très près de la caméra (forte parallaxe) puis recule dans
   le lointain. Fixe dans le monde, à ~27 du pulsar, qui est sa source de lumière (blanc-bleu).
   - Planète : sphère à bandes procédurales (turbulence 3D qui tourne lentement), tons ambre / ocre / rouille, terminateur
     doux. Anneaux : un quad dont le fragment calcule la densité radiale (bandes, grain, division de Cassini, bord
     fondu), couleur sable. Atmosphère fine : liseré de Fresnel sur la planète + coque additive très fine, plus lumineux
     côté éclairé.
   - Ombres : celle des anneaux sur la planète (rayon vers la lumière jusqu'au plan des anneaux, atténué par leur densité)
     et celle de la planète sur les anneaux (distance du rayon lumineux au centre de la sphère, bord adouci).
   - Couche "front", tampon de profondeur vidé avant la passe : la planète cache ce qui est derrière (trou noir,
     nébuleuse, étoiles) ; elle est toujours devant le plan du trou noir pendant son passage (pas de lentille).
   - Active de s = 2,9 à 4,2 (plage `range`), jamais de fondu visible : à S5 elle reste là, petite, devant la nébuleuse ; la nébuleuse passe devant elle : chaque fragment lit le patch raymarché de la nébuleuse (opacité + émission) sur sa ligne de visée et se rend transparent là où le gaz est dense (réglage « Occlusion »). Plage jusqu'à s = 4,35 (caméra au cœur du gaz, planète entièrement cachée).
   Aucune texture : tout est procédural.
   ─────────────────────────────────────────────────────────── */

const COMMON = /* glsl */ `
  float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float vn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }
  float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vn3(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  uniform vec3 uC, uL, uN, uCamPos;
  uniform float uR, uRin, uRout, uRingOp, uScale;
  // occlusion par la nébuleuse : le patch raymarché (uniforms uNeb*) est sur la ligne de visée ; son opacité (poussière)
  // et son émission cachent la planète quand le gaz passe devant elle (elle est derrière la nébuleuse vue de S5)
  uniform sampler2D uNebTex; uniform vec4 uNebC; uniform vec3 uNebE1, uNebE2; uniform float uOccK;
  float nebOcc(vec3 w){
    if (uNebC.w <= 0.0) return 1.0;
    vec3 d = normalize(w - uCamPos);
    float dc = dot(d, uNebC.xyz);
    if (dc <= 0.05) return 1.0;
    vec2 uv = vec2(dot(d, uNebE1), dot(d, uNebE2)) / dc * 0.5 + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 1.0;
    vec4 t = texture2D(uNebTex, uv);
    float o = clamp(t.a + dot(t.rgb, vec3(0.33)) * 0.6, 0.0, 1.0);
    return 1.0 - clamp(o * uOccK, 0.0, 1.0);
  }
  // densité des anneaux en fonction de u = (ρ − rin) / (rout − rin), 0..1
  float ringDensity(float u){
    float bands = 0.30 + 0.70 * vn1(u * 26.0 + 3.0) * (0.55 + 0.45 * vn1(u * 71.0));
    float grain = 0.75 + 0.25 * vn1(u * 330.0);
    float gap = 1.0 - 0.96 * smoothstep(0.50, 0.53, u) * (1.0 - smoothstep(0.58, 0.61, u));   // division de Cassini
    float inner = 0.35 + 0.65 * smoothstep(0.0, 0.16, u);                                          // anneau C : plus ténu
    float edge = smoothstep(0.0, 0.015, u) * (1.0 - smoothstep(0.965, 1.0, u));
    return clamp(bands * grain * gap * inner * edge * 1.25, 0.0, 1.0);
  }
`;

const PLANET_VERT = /* glsl */ `
  uniform vec3 uC; uniform float uR, uScale;
  varying vec3 vN, vW;
  void main(){
    vN = position;
    vW = uC + position * uR * uScale;
    gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  }
`;
const PLANET_FRAG = /* glsl */ `
  ${COMMON}
  uniform float uTime, uAtm, uLight;
  varying vec3 vN, vW;
  void main(){
    float occ = nebOcc(vW);
    if (occ < 0.004) discard;
    vec3 N = normalize(vN);
    vec3 V = normalize(uCamPos - vW);
    vec3 L = normalize(uL - vW);
    float lat = dot(N, uN);
    // bandes : latitude déformée par une turbulence 3D qui tourne lentement autour de l'axe
    float a = uTime * 0.012;
    vec3 q = N * 3.2; q.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * q.xz;
    float turb = vn3(q) * 0.6 + vn3(q * 2.3 + 5.0) * 0.4;
    float b = vn1(lat * 7.5 + turb * 1.8) * 0.6 + vn1(lat * 21.0 + turb * 3.0) * 0.4;
    vec3 c0 = vec3(0.93, 0.78, 0.55), c1 = vec3(0.80, 0.47, 0.20), c2 = vec3(0.42, 0.18, 0.09), c3 = vec3(0.26, 0.22, 0.26);
    vec3 alb = mix(c2, c1, smoothstep(0.25, 0.55, b));
    alb = mix(alb, c0, smoothstep(0.55, 0.85, b));
    alb = mix(alb, c3, smoothstep(0.30, 0.0, b) * 0.7);
    alb *= 0.85 + 0.3 * turb;
    float lam = dot(N, L);
    float diff = smoothstep(-0.08, 0.9, lam);
    // ombre des anneaux : rayon vers la lumière jusqu'au plan des anneaux
    float shadow = 1.0;
    float dn = dot(L, uN);
    if (abs(dn) > 1e-3){
      float t = -dot(vW - uC, uN) / dn;
      if (t > 0.0){
        float rho = length(vW + L * t - uC);
        float u = (rho - uRin * uScale) / ((uRout - uRin) * uScale);
        if (u > 0.0 && u < 1.0) shadow = exp(-ringDensity(u) * uRingOp * 3.0);
      }
    }
    vec3 lc = vec3(0.82, 0.93, 1.0);
    vec3 col = alb * lc * diff * shadow * uLight + alb * vec3(0.106, 0.302, 1.0) * 0.03;
    // atmosphère fine : liseré de Fresnel, plus lumineux côté éclairé
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.5);
    col += vec3(0.50, 0.76, 1.0) * rim * (0.10 + 0.9 * smoothstep(-0.25, 0.6, lam)) * uAtm;
    gl_FragColor = vec4(1.0 - exp(-col * 1.5), occ);
  }
`;

const SHELL_FRAG = /* glsl */ `
  ${COMMON}
  uniform float uAtm;
  varying vec3 vN, vW;
  void main(){
    float occ = nebOcc(vW);
    vec3 N = normalize(vN);
    vec3 V = normalize(uCamPos - vW);
    float k = clamp(-dot(N, V) / 0.34, 0.0, 1.0);      // 1 au bord de la planète, 0 au bord de la coque
    float lit = smoothstep(-0.3, 0.5, dot(N, normalize(uL - vW)));
    float g = pow(k, 1.6) * (0.08 + lit) * uAtm * occ;
    gl_FragColor = vec4(vec3(0.45, 0.72, 1.0) * g * 0.75, 1.0);
  }
`;
const SHELL_VERT = /* glsl */ `
  uniform vec3 uC; uniform float uR, uScale;
  varying vec3 vN, vW;
  void main(){
    vN = position;
    vW = uC + position * uR * 1.06 * uScale;
    gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  }
`;

const RING_VERT = /* glsl */ `
  uniform vec3 uC, uRa, uRb; uniform float uRout, uScale;
  varying vec2 vQ; varying vec3 vW;
  void main(){
    vQ = position.xy;
    vW = uC + (uRa * position.x + uRb * position.y) * uRout * uScale;
    gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  }
`;
const RING_FRAG = /* glsl */ `
  ${COMMON}
  uniform float uLight;
  varying vec2 vQ; varying vec3 vW;
  void main(){
    float rho = length(vQ) * uRout;
    float u = (rho - uRin) / (uRout - uRin);
    if (u <= 0.0 || u >= 1.0) discard;
    float occ = nebOcc(vW);
    float dens = ringDensity(u);
    vec3 pr = (vW - uC) / uScale;
    vec3 L = normalize(uL - vW), V = normalize(uCamPos - vW);
    float dl = dot(L, uN), dv = dot(V, uN);
    // éclairage : face éclairée pleine, face à l'ombre seulement par transparence (diffusion vers l'avant)
    float lit = (0.30 + 0.70 * abs(dl)) * (dl * dv > 0.0 ? 1.0 : 0.5);
    // ombre de la planète : distance de la ligne de lumière au centre de la sphère
    float b = dot(pr, L), d2 = max(dot(pr, pr) - b * b, 0.0);
    float shadow = b < 0.0 ? smoothstep(uR * 0.96, uR * 1.04, sqrt(d2)) : 1.0;
    float n = vn1(u * 40.0 + 7.0);
    vec3 alb = mix(vec3(0.78, 0.62, 0.42), vec3(0.58, 0.62, 0.68), n * 0.7);
    alb = mix(alb, vec3(0.95, 0.80, 0.55), vn1(u * 9.0) * 0.4);
    vec3 col = alb * vec3(0.82, 0.93, 1.0) * lit * shadow * uLight + alb * vec3(0.106, 0.302, 1.0) * 0.02;
    float edgeSoft = 1.0;
    gl_FragColor = vec4(1.0 - exp(-col * 1.5), dens * uRingOp * edgeSoft * occ);
  }
`;

export function createPlanet(): SceneElement {
  const P = {
    // position relative au pulsar (monde)
    ox: 5, oy: 8.9, oz: 27.3,
    radius: 4.2, ringIn: 1.45, ringOut: 2.7, ringOpacity: 0.9,
    occlusion: 3, tiltA: 0.55, tiltB: -0.35, light: 4.5, atmosphere: 1.8, spinSpeed: 1,
    sIn: 2.9, sIn1: 2.95, sOut0: 4.3, sOut1: 4.35,
  };
  let scene: THREE.Scene, planetMat: THREE.ShaderMaterial, shellMat: THREE.ShaderMaterial, ringMat: THREE.ShaderMaterial;
  let sphereGeo: THREE.SphereGeometry, shellGeo: THREE.SphereGeometry, quadGeo: THREE.PlaneGeometry;
  const all: THREE.ShaderMaterial[] = [];
  const pulsar = new THREE.Vector3(...PULSAR_POS);
  const C = new THREE.Vector3(), N = new THREE.Vector3(), Ra = new THREE.Vector3(), Rb = new THREE.Vector3();
  const CAM = new THREE.Vector3(), zero4 = new THREE.Vector4();
  const emptyTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  emptyTex.needsUpdate = true;
  let bh: FrameParams["bh"];

  function frame() {
    C.set(pulsar.x + P.ox, pulsar.y + P.oy, pulsar.z + P.oz);
    N.set(Math.sin(P.tiltA) * Math.cos(P.tiltB), Math.cos(P.tiltA), Math.sin(P.tiltA) * Math.sin(P.tiltB)).normalize();
    Ra.crossVectors(N, new THREE.Vector3(0, 0, 1));
    if (Ra.lengthSq() < 1e-4) Ra.set(1, 0, 0);
    Ra.normalize();
    Rb.crossVectors(N, Ra);
  }

  return {
    id: "planete",
    label: "7 · Planète à anneaux (S4 → S5)",
    slides: [S(4)],
    range: [2.9, 4.35],
    cost: "leger", // à confirmer par la mesure (voir SPEC.md, lot V5)
    minTier: "basse",
    layers: ["front"],
    init() {
      frame();
      const shared = () => ({
        uC: { value: C }, uL: { value: pulsar }, uN: { value: N }, uCamPos: { value: CAM },
        uNebTex: { value: null }, uNebC: { value: new THREE.Vector4() }, uNebE1: { value: new THREE.Vector3() }, uNebE2: { value: new THREE.Vector3() }, uOccK: { value: 1 }, uR: { value: P.radius }, uRin: { value: 1 }, uRout: { value: 1 }, uRingOp: { value: 1 }, uScale: { value: 1 },
        uLight: { value: 1 }, uAtm: { value: 1 }, uTime: { value: 0 },
      });
      sphereGeo = new THREE.SphereGeometry(1, 64, 48);
      shellGeo = new THREE.SphereGeometry(1, 48, 32);
      quadGeo = new THREE.PlaneGeometry(2, 2, 1, 1);
      planetMat = new THREE.ShaderMaterial({ uniforms: shared(), vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG, depthTest: true, depthWrite: true });
      shellMat = new THREE.ShaderMaterial({
        uniforms: shared(), vertexShader: SHELL_VERT, fragmentShader: SHELL_FRAG,
        side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false,
      });
      const ru = { ...shared(), uRa: { value: Ra }, uRb: { value: Rb } };
      ringMat = new THREE.ShaderMaterial({
        uniforms: ru, vertexShader: RING_VERT, fragmentShader: RING_FRAG,
        side: THREE.DoubleSide, transparent: true, depthTest: true, depthWrite: false,
      });
      all.push(planetMat, shellMat, ringMat);
      planetMat.transparent = true;
      const planet = new THREE.Mesh(sphereGeo, planetMat), shell = new THREE.Mesh(shellGeo, shellMat), ring = new THREE.Mesh(quadGeo, ringMat);
      shell.renderOrder = 1; ring.renderOrder = 2;
      for (const m of [planet, shell, ring]) m.frustumCulled = false;
      scene = new THREE.Scene().add(planet, shell, ring);
    },
    update(f: FrameParams) {
      CAM.copy(f.camPos);
      const k = THREE.MathUtils.smoothstep(f.s, P.sIn, P.sIn1) * (1 - THREE.MathUtils.smoothstep(f.s, P.sOut0, P.sOut1));
      bh = f.bh;
      for (const m of all) {
        const u = m.uniforms;
        u.uOccK.value = P.occlusion;
        u.uR.value = P.radius; u.uRin.value = P.radius * P.ringIn; u.uRout.value = P.radius * P.ringOut;
        u.uRingOp.value = P.ringOpacity; u.uScale.value = k; u.uLight.value = P.light; u.uAtm.value = P.atmosphere;
        u.uTime.value = f.time * P.spinSpeed;
      }
    },
    render(_layer, ctx: SceneContext) {
      // patch de la nébuleuse de cette image (rempli par nebula.ts pendant les update)
      const nb = bh.neb;
      for (const m of all) {
        const u = m.uniforms;
        u.uNebTex.value = nb.tex.value ?? emptyTex;
        (u.uNebC.value as THREE.Vector4).copy(nb.tex.value ? nb.c : zero4);
        (u.uNebE1.value as THREE.Vector3).copy(nb.e1); (u.uNebE2.value as THREE.Vector3).copy(nb.e2);
      }
      ctx.renderer.clearDepth();
      ctx.renderer.render(scene, ctx.camera);
    },
    dispose() {
      emptyTex.dispose(); sphereGeo.dispose(); shellGeo.dispose(); quadGeo.dispose();
      for (const m of all) m.dispose();
    },
    gui(folder) {
      const pos = folder.addFolder("Position (relative au pulsar)");
      for (const k of ["ox", "oy", "oz"] as const) pos.add(P, k, -60, 60, 0.1).name(k === "ox" ? "x" : k === "oy" ? "y" : "z").onChange(frame);
      folder.add(P, "radius", 1, 12, 0.05).name("Rayon de la planète");
      folder.add(P, "ringIn", 1.05, 2.5, 0.01).name("Anneaux : rayon intérieur (× R)");
      folder.add(P, "ringOut", 1.5, 4.5, 0.01).name("Anneaux : rayon extérieur (× R)");
      folder.add(P, "ringOpacity", 0, 1.5, 0.01).name("Opacité des anneaux");
      folder.add(P, "tiltA", 0, 1.5, 0.01).name("Inclinaison de l'axe").onChange(frame);
      folder.add(P, "tiltB", -3.14, 3.14, 0.01).name("Direction de l'inclinaison").onChange(frame);
      folder.add(P, "light", 0, 10, 0.05).name("Éclairage du pulsar");
      folder.add(P, "atmosphere", 0, 3, 0.05).name("Atmosphère");
      folder.add(P, "occlusion", 0, 3, 0.05).name("Occlusion par la nébuleuse");
      folder.add(P, "spinSpeed", 0, 10, 0.1).name("Vitesse des bandes");
      const w = folder.addFolder("Fenêtre en s (fondu en taille)");
      w.add(P, "sIn", 3, 3.5, 0.01).name("Entrée : début");
      w.add(P, "sIn1", 3, 3.6, 0.01).name("Entrée : fin");
      w.add(P, "sOut0", 3.4, 4, 0.01).name("Sortie : début");
      w.add(P, "sOut1", 3.5, 4, 0.01).name("Sortie : fin");
    },
  };
}

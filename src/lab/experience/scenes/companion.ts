import * as THREE from "three";
import { S, TAN_HALF } from "../timeline";
import { LENS_FRAG, LENS_VERT, lensNdc, lensUniforms, updateLens, updateView } from "./lens";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   5 · Étoile compagne dévorée (S2, dessous à gauche).
   Une étoile bleu-blanc, vraie géométrie fixe dans le monde (repère du trou noir), déformée en goutte vers le trou
   noir (elle déborde de son lobe de Roche). Depuis sa pointe (L1), sa matière est arrachée en un filament de plasma
   qui spirale dans le sens de rotation du disque, descend dans son plan et le rejoint tangentiellement.
   - Jamais de fondu : l'étoile est là dès qu'elle entre dans le cadre (hors champ sur S1).
   - Sur S2, posée : la surface coule vers la pointe, la goutte respire, et l'arrière-plan autour d'elle ondule et
     tourbillonne (effet d'optique : copie de l'image autour de l'étoile, rééchantillonnée en lentille + remous).
   - S2 → S3 : l'étoile est réellement dévorée, pilotée par s (donc réversible) : elle s'étire (spaghettification),
     glisse le long du filament en rétrécissant, plonge dans le disque (éclair du point chaud), puis la queue du
     filament s'y vide. Au retour S3 → S2, l'exact inverse.
   - Étoile, halo et filament : couche "front" ; la partie située derrière le trou noir est courbée par la lentille et
     cachée par l'ombre et le disque (scenes/lens.ts).
   - Point chaud : dans le shader du trou noir (uniform uHot) : vraie lentille, bloom, queue entraînée par le disque.
   ─────────────────────────────────────────────────────────── */

const N = 240; // échantillons du filament
const COPY = 1024; // côté (px) de la copie de l'image autour de l'étoile pour l'effet d'optique

const STAR_VERT = /* glsl */ `
  ${LENS_VERT}
  uniform vec3 uStar, uToBH;
  uniform float uRad, uElong, uTime;
  varying vec3 vP, vW;
  varying float vBehind, vTip;
  void main(){
    vec3 p = normalize(position);
    float c = dot(p, uToBH);
    float k = max(c, 0.0);
    float el = uElong * (1.0 + 0.07 * sin(uTime * 1.7) + 0.04 * sin(uTime * 4.3 + p.y * 5.0));
    // goutte : allongée vers le trou noir et pincée en pointe (lobe de Roche rempli, puis spaghettification)
    vec3 lat = p - c * uToBH;
    float pinch = 0.4 * smoothstep(0.5, 1.0, k) * min(el, 1.0) + 0.5 * smoothstep(1.0, 4.0, el) * k;
    vec3 q = uToBH * c * (1.0 + el * k * k) + lat * (1.0 - pinch);
    // la face arrière se fait aussi étirer (marée), en moins
    q -= uToBH * 0.18 * el * pow(max(-c, 0.0), 2.0);
    vec3 w = uStar + uRad * q;
    vP = p; vW = w; vTip = k;
    gl_Position = lensProject(w, vBehind);
  }
`;

const STAR_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform vec3 uCamPos, uToBH;
  uniform float uTime, uEat, uBright;
  varying vec3 vP, vW;
  varying float vBehind, vTip;
  float h3(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vn(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main(){
    vec3 n = normalize(vP);
    float mu = clamp(dot(n, normalize(uCamPos - vW)), 0.0, 1.0);
    float c = dot(n, uToBH);
    vec3 lat = n - c * uToBH;
    // la matière glisse sur la surface vers la pointe : granulation advectée + coulées étirées
    float gran = vn(n * 9.0 - uToBH * uTime * 0.7) * 0.6 + vn(n * 23.0 - uToBH * uTime * 1.4) * 0.4;
    float streak = vn(lat * 13.0 + uToBH * (c * 3.0 - uTime * 1.1)) * smoothstep(-0.2, 0.9, c);
    vec3 col = mix(vec3(0.50, 0.78, 1.0), vec3(0.93, 0.97, 1.0), pow(mu, 0.6));   // bord #7fd6ff -> cœur blanc bleuté
    col *= (0.55 + 0.45 * pow(mu, 0.5)) * (0.8 + 0.3 * gran + 0.35 * streak);
    // face tournée vers le trou noir éclairée par le disque, pointe arrachée qui chauffe
    col += vec3(1.0, 0.70, 0.28) * 0.35 * pow(max(c, 0.0), 2.0);
    col = mix(col, vec3(1.0, 0.957, 0.878), smoothstep(0.7, 1.0, vTip) * 0.6);
    col = mix(col, vec3(1.0, 0.80, 0.50), smoothstep(0.3, 0.9, uEat) * 0.6);   // dévorée : elle chauffe
    gl_FragColor = vec4(min(col * uBright, vec3(1.0)), bhVis(vBehind));
  }
`;

// Billboard autour de l'étoile (halo additif, et effet d'optique)
const QUAD_VERT = /* glsl */ `
  ${LENS_VERT}
  uniform vec3 uStar, uR, uU;
  uniform float uSize;
  varying vec2 vQ;
  varying float vBehind;
  void main(){
    vQ = position.xy;
    gl_Position = lensProject(uStar + (uR * position.x + uU * position.y) * uSize, vBehind);
  }
`;

const HALO_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uHalo;
  varying vec2 vQ;
  varying float vBehind;
  void main(){
    float d = length(vQ);
    float g = (exp(-d * d * 9.0) * 0.55 + exp(-d * 4.5) * 0.25) * (1.0 - smoothstep(0.8, 1.0, d));
    gl_FragColor = vec4(vec3(0.62, 0.84, 1.0) * g * uHalo, bhVis(vBehind));
  }
`;

// Effet d'optique : l'image déjà rendue autour de l'étoile est rééchantillonnée (lentille, remous, tourbillon).
const OPTIC_FRAG = /* glsl */ `
  uniform sampler2D uCopy;
  uniform vec2 uPos, uC;
  uniform float uRpx, uTime, uAmt, uCopySize, uLensE;
  varying vec2 vQ;
  void main(){
    vec2 d = gl_FragCoord.xy - uC;
    float r = length(d) / uRpx;   // en rayons de l'étoile
    float a = atan(d.y, d.x);
    float near = exp(-max(r - 1.0, 0.0) * 0.8);
    float sw = 0.45 * near * (0.65 + 0.35 * sin(uTime * 1.1 + r * 2.5));                          // tourbillon
    float rip = 0.09 * near * sin(r * 6.5 - uTime * 2.6 + 1.5 * sin(a * 3.0 + uTime * 0.8));     // ondes de chaleur
    float rs = max(r - uLensE * uLensE / max(r, 0.4), 0.0) + rip;                                  // lentille : θ − θE²/θ
    vec2 sp = uC + vec2(cos(a + sw), sin(a + sw)) * rs * uRpx;
    vec3 col = texture2D(uCopy, clamp((sp - uPos) / uCopySize, 0.0, 1.0)).rgb;
    float m = (1.0 - smoothstep(2.0, 3.0, r)) * smoothstep(0.0, 0.05, 1.0 - max(abs(vQ.x), abs(vQ.y)));
    gl_FragColor = vec4(col, m * uAmt);
  }
`;

const STREAM_VERT = /* glsl */ `
  ${LENS_VERT}
  attribute vec3 aC, aTan;
  attribute vec3 aU;   // x = t le long du filament (0 = centre de l'étoile au repos, 1 = disque), y = côté (-1..1), z = abscisse curviligne
  uniform float uWidth;
  varying vec3 vU;
  varying float vBehind, vNear;
  void main(){
    vec3 v = normalize(uCamPos - aC);
    vNear = smoothstep(5.0, 13.0, distance(uCamPos, aC));   // la caméra frôle le filament pendant certaines boucles
    vec3 sd = cross(aTan, v);
    float l = length(sd);
    sd = l > 1e-4 ? sd / l : vec3(0.0, 1.0, 0.0);
    float w = uWidth * (0.55 + 0.9 * aU.x) * (1.0 + 0.6 * smoothstep(0.85, 1.0, aU.x));   // s'élargit en arrivant
    vU = aU;
    gl_Position = lensProject(aC + sd * aU.y * w * 3.0, vBehind);   // ×3 : place pour le halo
  }
`;

const STREAM_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uTime, uFlow, uBright, uAbsorb, uStart;
  varying vec3 vU;
  varying float vBehind, vNear;
  float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
  float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
  void main(){
    float t = vU.x, v = vU.y * 3.0, sa = vU.z;   // v : largeur du cœur = 1
    float s = sa - uTime * uFlow;               // la matière descend vers le disque
    float o = 0.32 * sin(s * 1.3 + 1.7);        // deux brins tressés
    float c1 = exp(-pow((v - o) * 2.4, 2.0)), c2 = exp(-pow((v + o * 0.8) * 2.6, 2.0));
    float core = max(c1, c2 * 0.8);
    float clump = 0.55 + 0.9 * n1(s * 1.6) * n1(s * 0.47 + 9.0);
    float halo = exp(-pow(v * 0.9, 2.0)) * 0.22;
    // naît à la pointe de l'étoile (uStart, qui avance quand l'étoile est dévorée), chauffe, se fond dans le point chaud
    float along = smoothstep(uStart, uStart + 0.5, sa) * (0.4 + 0.8 * t * t) * (1.0 - smoothstep(0.86, 1.0, t));
    vec3 col = mix(vec3(0.80, 0.90, 1.0), vec3(1.0, 0.957, 0.878), smoothstep(0.0, 0.3, t));   // bleu-blanc -> #fff4e0
    col = mix(col, vec3(1.0, 0.702, 0.278), smoothstep(0.25, 0.65, t));                       // -> ambre #ffb347
    col = mix(col, vec3(1.0, 0.353, 0.122), smoothstep(0.6, 1.0, t) * 0.75);                   // -> orange plasma #ff5a1f
    col = mix(col, vec3(1.0, 0.96, 0.9), core * clump * 0.35);
    float I = along * (core * clump + halo) * uBright;
    // bords plus froids : ils absorbent un peu la lumière du disque derrière (contraste)
    float ab = uAbsorb * exp(-pow(v * 0.75, 2.0)) * smoothstep(uStart, uStart + 0.5, sa) * (1.0 - smoothstep(0.8, 1.0, t));
    float k = bhVis(vBehind) * vNear;
    gl_FragColor = vec4((1.0 - exp(-col * I * 1.6)) * k, ab * k);   // prémultiplié, saturation douce
  }
`;

export function createCompanion(): SceneElement {
  const P = {
    orbitR: 19, phi: 0.65, height: 7, radius: 1.35, elong: 0.6,
    spiral: 2.4, joinR: 9.0, width: 0.16, flow: 1.6, stream: 1.6, absorb: 0.45,
    star: 1.0, halo: 0.7, hot: 0.9, flash: 3.5, optic: 1.0, opticLens: 0.75, eatStart: 1.02, eatEnd: 1.9, lens: true,
  };
  let scene: THREE.Scene, opticScene: THREE.Scene;
  let starMat: THREE.ShaderMaterial, haloMat: THREE.ShaderMaterial, opticMat: THREE.ShaderMaterial, streamMat: THREE.ShaderMaterial;
  let starGeo: THREE.BufferGeometry, quadGeo: THREE.BufferGeometry, streamGeo: THREE.BufferGeometry;
  let copyTex: THREE.FramebufferTexture;
  let lu: ReturnType<typeof lensUniforms>;
  const rest = new THREE.Vector3(); // centre de l'étoile au repos
  const center = new THREE.Vector3(), dir = new THREE.Vector3(), ndc = new THREE.Vector3();
  const pts: THREE.Vector3[] = [];
  const cum: number[] = [];
  let joinPhi = 0, len = 1;
  const optic = { on: false, x: 0, y: 0, rNdc: 0 };
  const buf = new THREE.Vector2(), copyPos = new THREE.Vector2();

  /** Trajectoire du filament (CPU, recalculée quand un réglage change) : du centre de l'étoile au disque, en spirale. */
  function build() {
    rest.set(P.orbitR * Math.cos(P.phi), P.height, P.orbitR * Math.sin(P.phi));
    const rc = Math.hypot(rest.x, rest.z), phiS = Math.atan2(rest.z, rest.x);
    joinPhi = phiS - P.spiral;
    pts.length = cum.length = 0;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      // départ quasi radial (chute), arrivée tangentielle dans le sens de rotation du disque (azimut décroissant)
      const r = rc + (P.joinR - rc) * (1 - (1 - t) * (1 - t));
      const a = phiS - P.spiral * Math.pow(t, 1.4);
      pts.push(new THREE.Vector3(r * Math.cos(a), P.height * (1 - t) * (1 - t), r * Math.sin(a)));
      cum.push(i ? cum[i - 1] + pts[i].distanceTo(pts[i - 1]) : 0);
    }
    len = cum[N];
    const C = new Float32Array((N + 1) * 6), T = new Float32Array((N + 1) * 6), U = new Float32Array((N + 1) * 6);
    const tan = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      tan.subVectors(pts[Math.min(i + 1, N)], pts[Math.max(i - 1, 0)]).normalize();
      for (let k = 0; k < 2; k++) {
        const j = (i * 2 + k) * 3;
        C.set([pts[i].x, pts[i].y, pts[i].z], j);
        T.set([tan.x, tan.y, tan.z], j);
        U.set([i / N, k ? 1 : -1, cum[i]], j);
      }
    }
    streamGeo.setAttribute("aC", new THREE.BufferAttribute(C, 3));
    streamGeo.setAttribute("aTan", new THREE.BufferAttribute(T, 3));
    streamGeo.setAttribute("aU", new THREE.BufferAttribute(U, 3));
    streamGeo.setAttribute("position", new THREE.BufferAttribute(C, 3)); // requis par three, non utilisé
  }

  /** Point et tangente du filament à l'abscisse curviligne sa. */
  function along(sa: number, outP: THREE.Vector3, outT: THREE.Vector3) {
    let i = 0;
    while (i < N - 1 && cum[i + 1] < sa) i++;
    const u = THREE.MathUtils.clamp((sa - cum[i]) / Math.max(cum[i + 1] - cum[i], 1e-6), 0, 1);
    outP.lerpVectors(pts[i], pts[i + 1], u);
    outT.subVectors(pts[Math.min(i + 2, N)], pts[Math.max(i - 1, 0)]).normalize();
  }

  return {
    id: "compagne",
    label: "5 · Étoile compagne dévorée",
    slides: [S(2)],
    cost: "moyen",
    minTier: "moyenne",
    layers: ["front"],
    init(ctx: SceneContext) {
      lu = lensUniforms(ctx);
      const common = { ...lu, uTime: { value: 0 }, uStar: { value: center } };
      starGeo = new THREE.SphereGeometry(1, 72, 48);
      starMat = new THREE.ShaderMaterial({
        uniforms: { ...common, uToBH: { value: dir }, uRad: { value: 1 }, uElong: { value: 0 }, uBright: { value: 1 }, uEat: { value: 0 } },
        vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
        transparent: true, depthTest: true, depthWrite: true,
      });
      quadGeo = new THREE.PlaneGeometry(2, 2);
      const quadU = { uR: { value: new THREE.Vector3() }, uU: { value: new THREE.Vector3() } };
      haloMat = new THREE.ShaderMaterial({
        uniforms: { ...common, ...quadU, uSize: { value: 1 }, uHalo: { value: 1 } },
        vertexShader: QUAD_VERT, fragmentShader: HALO_FRAG,
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      copyTex = new THREE.FramebufferTexture(COPY, COPY);
      opticMat = new THREE.ShaderMaterial({
        uniforms: {
          ...common, ...quadU, uSize: { value: 1 }, uCopy: { value: copyTex }, uPos: { value: copyPos }, uC: { value: new THREE.Vector2() },
          uRpx: { value: 1 }, uAmt: { value: 1 }, uCopySize: { value: COPY }, uLensE: { value: 0.75 },
        },
        vertexShader: QUAD_VERT, fragmentShader: OPTIC_FRAG,
        transparent: true, depthTest: false, depthWrite: false,
      });
      streamGeo = new THREE.BufferGeometry();
      const idx: number[] = [];
      for (let i = 0; i < N; i++) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      streamGeo.setIndex(idx);
      build();
      streamMat = new THREE.ShaderMaterial({
        uniforms: { ...common, uWidth: { value: 1 }, uFlow: { value: 1 }, uBright: { value: 1 }, uAbsorb: { value: 0 }, uStart: { value: 0 } },
        vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG,
        transparent: true, side: THREE.DoubleSide, depthTest: true, depthWrite: false,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      });
      const opt = new THREE.Mesh(quadGeo, opticMat);
      opt.frustumCulled = false;
      opticScene = new THREE.Scene().add(opt);
      const halo = new THREE.Mesh(quadGeo, haloMat), body = new THREE.Mesh(starGeo, starMat), stream = new THREE.Mesh(streamGeo, streamMat);
      halo.renderOrder = 0; body.renderOrder = 1; stream.renderOrder = 2;
      for (const m of [halo, body, stream]) m.frustumCulled = false;
      scene = new THREE.Scene().add(halo, body, stream);
    },
    update(f: FrameParams) {
      updateLens(lu, f, P.lens);
      // progression de la dévoration, pilotée par la position de la caméra (réversible) : 0 sur S2, 1 avant S3
      const e = THREE.MathUtils.smoothstep(f.s, P.eatStart, P.eatEnd);
      const gone = THREE.MathUtils.smoothstep(e, 0.35, 0.88);
      const rad = P.radius * (1 - gone);
      const elong = P.elong + 3.5 * Math.pow(e, 1.3);
      // le centre glisse le long du filament ; une fois l'étoile disparue, la queue du filament se vide dans le disque
      const sCenter = len * 0.92 * Math.pow(e, 1.25);
      const start = Math.max(sCenter + rad * (1 + elong) * 0.85, len * THREE.MathUtils.smoothstep(e, 0.8, 1));
      along(sCenter, center, dir);

      starMat.uniforms.uTime.value = f.time;
      const su = starMat.uniforms;
      su.uRad.value = rad; su.uElong.value = elong; su.uBright.value = P.star; su.uEat.value = e;
      const hu = haloMat.uniforms, ou = opticMat.uniforms;
      hu.uR.value.copy(f.camR); hu.uU.value.copy(f.camU);
      hu.uSize.value = Math.max(rad, 0.01) * 4.5; hu.uHalo.value = P.halo;
      const u = streamMat.uniforms;
      u.uWidth.value = P.width * (1 + 1.5 * e * (1 - THREE.MathUtils.smoothstep(e, 0.85, 1)));
      u.uFlow.value = P.flow * (1 + 1.5 * e); u.uBright.value = P.stream * (1 + 1.2 * e);
      u.uAbsorb.value = P.absorb; u.uStart.value = start;

      // effet d'optique : centre et rayon apparents de l'étoile (même lentille que les shaders)
      lensNdc(center, f, ndc);
      const rNdc = ndc.z > 0.5 ? rad / ndc.z / TAN_HALF : 0;
      optic.on = P.optic > 0 && rNdc > 0.004 && Math.abs(ndc.x) < 1.6 && Math.abs(ndc.y) < 1.6;
      optic.x = ndc.x; optic.y = ndc.y; optic.rNdc = rNdc;
      ou.uAmt.value = P.optic * (1 - gone); ou.uLensE.value = P.opticLens;

      // point chaud : ravivé quand on quitte S1, éclair quand le cœur de l'étoile plonge, puis il s'éteint avant S3
      const flash = P.flash * Math.exp(-Math.pow((e - 0.86) / 0.07, 2));
      const hot = P.hot * THREE.MathUtils.smoothstep(f.s, 0, 0.5) * (1 - THREE.MathUtils.smoothstep(e, 0.88, 1)) + flash * (1 - THREE.MathUtils.smoothstep(e, 0.9, 1));
      const fl = P.flash > 0 ? flash / P.flash : 0;
      f.bh.hot.set(joinPhi, P.joinR, 1.1 + 1.2 * fl, hot * (0.85 + 0.15 * Math.sin(f.time * 5.3) * Math.sin(f.time * 2.1)));
    },
    render(_layer, ctx: SceneContext) {
      updateView(lu, ctx);
      const r = ctx.renderer;
      if (optic.on) {
        // copie de l'image autour de l'étoile (avant de la dessiner), puis rééchantillonnage déformé
        r.getDrawingBufferSize(buf);
        const cx = (optic.x * 0.5 + 0.5) * buf.x, cy = (optic.y * 0.5 + 0.5) * buf.y;
        const rpx = optic.rNdc * 0.5 * buf.y;
        copyPos.set(
          Math.round(THREE.MathUtils.clamp(cx - COPY / 2, 0, Math.max(0, buf.x - COPY))),
          Math.round(THREE.MathUtils.clamp(cy - COPY / 2, 0, Math.max(0, buf.y - COPY))),
        );
        r.copyFramebufferToTexture(copyTex, copyPos);
        const ou = opticMat.uniforms;
        ou.uC.value.set(cx, cy);
        ou.uRpx.value = Math.min(rpx, (COPY / 2 - 4) / 3); // l'effet tient dans la copie (rayon d'action : 3 rayons d'étoile)
        ou.uSize.value = haloMat.uniforms.uSize.value * (3 / 4.5) * (ou.uRpx.value / rpx);
        r.render(opticScene, ctx.camera);
      }
      r.clearDepth(); // l'étoile cache le filament qui passe derrière elle
      r.render(scene, ctx.camera);
    },
    dispose() {
      starGeo.dispose(); quadGeo.dispose(); streamGeo.dispose(); copyTex.dispose();
      starMat.dispose(); haloMat.dispose(); opticMat.dispose(); streamMat.dispose();
    },
    gui(folder) {
      const geo = folder.addFolder("Position et forme");
      geo.add(P, "orbitR", 13, 30, 0.1).name("Distance au trou noir").onChange(build);
      geo.add(P, "phi", -3.14, 3.14, 0.01).name("Azimut").onChange(build);
      geo.add(P, "height", -9, 9, 0.05).name("Hauteur / disque").onChange(build);
      geo.add(P, "radius", 0.5, 3, 0.05).name("Rayon de l'étoile");
      geo.add(P, "elong", 0, 1.5, 0.01).name("Goutte (lobe de Roche)");
      geo.add(P, "spiral", 0.5, 4.5, 0.01).name("Enroulement du filament (rad)").onChange(build);
      geo.add(P, "joinR", 4, 12, 0.1).name("Rayon d'impact sur le disque").onChange(build);
      geo.close();
      folder.add(P, "star", 0, 2, 0.05).name("Éclat de l'étoile");
      folder.add(P, "halo", 0, 2, 0.05).name("Halo");
      folder.add(P, "optic", 0, 1, 0.05).name("Effet d'optique autour");
      folder.add(P, "opticLens", 0, 1.2, 0.01).name("Effet d'optique : lentille");
      folder.add(P, "stream", 0, 3, 0.05).name("Éclat du filament");
      folder.add(P, "absorb", 0, 1, 0.05).name("Absorption (bords sombres)");
      folder.add(P, "width", 0.04, 0.6, 0.01).name("Largeur du filament");
      folder.add(P, "flow", 0, 5, 0.05).name("Vitesse de la matière");
      folder.add(P, "hot", 0, 3, 0.05).name("Point chaud");
      folder.add(P, "flash", 0, 8, 0.1).name("Éclair à l'impact");
      folder.add(P, "eatStart", 1, 1.5, 0.01).name("Dévoration : début (s)");
      folder.add(P, "eatEnd", 1.5, 2, 0.01).name("Dévoration : fin (s)");
      folder.add(P, "lens").name("Lentille (partie derrière)");
    },
  };
}
